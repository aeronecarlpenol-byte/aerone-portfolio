'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup(reduced = false, width = 1280, clientWidth = width, integratedTimeline = false, editorialLayout = false) {
  const frames = new Map(), handlers = {}, documentHandlers = {}; let frameId = 0;
  let now = 1000;
  const media = { matches: reduced, addEventListener: (_, fn) => { media.change = fn; } };
  const node = () => ({ attrs: {}, styles: {}, dataset: {}, textContent: '', children: [],
    setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k]; },
    style: { setProperty(k, v) { this[k] = v; } },
    classList: { toggle() {} }, appendChild(c) { this.children.push(c); c.parent = this; },
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(c => c !== this); },
    getTotalLength() { return 2000; }, getPointAtLength(n) { return { x: 20, y: n }; },
    animate(keyframes, options) { this.animations = (this.animations || 0) + 1; this.keyframes = keyframes; this.animationOptions = options; return this.animation = { cancelled: false, playState: 'running', playbackRate: 1, pause() { this.playState = 'paused'; }, play() { this.playState = 'running'; }, cancel() { this.cancelled = true; } }; },
    querySelector() { return null; }, addEventListener(k, fn) { this[k] = fn; }
  });
  const window = { PortfolioPathRouting: require('../js/path-routing'), innerWidth: width, innerHeight: 800, scrollY: 0, matchMedia: () => media,
    getComputedStyle: () => ({ top: '28.8px', height: '13px' }),
    addEventListener(k, fn) { handlers[k] = fn; } };
  const rect = top => () => ({ top: top - window.scrollY });
  const entries = [2025, 2024].map((year, i) => Object.assign(node(), {
    dataset: { year: String(year), org: 'org' + i, role: 'role' + i }, getBoundingClientRect: rect(500 + i * 600)
  }));
  const digits = Array.from({ length: 4 }, node), active = node(), org = node(), role = node();
  const experience = { getBoundingClientRect: rect(400),
    querySelectorAll: s => s.includes('[data-year]') ? entries : digits,
    querySelector: s => ({ '.field-active': active, '.field-active__org': org, '.field-active__role': role })[s] };
  const main = Object.assign(node(), { clientWidth: 1280, offsetHeight: 4000, getBoundingClientRect: rect(0) });
  main.clientWidth = clientWidth;
  const contact = { offsetHeight: 700, getBoundingClientRect: rect(3000) };
  const schematic = node(), spark = node(); spark.attrs['aria-pressed'] = 'false'; spark.closest = () => schematic;
  const geometry = (x, y, w, h) => Object.assign(node(), { offsetLeft: x, offsetTop: y, offsetWidth: w, offsetHeight: h, offsetParent: main });
  Object.assign(experience, geometry(0, 400, width, 1300));
  experience.querySelector = s => ({ '.field-active': active, '.field-active__org': org, '.field-active__role': role })[s];
  Object.assign(contact, geometry(0, 3000, width, 700));
  entries.forEach((entry, i) => Object.assign(entry, { offsetLeft: width * .43, offsetTop: 500 + i * 600, offsetWidth: width * .5, offsetHeight: 500, offsetParent: main }));
  const landmarks = {
    '#hero': geometry(0, 0, width, 300), '.hero-portrait__image': geometry(width * .55, 50, width * .3, 120),
    '#about': geometry(0, 300, width, 100), '#exploring': geometry(0, 400, width, 40),
    '#research': geometry(0, 440, width, 30), '.research-collage': geometry(60, 442, 200, 20),
    '#about > .container': geometry(80, 300, width - 160, 40),
    '#exploring > .container': geometry(80, 430, width - 160, 10),
    '#skills > .container': geometry(80, 1820, width - 160, 700),
    '#github': geometry(0, 2600, width, 400),
    '#github > .container': geometry(80, 2630, width - 160, 300),
    '#skills': geometry(0, 1800, width, 800), '.field-timeline': geometry(width * .43, 500, width * .5, 1100),
    '.field-schematic svg': geometry(width - 300, 3200, 250, 250)
  };
  if (integratedTimeline) {
    const rail = width <= 759 ? 28 : width * .43 - 51.2;
    entries.forEach(entry => { entry.offsetTop += 200; });
    window.getComputedStyle = (el, pseudo) => pseudo ? ({ top: '56px', height: '24px', width: '24px', left: String(rail - entries[0].offsetLeft - 12) }) : ({});
    landmarks['#experience > .container'] = geometry(width * .1, 600, width * .8, 1600);
    landmarks['#research > .container'] = geometry(80, 440, width - 160, 30);
    landmarks['.field-experience'] = geometry(80, 600, width - 160, 1200);
    landmarks['.learning-project-note'] = geometry(80, 1896, width - 160, 30);
    landmarks['.education-grid'] = geometry(width * .1, 2000, width * .8, 200);
    landmarks['#skills > .container'] = geometry(80, 2300, width - 160, 600);
    landmarks['#github > .container'] = geometry(80, 3000, width - 160, 200);
  }
  if (editorialLayout) {
    const containerWidth = Math.min(1440, clientWidth), outer = (clientWidth - containerWidth) / 2;
    const padding = width <= 1000 ? 48 : Math.max(48, Math.min(112, width * .07));
    const endPadding = width <= 680 ? 24 : width <= 1000 ? 32 : padding;
    const regions = { about: [300, 40], exploring: [430, 10], research: [460, 10],
      skills: [1820, 700], github: [2630, 300], contact: [3000, 700] };
    for (const [id, [y, height]] of Object.entries(regions)) {
      const el = geometry(outer, y, containerWidth, height);
      el.paddingLeft = padding; el.paddingRight = endPadding;
      landmarks['#' + id + ' > .container'] = el;
    }
    window.getComputedStyle = el => ({ top: '28.8px', height: '13px',
      paddingLeft: String(el.paddingLeft || 0), paddingRight: String(el.paddingRight || 0) });
  }
  main.querySelector = s => landmarks[s];
  const document = {
    hidden: false, addEventListener(k, fn) { documentHandlers[k] = fn; },
    getElementById: id => ({ experience, contact, 'main-content': main, skills: { getBoundingClientRect: rect(1800) } })[id],
    createElementNS: node, querySelectorAll: () => [], querySelector: () => spark
  };
  vm.runInNewContext(fs.readFileSync('js/field-notes.js', 'utf8'), {
    window, document, Date: { now: () => now }, requestAnimationFrame: fn => { frames.set(++frameId, fn); return frameId; }, cancelAnimationFrame: id => frames.delete(id)
  });
  function flush() { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn()); }
  flush();
  return { frames, document, documentHandlers, window, media, main, digits, org, active, spark, flush, entries, landmarks,
    tick(ms) { now += ms; }, resize() { handlers.resize(); flush(); },
    scroll(y, settle = true) { window.scrollY = y; handlers.scroll(); flush(); if (settle) { for (let i=0;i<40;i++){ now+=16; flush(); } } },
    svg: main.children[0] };
}
test('trail follows travel direction, stops emitting at rest, and cleans completed particles', () => {
  const app = setup();
  const trail = app.svg.children.find(n => n.attrs.class === 'field-path__trail');
  app.scroll(20);
  assert.equal(trail.children.length, 1);
  const forward = trail.children[0];
  const forwardY=Number(forward.keyframes[0].transform.match(/, ([\d.]+)px/)[1]);
  assert.ok(forwardY<540 && forwardY>492, 'forward particle is behind the gliding core');
  app.tick(150); app.scroll(10);
  assert.equal(trail.children.length, 2);
  const reverseY = Number(trail.children[1].keyframes[0].transform.match(/, ([\d.]+)px/)[1]);
  assert.ok(reverseY>530 && reverseY<=568, 'reverse particle starts below the gliding core');
  app.tick(1000); app.scroll(10);
  assert.equal(trail.children.length, 2, 'no emission without movement');
  forward.animation.onfinish();
  assert.equal(trail.children.length, 1);
  app.scroll(2000);
  assert.equal(trail.children.length, 0, 'navigation jump clears old particles');
});

