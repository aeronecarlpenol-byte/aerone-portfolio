/* Stationary brand badges: focus exposes the same name as hover. */
(function () {
  'use strict';
  document.querySelectorAll('#skills .tech-logo').forEach(function (logo) {
    logo.tabIndex = 0;
    const image = logo.querySelector('img');
    if (image) logo.setAttribute('aria-label', image.alt);
  });
}());
