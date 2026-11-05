'use strict';
const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const originalFetch = global.fetch;
const originalNow = Date.now;
const originalToken = process.env.GITHUB_TOKEN;
afterEach(() => {
  global.fetch = originalFetch; Date.now = originalNow;
  if (originalToken === undefined) delete process.env.GITHUB_TOKEN;
  else process.env.GITHUB_TOKEN = originalToken;
});
function fresh() { delete require.cache[require.resolve('../api/github')]; return require('../api/github'); }
function response(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {status, headers: {'content-type': 'application/json', ...headers}});
}
async function call(handler, resource, method = 'GET') {
  const result = { headers: {} };
  await handler({ method, query: { resource } }, {
    setHeader(name, value) { result.headers[name] = value; },
    status(code) { result.status = code; return this; },
    json(value) { result.body = value; }
  });
  return result;
}
const profile = {login: 'aeronecarlpenol-byte', public_repos: 2, followers: 0, following: 0};
test('profile uses the configured account and retains genuine zeros', async () => {
  global.fetch = async url => { assert.equal(url, 'https://api.github.com/users/aeronecarlpenol-byte'); return response(profile); };
  const result = await call(fresh(), 'profile');
  assert.equal(result.status, 200); assert.equal(result.body.data.followers, 0);
  assert.match(result.headers['Cache-Control'], /s-maxage=89[89]|s-maxage=900/);
});
test('warm cache expires after 15 minutes and obtains new upstream data', async () => {
  let now = originalNow(); Date.now = () => now;
  let calls = 0;
  global.fetch = async () => response({...profile, followers: ++calls});
  const handler = fresh();
  assert.equal((await call(handler, 'profile')).body.data.followers, 1);
  now += 14 * 60000;
  const cached = await call(handler, 'profile');
  assert.equal(cached.body.data.followers, 1); assert.equal(cached.headers['Cache-Control'].includes('s-maxage=60'), true);
  now += 60001;
  assert.equal((await call(handler, 'profile')).body.data.followers, 2); assert.equal(calls, 2);
});
test('simultaneous requests share an upstream request', async () => {
  let calls = 0;
  global.fetch = async () => { calls++; await new Promise(resolve => setTimeout(resolve, 5)); return response(profile); };
  const handler = fresh(); await Promise.all([call(handler, 'profile'), call(handler, 'profile')]); assert.equal(calls, 1);
});
test('repository pagination follows next links and excludes private repositories', async () => {
  let calls = 0;
  global.fetch = async url => {
    calls++;
    return url.endsWith('page=1') ? response([{name: 'one', private: false}], 200, {link: '<https://api.github.com/next>; rel="next"'}) :
      response([{name: 'two', private: false}, {name: 'secret', private: true}]);
  };
  const result = await call(fresh(), 'repos');
  assert.equal(result.status, 200); assert.equal(calls, 2); assert.deepEqual(result.body.data.map(repo => repo.name), ['one', 'two']);
});
test('empty repository and public activity responses stay empty', async () => {
  global.fetch = async () => response([]);
  const handler = fresh();
  for (const resource of ['repos', 'events']) assert.deepEqual((await call(handler, resource)).body.data, []);
});
test('events are public, ordered by timestamp and do not invent commit counts', async () => {
  global.fetch = async () => response([
    {id:'1', public: true, type:'PushEvent', created_at:'2026-10-26T00:00:00Z', repo:{name:'a/b'}, payload:{}},
    {id:'2', public: true, type:'PushEvent', created_at:'2026-10-27T00:00:00Z', repo:{name:'a/b'}, payload:{}},
    {id:'3', public: false, created_at:'2026-10-28T00:00:00Z', repo:{name:'a/private'}}
  ]);
  const result = await call(fresh(), 'events');
  assert.deepEqual(result.body.data.map(event => event.id), ['2', '1']); assert.equal('commits' in result.body.data[0], false);
});
test('calendar preserves exact source dates, counts, intensity and zeros without sending a token', async () => {
  process.env.GITHUB_TOKEN = 'test-only-credential';
  const days = [{date:'2026-10-27', count:0, level:0}, {date:'2026-10-28', count:4, level:3}];
  global.fetch = async (url, options) => {
    assert.equal(url, 'https://github-contributions-api.jogruber.de/v4/aeronecarlpenol-byte?y=last');
    assert.equal(options.headers.Authorization, undefined);
    return response({total:{lastYear:4}, contributions:days}, 200, {age:'120'});
  };
  const result = await call(fresh(), 'calendar');
  assert.deepEqual(result.body.data, {total:4, days});
  assert.ok(originalNow() - Date.parse(result.body.sourceUpdatedAt) >= 120000);
  assert.equal(JSON.stringify(result.body).includes('test-only-credential'), false);
});
test('a complete zero calendar is valid, while absent dates and mismatched totals fail', async () => {
  global.fetch = async () => response({total:{lastYear:0}, contributions:[{date:'2026-10-28', count:0, level:0}]});
  assert.equal((await call(fresh(), 'calendar')).status, 200);
  for (const payload of [
    {total:{lastYear:1}, contributions:[{date:'2026-10-28', count:0, level:0}]},
    {total:{lastYear:0}, contributions:[{date:'2026-10-26', count:0, level:0}, {date:'2026-10-28', count:0, level:0}]},
    {total:{lastYear:0}, contributions:[]}
  ]) {
    global.fetch = async () => response(payload);
    const result = await call(fresh(), 'calendar'); assert.equal(result.status, 502); assert.equal(result.body.data, undefined);
  }
});
test('rate limit reset is honored for all REST resources', async () => {
  const reset = Math.ceil(originalNow() / 1000) + 900;
  let calls = 0;
  global.fetch = async () => { calls++; return response({}, 403, {'x-ratelimit-remaining':'0', 'x-ratelimit-reset':String(reset)}); };
  const handler = fresh();
  const result = await call(handler, 'profile'); assert.equal(result.status, 429);
  assert.equal(result.headers['Cache-Control'], 'no-store');
  assert.equal(Date.parse(result.body.retryAt), reset * 1000);
  assert.equal((await call(handler, 'repos')).status, 429); assert.equal(calls, 1);
});
test('expired snapshots are not returned after an upstream failure', async () => {
  let now = originalNow(); Date.now = () => now;
  global.fetch = async () => response(profile);
  const handler = fresh(); assert.equal((await call(handler, 'profile')).status, 200);
  now += 900001; global.fetch = async () => response({}, 503);
  const result = await call(handler, 'profile');
  assert.equal(result.status, 502); assert.equal(result.body.data, undefined); assert.equal(result.headers['Cache-Control'], 'no-store');
});
test('invalid accounts, network failures and invalid resources return explicit errors', async () => {
  global.fetch = async () => response({...profile, login:'someone-else'});
  assert.equal((await call(fresh(), 'profile')).status, 502);
  global.fetch = async () => { throw new Error('network error containing internal details'); };
  const result = await call(fresh(), 'profile'); assert.equal(result.status, 502);
  assert.equal(JSON.stringify(result).includes('internal details'), false);
  assert.equal((await call(fresh(), 'arbitrary-url')).status, 400);
  assert.equal((await call(fresh(), 'profile', 'POST')).status, 405);
});