test('trail caps desktop and mobile density and resets on resize or reduced motion', () => {
  for (const [width, cap, size] of [[1280, 8, 44], [390, 4, 30]]) {
    const app = setup(false, width);
    const trail = app.svg.children.find(n => n.attrs.class === 'field-path__trail');
    for (let y = 5; y <= 100; y += 5) { app.tick(180); app.scroll(y); }
    assert.equal(trail.children.length, cap);
    const emblem = app.svg.children.find(n => n.attrs.class === 'field-path__position').children[0].children[0].children[0];
    assert.equal(emblem.attrs.width, size);
    app.resize(); assert.equal(trail.children.length, 0);
    app.media.matches = true; app.media.change(); app.flush();
    app.tick(180); app.scroll(110);
    assert.equal(trail.children.length, 0);
  }
});

test('rolling rotation is distance-based, reversible, stable at rest, and disabled for reduced motion', () => {
  const app = setup();
  const position = app.svg.children.find(n => n.attrs.class === 'field-path__position');
  const roll = position.children[0].children[0];
  const initial = roll.attrs.transform;
  app.scroll(200); const forward = roll.attrs.transform;
  assert.notEqual(forward, initial);
  app.tick(1000); app.scroll(200); assert.equal(roll.attrs.transform, forward);
  app.scroll(0); assert.equal(roll.attrs.transform, initial);
  app.resize(); assert.equal(roll.attrs.transform, initial);
  app.media.matches = true; app.media.change(); app.flush();
  app.scroll(700); assert.equal(roll.attrs.transform, 'rotate(0)');
});

