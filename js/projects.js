/* Project stories: native dialog handles focus containment and background inertness. */
(function () {
  'use strict';
  const dialog = document.getElementById('work-story');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const content = dialog.querySelector('.work-story__content');
  const close = dialog.querySelector('.work-story__close');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let opener = null, slides = [], thumbs = [], index = 0, timer = 0, closing = false;

  function select(next) {
    if (!slides.length) return;
    index = (next % slides.length + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.hidden = i !== index; });
    thumbs.forEach((thumb, i) => thumb.setAttribute('aria-pressed', String(i === index)));
    const count = content.querySelector('.work-gallery__count');
    count.textContent = `${index + 1} of ${slides.length} · ${slides[index].querySelector('figcaption').textContent}`;
  }
  function openStory(trigger, template) {
    if (closing || dialog.open) return;
    opener = trigger;
    content.replaceChildren(template.content.cloneNode(true));
    slides = Array.from(content.querySelectorAll('.work-gallery__stage figure'));
    const thumbnails = content.querySelector('.work-gallery__thumbnails');
    thumbs = slides.map((slide, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `View image ${i + 1}: ${slide.querySelector('figcaption').textContent}`);
      const image = slide.querySelector('img').cloneNode();
      image.alt = ''; image.loading = 'eager'; button.appendChild(image);
      button.addEventListener('click', () => select(i)); thumbnails.appendChild(button); return button;
    });
    content.querySelector('.work-gallery__arrows').hidden = slides.length < 2;
    content.querySelector('[data-gallery-prev]').addEventListener('click', () => select(index - 1));
    content.querySelector('[data-gallery-next]').addEventListener('click', () => select(index + 1));
    select(0);
    dialog.showModal();
    dialog.scrollTop = 0;
    document.body.classList.add('work-story-open');
    close.focus({ preventScroll: true });
  }
  function closeStory() {
    if (!dialog.open || closing) return;
    closing = true;
    function finish() { window.clearTimeout(timer); dialog.close(); }
    if (reduced.matches) finish();
    else { dialog.classList.add('is-closing'); timer = window.setTimeout(finish, 170); }
  }
  document.querySelectorAll('[data-project-story]').forEach(trigger => {
    const template = document.getElementById(trigger.dataset.projectStory);
    if (!template) return;
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-controls', 'work-story');
    trigger.addEventListener('click', function (event) {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); openStory(trigger, template);
    });
  });
  close.addEventListener('click', closeStory);
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeStory(); });
  dialog.addEventListener('close', function () {
    window.clearTimeout(timer); closing = false; dialog.classList.remove('is-closing');
    document.body.classList.remove('work-story-open');
    if (opener && opener.isConnected) opener.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', function (event) {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeStory();
  });
  dialog.addEventListener('keydown', function (event) {
    if (slides.length < 2) return;
    const keys = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: slides.length - 1 };
    if (Object.prototype.hasOwnProperty.call(keys, event.key)) { event.preventDefault(); select(keys[event.key]); }
  });
}());
