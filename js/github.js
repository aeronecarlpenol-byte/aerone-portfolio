/* Live public GitHub data. Credentials and upstream requests stay in /api/github. */
(function () {
  'use strict';
  const root = document.querySelector('[data-github]');
  if (!root) return;
  const refresh = root.querySelector('.github-refresh');
  let refreshing = false;
  const panels = Array.from(root.querySelectorAll('[data-resource]')).map(element => ({
    element, resource: element.dataset.resource, expires: 0, retry: 0, loading: false
  }));
  const number = value => Number(value).toLocaleString();
  const dayDate = value => new Date(value + 'T00:00:00Z');
  const formatDay = value => dayDate(value).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC'
  });
  const timestamp = value => new Date(value).toLocaleString();
  function el(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function link(text, path) {
    const node = el('a', text);
    node.href = 'https://github.com/' + path.split('/').map(encodeURIComponent).join('/');
    node.target = '_blank';
    node.rel = 'noopener noreferrer';
    return node;
  }
  function metrics(values) {
    const grid = el('div', undefined, 'github-card__metrics');
    values.forEach(([value, label]) => {
      const item = el('div', undefined, 'github-card__metric');
      item.append(el('strong', number(value)), el('span', label));
      grid.append(item);
    });
    return grid;
  }
  function profile(content, data) {
    const heading = el('div', undefined, 'github-profile');
    heading.append(link(data.name?.trim() || data.login, data.login), el('span', '@' + data.login));
    content.append(heading);
    if (data.bio) content.append(el('p', data.bio, 'github-card__copy'));
    if (data.location) content.append(el('p', data.location, 'github-card__copy'));
    content.append(metrics([[data.public_repos, 'Public repositories'], [data.followers, 'Followers'], [data.following, 'Following']]));
  }
  function repos(content, data) {
    const languages = new Map();
    data.forEach(repo => { if (repo.language) languages.set(repo.language, (languages.get(repo.language) || 0) + 1); });
    content.append(metrics([[data.reduce((sum, repo) => sum + repo.stargazers_count, 0), 'Stars earned'],
      [data.reduce((sum, repo) => sum + repo.forks_count, 0), 'Repository forks'], [languages.size, 'Primary languages']]));
    if (!data.length) { content.append(el('p', 'No public repositories yet.')); return; }
    const list = el('ul', undefined, 'github-list');
    data.slice(0, 6).forEach(repo => {
      const item = el('li');
      item.append(link(repo.name, repo.full_name));
      if (repo.description) item.append(el('p', repo.description, 'github-card__copy'));
      item.append(el('p', [repo.language || 'No primary language', number(repo.stargazers_count) + ' stars',
        repo.pushed_at ? 'Pushed ' + formatDay(repo.pushed_at.slice(0, 10)) : null,
        repo.fork ? 'Fork' : null, repo.archived ? 'Archived' : null].filter(Boolean).join(' · '), 'github-list__meta'));
      list.append(item);
    });
    content.append(list);
    if (data.length > 6) content.append(el('p', 'Showing the 6 most recently pushed repositories.', 'github-card__copy'));
    const languagePanel = el('div', undefined, 'github-card__languages-panel');
    languagePanel.append(el('h4', 'Languages across public repositories'), el('p', 'Number of repositories by primary language', 'github-card__copy'));
    const chart = el('div', undefined, 'github-card__languages');
    if (!languages.size) chart.append(el('p', 'No primary language data is available yet.'));
    Array.from(languages).sort((a, b) => b[1] - a[1]).slice(0, 6).forEach(([name, count]) => {
      const row = el('div', undefined, 'github-card__language');
      const label = el('div', undefined, 'github-card__language-label');
      label.append(el('span', name), el('span', count + (count === 1 ? ' repo' : ' repos')));
      const track = el('div', undefined, 'github-card__language-track');
      const fill = el('span', undefined, 'github-card__language-fill');
      fill.style.width = (count / data.length * 100) + '%';
      track.append(fill); row.append(label, track); chart.append(row);
    });
    languagePanel.append(chart); content.append(languagePanel);
  }
  function calendar(content, data, payload) {
    const days = data.days;
    content.append(el('p', number(data.total) + ' contributions · ' + formatDay(days[0].date) + ' – ' + formatDay(days.at(-1).date), 'github-calendar__summary'));
    if (!data.total) content.append(el('p', 'No contributions in this calendar period.', 'github-card__copy'));
    const scroll = el('div', undefined, 'github-calendar__scroll');
    scroll.setAttribute('role', 'region'); scroll.setAttribute('aria-label', 'Contribution calendar. Scroll horizontally on small screens.');
    scroll.tabIndex = 0;
    const grid = el('div', undefined, 'github-calendar');
    const offset = dayDate(days[0].date).getUTCDay();
    const weeks = Math.ceil((offset + days.length) / 7);
    grid.style.gridTemplateColumns = '28px repeat(' + weeks + ', minmax(10px, 1fr))';
    ['Mon', 'Wed', 'Fri'].forEach((name, i) => {
      const label = el('span', name, 'github-calendar__label');
      label.style.gridColumn = '1'; label.style.gridRow = String(3 + i * 2); grid.append(label);
    });
    const detail = el('p', 'Hover, focus, or tap a day to see its contribution count. Use arrow keys to move between days.', 'github-calendar__detail');
    detail.id = 'github-calendar-detail'; detail.setAttribute('aria-live', 'polite');
    const cells = [];
    let keyboardNavigation = false;
    let lastMonthColumn = -4;
    days.forEach((day, i) => {
      const date = dayDate(day.date);
      const column = Math.floor((i + offset) / 7) + 2;
      const monthColumn = Math.ceil((i + offset) / 7) + 2;
      if (((i === 0 && date.getUTCDate() <= 7) || date.getUTCDate() === 1) && monthColumn - lastMonthColumn >= 3 && monthColumn <= weeks) {
        const label = el('span', date.toLocaleDateString(undefined, {month: 'short', timeZone: 'UTC'}), 'github-calendar__label');
        label.style.gridColumn = monthColumn + ' / span 3'; label.style.gridRow = '1'; grid.append(label); lastMonthColumn = monthColumn;
      }
      const cell = el('button', undefined, 'github-calendar__day');
      const description = number(day.count) + (day.count === 1 ? ' contribution on ' : ' contributions on ') + formatDay(day.date);
      cell.type = 'button'; cell.dataset.level = String(day.level); cell.dataset.date = day.date;
      cell.title = description; cell.setAttribute('aria-label', description);
      cell.tabIndex = i === days.length - 1 ? 0 : -1;
      cell.style.gridColumn = String(column); cell.style.gridRow = String(date.getUTCDay() + 2);
      const describe = () => { detail.textContent = description; };
      cell.addEventListener('mouseenter', () => { if (!keyboardNavigation) describe(); });
      cell.addEventListener('mousemove', () => { keyboardNavigation = false; describe(); });
      cell.addEventListener('focus', () => { cells.forEach(other => { other.tabIndex = other === cell ? 0 : -1; }); describe(); });
      cell.addEventListener('click', describe);
      cell.addEventListener('keydown', event => {
        const steps = {ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1, Home: -days.length, End: days.length};
        if (!(event.key in steps)) return;
        keyboardNavigation = true;
        event.preventDefault(); cells[Math.max(0, Math.min(days.length - 1, i + steps[event.key]))].focus();
      });
      cells.push(cell); grid.append(cell);
    });
    scroll.append(grid); content.append(scroll, detail);
    const legend = el('div', undefined, 'github-calendar__legend');
    legend.setAttribute('aria-label', 'Contribution intensity from less to more');
    legend.append(el('span', 'Less'));
    for (let level = 0; level <= 4; level++) {
      const sample = el('span', undefined, 'github-calendar__day');
      sample.dataset.level = String(level); sample.setAttribute('aria-hidden', 'true'); legend.append(sample);
    }
    legend.append(el('span', 'More')); content.append(legend);
    const source = el('p', undefined, 'github-list__meta');
    const sourceLink = el('a', 'GitHub Contributions API');
    sourceLink.href = 'https://github.com/grubersjoe/github-contributions-api';
    sourceLink.target = '_blank'; sourceLink.rel = 'noopener noreferrer';
    source.append('Calendar source: ', sourceLink, '. Last source fetch: ' + timestamp(payload.sourceUpdatedAt) + '.');
    content.append(source);
  }
  function events(content, data) {
    if (!data.length) { content.append(el('p', 'No recent public activity is available in GitHub’s event feed.')); return; }
    const list = el('ul', undefined, 'github-list');
    data.forEach(event => {
      const verbs = {PushEvent: 'Pushed to', CreateEvent: 'Created ' + (event.ref_type || 'a reference') + ' in',
        DeleteEvent: 'Deleted ' + (event.ref_type || 'a reference') + ' in', WatchEvent: 'Starred', ForkEvent: 'Forked',
        IssuesEvent: (event.action || 'Updated') + ' an issue in', PullRequestEvent: (event.action || 'Updated') + ' a pull request in',
        IssueCommentEvent: 'Commented on an issue in', ReleaseEvent: 'Updated a release in'};
      const item = el('li');
      item.append((verbs[event.type] || event.type.replace(/Event$/, '') + ' activity in') + ' ', link(event.repo, event.repo));
      const time = el('time', timestamp(event.created_at), 'github-list__meta');
      time.dateTime = event.created_at; item.append(time); list.append(item);
    });
    content.append(list);
  }
  const renderers = { profile, repos, calendar, events };
  async function load(panel) {
    if (panel.loading || Date.now() < panel.retry) return;
    panel.loading = true;
    panel.element.setAttribute('aria-busy', 'true');
    const status = panel.element.querySelector('.github-data__status');
    const content = panel.element.querySelector('.github-data__content');
    // Once a cached snapshot expires, remove it until the source succeeds again.
    if (Date.now() >= panel.expires) content.hidden = true;
    status.textContent = 'Loading ' + panel.resource + '...';
    try {
      const response = await fetch('/api/github?resource=' + panel.resource, { signal: AbortSignal.timeout(20000) });
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('The GitHub API route is unavailable. Run the included local server or deploy the api folder to Vercel.');
      }
      const payload = await response.json();
      if (!response.ok) {
        panel.retry = Date.parse(payload.retryAt) || Date.now() + 60000;
        throw new Error(payload.error || 'GitHub data is unavailable.');
      }
      if (!Number.isFinite(Date.parse(payload.expiresAt)) || Date.parse(payload.expiresAt) <= Date.now()) {
        throw new Error('This GitHub snapshot has expired. Please refresh again shortly.');
      }
      const fragment = document.createDocumentFragment();
      renderers[panel.resource](fragment, payload.data, payload);
      content.replaceChildren(fragment); content.hidden = false;
      panel.expires = Date.parse(payload.expiresAt); panel.retry = 0;
      status.textContent = 'Retrieved ' + timestamp(payload.fetchedAt) + '.';
    } catch (error) {
      content.hidden = true;
      panel.expires = 0;
      panel.retry = Math.max(panel.retry, Date.now() + 60000);
      status.textContent = (error.name === 'TimeoutError' ? 'The request timed out.' : error.message) +
        ' Retry available after ' + timestamp(panel.retry) + '. You can also view the GitHub profile above.';
    } finally {
      panel.loading = false; panel.element.setAttribute('aria-busy', 'false'); updateButton();
    }
  }
  function updateButton() {
    refresh.disabled = refreshing || panels.some(panel => panel.loading) || panels.every(panel => Date.now() < panel.retry);
  }
  async function refreshAll(force) {
    if (refreshing) return;
    refreshing = true; updateButton();
    // Fetch serially to respect GitHub's rate-limit guidance. Panels fail independently.
    try { for (const panel of panels) if (force || Date.now() >= panel.expires) await load(panel); }
    finally { refreshing = false; updateButton(); }
  }
  refresh.addEventListener('click', () => { refreshAll(true); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshAll(false); });
  window.addEventListener('pageshow', () => { refreshAll(false); });
  setInterval(() => { updateButton(); if (!document.hidden) refreshAll(false); }, 30000);
  refreshAll(false);
}());