test('year, active role, and trace track scrolling in both directions', () => {
  const app = setup();
  assert.equal(app.org.textContent, 'org0');
  const first = Number(app.svg.dataset.progress);
  app.scroll(1000);
  assert.equal(app.org.textContent, 'org1');
  assert.equal(app.digits[3].style['--digit'], '4');
  assert.ok(Number(app.svg.dataset.progress) > first);
  app.scroll(0);
  assert.equal(app.org.textContent, 'org0');
  assert.equal(app.digits[3].style['--digit'], '5');
  assert.equal(Number(app.svg.dataset.progress), first);
  app.scroll(9999); assert.equal(Number(app.svg.dataset.progress), 1);
  app.scroll(-9999); assert.equal(Number(app.svg.dataset.progress), 0);
});
test('only changing year digits roll with brief blur and interrupted rolls are cancelled', () => {
  const app = setup();
  assert.ok(app.digits.every(digit => !digit.animations), 'initial year is immediately sharp');
  app.scroll(1000);
  assert.ok(app.digits.slice(0, 3).every(digit => !digit.animations));
  const last = app.digits[3], first = last.animation;
  assert.equal(last.animationOptions.duration, 460);
  assert.equal(last.keyframes[1].filter, 'blur(3px)');
  assert.equal(last.keyframes.at(-1).filter, 'blur(0px)');
  assert.equal(last.keyframes.at(-1).transform, 'translateY(-4em)');
  assert.equal(last.animationOptions.fill, undefined, 'final CSS year remains authoritative');
  app.scroll(0);
  assert.equal(first.cancelled, true);
  assert.equal(last.keyframes.at(-1).transform, 'translateY(-5em)');
  const reverse = last.animation;
  app.media.matches = true; app.media.change(); app.flush();
  assert.equal(reverse.cancelled, true);
  const count = last.animations;
  app.scroll(1000);
  assert.equal(last.animations, count, 'reduced motion changes the year without a roll or blur');
  assert.equal(last.style['--digit'], '4');
});
test('same-year role changes never blur the digits', () => {
  const app = setup();
  app.entries[1].dataset.year = '2025';
  app.scroll(1000);
  assert.equal(app.org.textContent, 'org1');
  assert.ok(app.digits.every(digit => !digit.animations));
});
test('reduced motion keeps trace complete and role readable without animation', () => {
  const app = setup(true); app.scroll(1000);
  assert.equal(app.org.textContent, 'org1');
  assert.equal(app.active.animations, undefined);
  assert.equal(app.svg.children[1].style.strokeDashoffset, '0');
  app.media.matches = false; app.media.change(); app.flush();
  app.scroll(0); assert.equal(app.active.animations, undefined, 'role changes do not fade in late');
});
test('schematic button exposes its toggled state', () => {
  const app = setup();
  app.spark.click(); assert.equal(app.spark.attrs['aria-pressed'], 'true');
  app.spark.click(); assert.equal(app.spark.attrs['aria-pressed'], 'false');
});

