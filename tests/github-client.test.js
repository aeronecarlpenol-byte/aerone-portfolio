'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Small DOM adapter exercises loading/recovery and expiry without a browser dependency.
class Element {
  constructor(tag = 'div') { this.tag = tag; this.children = []; this.attrs = {}; this.style = {}; this.dataset = {}; this.handlers = {}; this.hidden = false; this.text = ''; }
  set textContent(value) { this.text = String(value); this.children = []; }
  get textContent() { return this.text + this.children.map(child => typeof child === 'string' ? child : child.textContent).join(''); }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.text = ''; this.children = children; }
  setAttribute(name, value) { this.attrs[name] = value; }
  addEventListener(name, handler) { this.handlers[name] = handler; }
}
function setup(fetcher) {
  let now = Date.now();
  class Clock extends Date { static now() { return now; } }
  const resources = ['profile', 'calendar', 'repos', 'events'];
  const panels = resources.map(resource => {
    const panel = new Element(); panel.dataset.resource = resource;
    panel.status = new Element(); panel.content = new Element(); panel.content.hidden = true;
    panel.querySelector = selector => selector.includes('status') ? panel.status : panel.content;
    return panel;
  });
  const button = new Element('button');
  const root = {querySelector: () => button, querySelectorAll: () => panels};
  const document = {hidden: false, querySelector: () => root, createElement: tag => new Element(tag),
    createDocumentFragment: () => new Element(), addEventListener() {}};
  let tick;
  const payload = resource => ({username:'aeronecarlpenol-byte', fetchedAt:new Clock(now).toISOString(),
    expiresAt:new Clock(now + 900000).toISOString(), sourceUpdatedAt:new Clock(now).toISOString(),
    data:resource === 'profile' ? {login:'aeronecarlpenol-byte',public_repos:0,followers:0,following:0} :
      resource === 'calendar' ? {total:0,days:[{date:'2026-10-28',count:0,level:0}]} : []});
  const calls = [];
  const context = {document, Date:Clock, AbortSignal, setInterval(fn) {tick=fn;}, window:{addEventListener() {}},
    fetch: async url => { const resource = url.split('=').at(-1); calls.push(resource); return fetcher(resource, payload); }};
  vm.runInNewContext(fs.readFileSync('js/github.js','utf8'), context);
  return {panels,button,calls,tick:() => tick(),advance:ms => {now+=ms;}};
}
const settle = async () => { for (let i=0;i<20;i++) await new Promise(resolve => setImmediate(resolve)); };
function success(resource, payload) { return {ok:true,headers:new Headers({'content-type':'application/json'}),json:async () => payload(resource)}; }

test('client keeps loading visible until a response arrives, then renders genuine empty states', async () => {
  let release;
  const wait = new Promise(resolve => {release=resolve;});
  const app = setup(async (resource, payload) => {await wait; return success(resource,payload);});
  assert.match(app.panels[0].status.textContent,/Loading/); assert.equal(app.panels[0].content.hidden,true);
  assert.equal(app.button.disabled,true); release(); await settle();
  assert.equal(app.panels.every(panel => !panel.content.hidden),true);
  assert.match(app.panels[1].content.textContent,/No contributions/);
  assert.match(app.panels[2].content.textContent,/No public repositories/);
  assert.match(app.panels[3].content.textContent,/No recent public activity/);
  assert.equal(app.button.disabled,false);
});
test('a calendar failure does not hide working REST panels and a retry recovers', async () => {
  let fail = true;
  const app = setup(async (resource,payload) => {
    if (resource === 'calendar' && fail) return {ok:false,headers:new Headers({'content-type':'application/json'}),json:async () => ({error:'Calendar unavailable'})};
    return success(resource,payload);
  });
  await settle(); assert.equal(app.panels[1].content.hidden,true);
  assert.match(app.panels[1].status.textContent,/Calendar unavailable/);
  assert.equal(app.panels.filter(panel => !panel.content.hidden).length,3);
  fail=false; app.advance(60001); app.tick(); await settle();
  assert.equal(app.panels[1].content.hidden,false);
});
test('cached client panels do not refetch before expiry, and failed refreshes hide expired data', async () => {
  let fail = false;
  const app = setup(async (resource,payload) => {if(fail)throw new Error('Offline'); return success(resource,payload);});
  await settle(); app.tick(); await settle(); assert.equal(app.calls.length,4);
  app.advance(900001); fail=true; app.tick(); await settle();
  assert.equal(app.calls.length,8); assert.equal(app.panels.every(panel=>panel.content.hidden),true);
  assert.match(app.panels[0].status.textContent,/Offline/);
});
test('a static-only server gets an actionable error without showing incorrect statistics', async () => {
  const app = setup(async () => ({ok:true,headers:new Headers({'content-type':'text/html'})}));
  await settle(); assert.match(app.panels[0].status.textContent,/API route is unavailable/);
  assert.equal(app.panels.every(panel=>panel.content.hidden),true);
});
