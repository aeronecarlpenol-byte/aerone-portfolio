/* Contact actions are independent of decorative animation and gallery code. */
(function () {
  'use strict';
  const email = document.getElementById('contact-email');
  const button = document.querySelector('.copy-email');
  const status = document.getElementById('copy-email-status');
  const actionStatus = document.getElementById('contact-action-status');
  if (!email || !button || !status) return;
  const address = email.getAttribute('href').replace(/^mailto:/, '').split('?')[0];
  button.hidden = false;

  function copyFallback() {
    const focused = document.activeElement;
    const selection = window.getSelection();
    const ranges = [];
    if (selection) for (let i = 0; i < selection.rangeCount; i++) ranges.push(selection.getRangeAt(i).cloneRange());
    const field = document.createElement('textarea');
    field.value = address;
    field.readOnly = true;
    field.setAttribute('aria-label', 'Email address to copy');
    field.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;';
    document.body.appendChild(field);
    field.select();
    field.setSelectionRange(0, address.length);
    let copied = false;
    try { copied = Boolean(document.execCommand && document.execCommand('copy')); }
    finally {
      field.remove();
      if (focused && focused.focus) focused.focus({ preventScroll: true });
      if (selection) { selection.removeAllRanges(); ranges.forEach(range => selection.addRange(range)); }
    }
    return copied;
  }

  button.addEventListener('click', async function () {
    if (button.disabled) return;
    button.disabled = true;
    status.textContent = 'Copying email…';
    let timer;
    try {
      let copied = false;
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await Promise.race([
            navigator.clipboard.writeText(address),
            new Promise((_, reject) => { timer = window.setTimeout(() => reject(new Error('Copy timed out')), 4000); })
          ]);
          copied = true;
        } catch (_) { copied = copyFallback(); }
      } else { copied = copyFallback(); }
      status.textContent = copied ? 'Email copied.' : 'Couldn’t copy. Select and copy the email address above.';
    } catch (_) {
      status.textContent = 'Couldn’t copy. Select and copy the email address above.';
    } finally {
      window.clearTimeout(timer);
      button.disabled = false;
    }
  });

  // Native protocol links require a configured app. Do not claim it opened:
  // browsers cannot confirm that handoff, and some embedded browsers block it.
  document.querySelectorAll('#contact a[href^="mailto:"]').forEach(link => {
    link.addEventListener('click', function () {
      if (actionStatus) actionStatus.textContent = 'Opening your email app. If nothing opens, use Copy email below.';
    });
  });
  document.querySelectorAll('#contact a[href^="tel:"]').forEach(link => {
    link.addEventListener('click', function () {
      if (actionStatus) actionStatus.textContent = 'Opening your phone app. You can also dial ' + link.textContent.trim() + '.';
    });
  });
}());