test('Experience signal follows the scroll position without distance-weighting lag', () => {
  const app = setup();
  const signal = app.svg.children.find(n => n.attrs.class === 'field-path__position');
  function signalY() { return Number(signal.attrs.transform.match(/translate\([^ ]+ ([^)]+)\)/)[1]); }
  app.scroll(600);
  assert.ok(Math.abs(signalY() - 1120) < 1, 'signal locks to the 65% reading line');
  app.scroll(350);
  assert.ok(Math.abs(signalY() - 870) < 1, 'reverse scrolling follows the same mapping');
});

test('role and year switch exactly as the signal crosses a marker, including repeated years', () => {
  const app = setup();
  app.entries[1].dataset.year = '2025';
  app.scroll(615); // Signal y=1135, just before marker y=1135.3.
  assert.equal(app.org.textContent, 'org0');
  app.scroll(616);
  assert.equal(app.org.textContent, 'org1', 'same-year role must change on the marker crossing');
  assert.equal(app.digits[3].style['--digit'], '5');
  assert.equal(app.active.animations, undefined);
  app.scroll(615);
  assert.equal(app.org.textContent, 'org0', 'reverse crossing changes back immediately');
});
test('desktop route crosses gutters and follows timeline nodes; mobile simplifies it', () => {
  const app = setup();
  const path = app.svg.children[1].attrs.d;
  assert.ok(path.includes(' C'), 'every transition uses a cubic curve');
  assert.ok(!path.includes(' Q') && !path.includes(' L'), 'no rigid horizontal/vertical corner chain remains');
  assert.equal(app.svg.dataset.route, 'desktop');
  assert.ok(!/NaN|undefined/.test(path));
  const circles = app.svg.children.filter(n => n.attrs.class === 'field-path__node');
  assert.equal(circles.length, 1, 'only the hero has an SVG marker; timeline dots are not duplicated');
  assert.ok(!path.includes('550.9 '), 'narrow timeline gaps are not crossed through text');
  const mobile = setup(false, 390);
  assert.equal(mobile.svg.dataset.route, 'mobile');
  assert.ok(mobile.svg.children[1].attrs.d.includes(' C'));
  assert.equal(mobile.svg.children.filter(n => n.attrs.class === 'field-path__node').length, 1);
  assert.ok(!mobile.svg.children[1].attrs.d.includes('L168.2 '), 'mobile keeps one straight gutter rail without a tiny sideways detour');
  const old = mobile.svg.children[1].attrs.d;
  mobile.landmarks['.hero-portrait__image'].offsetHeight += 40;
  mobile.main.load(); mobile.flush();
  assert.notEqual(mobile.svg.children[1].attrs.d, old, 'image loads remeasure geometry');
});

test('timeline route uses the same 900px viewport boundary as its CSS markers', () => {
  assert.equal(setup(false, 900).svg.dataset.route, 'mobile');
  assert.equal(setup(false, 901).svg.dataset.route, 'desktop');
  assert.equal(setup(false, 901, 886).svg.dataset.route, 'desktop', 'a desktop scrollbar must not select the mobile rail');
});

