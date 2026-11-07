'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function setup({ clipboard, fallback = false } = {}) {
  const email = { getAttribute: () => 'mailto:aeronecarlpenol@gmail.com' };
  const button = { hidden: true, disabled: false, addEventListener: (_, fn) => { button.click = fn; } };
  const status = { textContent: '' }, actionStatus = { textContent: '' };
  const mail = { addEventListener: (_, fn) => { mail.click = fn; } };
  const phone = { textContent: '09076858027', addEventListener: (_, fn) => { phone.click = fn; } };
  let timeout, removed = false, value;
  const document = {
    getElementById: id => ({ 'contact-email': email, 'copy-email-status': status, 'contact-action-status': actionStatus })[id],
    querySelector: () => button,
    querySelectorAll: selector => selector.includes('mailto:') ? [mail] : [phone],
    createElement: () => ({ style: {}, setAttribute() {}, select() {}, setSelectionRange() {}, remove() { removed = true; } }),
    body: { appendChild(field) { value = field.value; } },
    execCommand: () => fallback
  };
  const window = { isSecureContext: true, getSelection: () => null,
    setTimeout(fn) { timeout = fn; return 1; }, clearTimeout() {} };
  vm.runInNewContext(fs.readFileSync('js/contact.js', 'utf8'), { document, window,
    navigator: { clipboard: clipboard && { writeText: clipboard } } });
  return { button, status, actionStatus, mail, phone, expire: () => timeout(), removed: () => removed, value: () => value };
}
test('copy uses the verified email and releases the button after success', async () => {
  let copied;
  const app = setup({ clipboard: async text => { copied = text; } });
  assert.equal(app.button.hidden, false);
  await app.button.click();
  assert.equal(copied, 'aeronecarlpenol@gmail.com');
  assert.equal(app.status.textContent, 'Email copied.');
  assert.equal(app.button.disabled, false);
});
test('missing or denied clipboard uses a checked legacy fallback', async () => {
  for (const clipboard of [undefined, async () => { throw Error('Permission denied'); }]) {
    const app = setup({ clipboard, fallback: true }); await app.button.click();
    assert.equal(app.status.textContent, 'Email copied.');
    assert.equal(app.value(), 'aeronecarlpenol@gmail.com');
    assert.equal(app.removed(), true);
  }
});
test('failed and stalled copying reports failure and never leaves a disabled control', async () => {
  const app = setup({ clipboard: () => new Promise(() => {}) });
  const pending = app.button.click(); app.expire(); await pending;
  assert.match(app.status.textContent, /Couldn’t copy/);
  assert.equal(app.button.disabled, false);
});
test('native email and phone actions explain the handoff without suppressing navigation', () => {
  const app = setup(); app.mail.click(); assert.match(app.actionStatus.textContent, /Copy email/);
  app.phone.click(); assert.match(app.actionStatus.textContent, /09076858027/);
});
