'use strict';

// Vercel automatically serves this Node function at /api/github.
const USERNAME = 'aeronecarlpenol-byte';
const TTL = 15 * 60 * 1000;
const cache = new Map();
const pending = new Map();
let githubRetryAt = 0;

class SourceError extends Error {
  constructor(message, status = 502, retryAt = Date.now() + 60000) {
    super(message);
    this.status = status;
    this.retryAt = retryAt;
  }
}

async function request(url, github = true) {
  if (github && Date.now() < githubRetryAt) {
    throw new SourceError('GitHub rate limit reached. Please try again after the reset.', 429, githubRetryAt);
  }
  const headers = github ? { Accept: 'application/vnd.github+json', 'User-Agent': 'Aerone-Portfolio' } : {};
  // Optional server-only credential. Never sent to the calendar service or returned to the browser.
  if (github && process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(12000) });
  if (!response.ok) {
    const limited = response.status === 429 || (response.status === 403 &&
      (response.headers.get('x-ratelimit-remaining') === '0' || response.headers.has('retry-after')));
    if (limited) {
      const retry = Number(response.headers.get('retry-after')) * 1000;
      const reset = Number(response.headers.get('x-ratelimit-reset')) * 1000;
      const retryAt = Math.max(Date.now() + 60000, Date.now() + retry, reset);
      if (github) githubRetryAt = retryAt;
      throw new SourceError('Source rate limit reached. Please try again after the reset.', 429, retryAt);
    }
    throw new SourceError(response.status === 404 ? 'GitHub account or resource was not found.' :
      'The data source is temporarily unavailable.', response.status === 404 ? 404 : 502);
  }
  return { data: await response.json(), response };
}

async function load(resource) {
  const base = `https://api.github.com/users/${USERNAME}`;
  let data;
  let source = 'GitHub REST API';
  let sourceUpdatedAt = null;
  if (resource === 'profile') {
    ({ data } = await request(base));
    if (data.login?.toLowerCase() !== USERNAME || ![data.public_repos, data.followers, data.following].every(Number.isInteger)) {
      throw new SourceError('GitHub returned an invalid profile.');
    }
    data = { login: data.login, name: data.name, bio: data.bio, location: data.location,
      public_repos: data.public_repos, followers: data.followers, following: data.following };
  } else if (resource === 'repos') {
    data = [];
    // Follow pagination; a single page silently truncates accounts with >100 repositories.
    for (let page = 1; ; page++) {
      const result = await request(`${base}/repos?type=owner&sort=pushed&per_page=100&page=${page}`);
      if (!Array.isArray(result.data)) throw new SourceError('GitHub returned invalid repository data.');
      data.push(...result.data.filter(repo => repo.private === false).map(repo => ({
        name: repo.name, full_name: repo.full_name, description: repo.description,
        language: repo.language, stargazers_count: repo.stargazers_count, forks_count: repo.forks_count,
        pushed_at: repo.pushed_at, fork: repo.fork, archived: repo.archived
      })));
      if (!result.response.headers.get('link')?.includes('rel="next"')) break;
      if (page >= 100) throw new SourceError('Repository pagination limit reached; no partial totals are shown.');
    }
  } else if (resource === 'events') {
    ({ data } = await request(`${base}/events/public?per_page=30`));
    if (!Array.isArray(data)) throw new SourceError('GitHub returned invalid activity data.');
    data = data.filter(event => event.public === true && event.repo?.name && event.created_at)
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 10)
      .map(event => ({ id: event.id, type: event.type, repo: event.repo.name, created_at: event.created_at,
        action: event.payload?.action || null, ref_type: event.payload?.ref_type || null }));
  } else {
    const result = await request(`https://github-contributions-api.jogruber.de/v4/${USERNAME}?y=last`, false);
    const days = result.data.contributions;
    if (!Array.isArray(days) || days.length === 0) throw new SourceError('Contribution calendar data is unavailable.');
    // Preserve the source's exact dates, counts and intensity levels. Missing dates are errors, not zeros.
    let previous = null;
    for (const day of days) {
      const time = Date.parse(`${day.date}T00:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date) || !Number.isFinite(time) ||
          new Date(time).toISOString().slice(0, 10) !== day.date ||
          !Number.isInteger(day.count) || day.count < 0 || !Number.isInteger(day.level) ||
          day.level < 0 || day.level > 4 || (day.count === 0) !== (day.level === 0) ||
          (previous !== null && time - previous !== 86400000)) {
        throw new SourceError('Contribution calendar returned incomplete or invalid daily data.');
      }
      previous = time;
    }
    const total = days.reduce((sum, day) => sum + day.count, 0);
    if (result.data.total?.lastYear !== total) throw new SourceError('Contribution calendar totals do not match daily counts.');
    const age = Number(result.response.headers.get('age')) || 0;
    sourceUpdatedAt = new Date(Date.now() - age * 1000).toISOString();
    source = 'GitHub Contributions API (GitHub profile calendar; upstream cache up to one hour)';
    data = { total, days };
  }
  const now = Date.now();
  return { username: USERNAME, source, sourceUpdatedAt, fetchedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + TTL).toISOString(), data };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  const resource = req.query?.resource;
  if (!['profile', 'repos', 'events', 'calendar'].includes(resource)) {
    return res.status(400).json({ error: 'Choose profile, repos, events, or calendar.' });
  }
  try {
    let value = cache.get(resource);
    if (!value || Date.parse(value.expiresAt) <= Date.now()) {
      if (!pending.has(resource)) pending.set(resource, load(resource));
      try { value = await pending.get(resource); cache.set(resource, value); }
      finally { pending.delete(resource); }
    }
    const seconds = Math.max(0, Math.floor((Date.parse(value.expiresAt) - Date.now()) / 1000));
    // Do not serve stale-on-error data as current. Browser rechecks the CDN on every request.
    res.setHeader('Cache-Control', `public, max-age=0, s-maxage=${seconds}, must-revalidate`);
    return res.status(200).json(value);
  } catch (error) {
    const retryAt = error.retryAt || Date.now() + 60000;
    res.setHeader('Retry-After', String(Math.max(1, Math.ceil((retryAt - Date.now()) / 1000))));
    return res.status(error.status || 502).json({
      error: error instanceof SourceError ? error.message : 'Unable to retrieve live GitHub data. Please try again.',
      retryAt: new Date(retryAt).toISOString()
    });
  }
};