function reactor(app) { return app.svg.children.find(n => n.attrs.class === 'field-path__position').children[0].children[0].children[0]; }
test('reactor is procedural SVG with three independent counter-rotating electron orbits', () => {
  const core=reactor(setup());
  assert.equal(core.attrs.viewBox, '-24 -24 48 48'); assert.equal(core.attrs.href, undefined);
  const rings=core.children.filter(n=>n.attrs.class==='energy-core__orbit'); assert.equal(rings.length,3);
  assert.deepEqual(rings.map(n=>n.animationOptions.duration),[6800,9100,11300]);
  assert.ok(rings[0].keyframes[1].transform.includes('360deg'));
  assert.ok(rings[1].keyframes[1].transform.includes('-360deg'));
  assert.ok(rings.every(n=>n.animationOptions.iterations===Infinity));
});
test('scroll velocity increases reactor speed and smoothly decays without an idle JS frame loop', () => {
  const app=setup(),core=reactor(app),ring=core.children.find(n=>n.attrs.class==='energy-core__orbit');
  assert.equal(app.frames.size,0);
  app.tick(16);app.scroll(40, false);app.tick(16);app.flush();
  const boosted=Number(core.style['--core-energy']); assert.ok(boosted>0); assert.ok(ring.animation.playbackRate>1);
  app.tick(64);app.flush();assert.ok(Number(core.style['--core-energy'])>0,'energy does not snap off');
  for(let i=0;i<60;i++){app.tick(64);app.flush();}
  assert.equal(core.style['--core-energy'],'0');assert.ok(ring.animation.playbackRate<1.01);assert.equal(app.frames.size,0);
});
test('reduced motion and hidden tabs stop reactor orbit activity and discard velocity', () => {
  const app=setup(),core=reactor(app),rings=core.children.filter(n=>n.attrs.class==='energy-core__orbit');
  app.tick(16);app.scroll(40, false);app.document.hidden=true;app.documentHandlers.visibilitychange();
  assert.ok(rings.every(n=>n.animation.playState==='paused'));assert.equal(core.style['--core-energy'],'0');
  app.document.hidden=false;app.documentHandlers.visibilitychange();assert.ok(rings.every(n=>n.animation.playState==='running'));
  app.media.matches=true;app.media.change();app.flush();assert.ok(rings.every(n=>n.animation.playState==='paused'));
  const still=reactor(setup(true));assert.ok(still.children.filter(n=>n.attrs.class==='energy-core__orbit').every(n=>!n.animation));
});

test('cubic route joins have vertical tangent continuity, monotone height and no unnecessary zigzags', () => {
  for(const width of [360,390,768,900,901,1280,1440]){
    const app=setup(false,width),d=app.svg.children[1].attrs.d;
    const values=d.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi).map(Number);let previous={x:values[0],y:values[1]},changes=0;
    assert.ok(!/[LQHVZ]/.test(d));
    for(let i=2;i<values.length;i+=6){
      const [x1,y1,x2,y2,x,y]=values.slice(i,i+6);
      assert.equal(x1,previous.x);assert.equal(x2,x);assert.ok(y1>previous.y&&y2>=y1&&y>y2);
      if(x!==previous.x)changes++;
      const radius=(width<=900?30:44)/2;
      assert.ok(Math.min(x,previous.x)>=radius);assert.ok(Math.max(x,previous.x)<=width-radius);
      previous={x,y};
    }
    assert.ok(changes <= 8, 'curves remain sparse and continuous');
  }
});

test('wire and reactor clear the actual editorial content bounds at narrow and wide viewport sizes', () => {
  for (const width of [320, 390, 768, 900, 901, 1280, 1536, 1920, 2560]) {
    const app = setup(false, width, width - 15, false, true);
    const values = app.svg.children[1].attrs.d.match(/-?\d+(?:\.\d+)?/g).map(Number);
    const clearance = (width <= 900 ? 15 : 22) + 3;
    const obstacles = Object.entries(app.landmarks).filter(([key]) => key.endsWith(' > .container')).map(([, el]) => ({
      left: el.offsetLeft + el.paddingLeft, right: el.offsetLeft + el.offsetWidth - el.paddingRight,
      top: el.offsetTop, bottom: el.offsetTop + el.offsetHeight
    }));
    let [x0, y0] = values;
    for (let i = 2; i < values.length; i += 6) {
      const [x1, y1, x2, y2, x3, y3] = values.slice(i, i + 6);
      for (let j = 0; j <= 300; j++) {
        const t = j / 300, u = 1 - t;
        const x = u*u*u*x0 + 3*u*u*t*x1 + 3*u*t*t*x2 + t*t*t*x3;
        const y = u*u*u*y0 + 3*u*u*t*y1 + 3*u*t*t*y2 + t*t*t*y3;
        assert.ok(!obstacles.some(b => x + clearance > b.left && x - clearance < b.right &&
          y + clearance > b.top && y - clearance < b.bottom), 'content collision at viewport ' + width + ': ' + x + ', ' + y);
      }
      x0 = x3; y0 = y3;
    }
  }
});
test('scroll interpolation is monotone, reversible and synchronized to the drawn stroke', () => {
  const app=setup(),position=app.svg.children.find(n=>n.attrs.class==='field-path__position'),draw=app.svg.children[1];
  const y=()=>Number(position.attrs.transform.match(/translate\([^ ]+ ([^)]+)\)/)[1]);
  const initial=y();app.tick(16);app.scroll(200,false);assert.ok(y()>initial&&y()<720);
  let previous=y();
  for(let i=0;i<30;i++){app.tick(16);app.flush();assert.ok(y()>=previous&&y()<=720);assert.ok(Math.abs(Number(draw.style.strokeDashoffset)-(2000-y()))<.001);previous=y();}
  assert.ok(Math.abs(y()-720)<.02);
  app.tick(16);app.scroll(100,false);assert.ok(y()>620&&y()<720);previous=y();
  for(let i=0;i<30;i++){app.tick(16);app.flush();assert.ok(y()<=previous&&y()>=620);previous=y();}
  assert.ok(Math.abs(y()-620)<.02);
});
test('rendering reuses cached layout, and a resize preserves the rolling angle', () => {
  const app=setup();app.main.getBoundingClientRect=()=>{throw Error('unexpected layout read during glide');};
  app.tick(16);app.scroll(80);
  app.main.getBoundingClientRect=()=>({top:-app.window.scrollY});
  const roll=app.svg.children.find(n=>n.attrs.class==='field-path__position').children[0].children[0];const angle=roll.attrs.transform;
  app.main.clientWidth=1024;app.resize();assert.equal(roll.attrs.transform,angle);
});

test('failed timeline exits cannot leave the route running through Education', () => {
  const routing = require('../js/path-routing');
  for (const width of [320,390,768,900,901,1280,1920,2560]) {
    const app=setup(false,width,width,true),d=app.svg.children[1].attrs.d;
    const n=d.match(/-?\d+(?:\.\d+)?/g).map(Number), points=[{x:n[0],y:n[1]}];
    for(let i=2;i<n.length;i+=6)points.push({x:n[i+4],y:n[i+5]});
    const education=app.landmarks['.education-grid'];
    const zone={x:education.offsetLeft,right:education.offsetLeft+education.offsetWidth,y:education.offsetTop,bottom:education.offsetTop+education.offsetHeight};
    assert.equal(app.svg.dataset.timelineConnected,'true', 'wire retains its timeline connection at '+width);
    assert.ok(routing.safe(points,[zone],Number(app.svg.dataset.clearance)), 'whole aura clears Education at '+width);
    app.scroll(1700); app.scroll(200); app.resize();
    assert.equal(app.svg.children[1].attrs.d,d,'scroll and stable resize do not alter safe geometry');
  }
});

