/**
 * interactions.js — Reduced motion detection, misc UX enhancements
 */
(function () {
  'use strict';

  /* ── Reduced motion ──────────────────────────────── */
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

  function applyMotionPreference() {
    document.documentElement.dataset.reducedMotion = mq.matches ? 'true' : 'false';
  }

  applyMotionPreference();
  mq.addEventListener('change', applyMotionPreference);

  /* ── Year in footer ──────────────────────────────── */
  const yearEl = document.getElementById('footer-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* ── External links: safe attributes ─────────────── */
  document.querySelectorAll('a[href^="http"]').forEach(function (a) {
    if (!a.getAttribute('rel')) {
      a.setAttribute('rel', 'noopener noreferrer');
    }
    if (!a.getAttribute('target')) {
      a.setAttribute('target', '_blank');
    }
  });

  /* ── Lazy load images ────────────────────────────── */
  if ('loading' in HTMLImageElement.prototype) {
    document.querySelectorAll('img[data-src]').forEach(function (img) {
      img.src = img.dataset.src;
    });
  } else {
    // Fallback: simple IntersectionObserver polyfill path
    document.querySelectorAll('img[data-src]').forEach(function (img) {
      img.src = img.dataset.src;
    });
  }

  /* ── GitHub contribution graph fallback ─────────── */
  const contributionChart = document.querySelector('.github-card__chart');
  if (contributionChart) {
    contributionChart.addEventListener('error', function () {
      const chartLink = contributionChart.closest('.github-card__chart-link');
      const fallback = document.querySelector('.github-card__fallback');
      if (chartLink) chartLink.hidden = true;
      if (fallback) fallback.hidden = false;
    });
  }

  /* ── Public repository insights ──────────────────── */
  const insights = document.getElementById('github-insights');
  if (insights) {
    fetch('https://api.github.com/users/aeronecarlpenol-byte/repos?type=owner&sort=pushed&per_page=100', {
      headers: { Accept: 'application/vnd.github+json' }
    })
      .then(function (response) {
        if (!response.ok) throw new Error('GitHub repository request failed');
        return response.json();
      })
      .then(function (repos) {
        if (!Array.isArray(repos)) throw new Error('Unexpected GitHub response');

        const languages = new Map();
        let stars = 0;
        repos.forEach(function (repo) {
          stars += repo.stargazers_count || 0;
          if (repo.language) languages.set(repo.language, (languages.get(repo.language) || 0) + 1);
        });

        document.getElementById('github-repo-count').textContent = repos.length;
        document.getElementById('github-star-count').textContent = stars;
        document.getElementById('github-language-count').textContent = languages.size;

        const chart = document.getElementById('github-languages');
        const ranked = Array.from(languages).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 6);
        if (ranked.length === 0) {
          chart.textContent = 'No primary language data is available yet.';
        } else {
          ranked.forEach(function (entry) {
            const row = document.createElement('div');
            const label = document.createElement('div');
            const name = document.createElement('span');
            const count = document.createElement('span');
            const track = document.createElement('div');
            const fill = document.createElement('span');

            row.className = 'github-card__language';
            label.className = 'github-card__language-label';
            track.className = 'github-card__language-track';
            fill.className = 'github-card__language-fill';
            name.textContent = entry[0];
            count.textContent = entry[1] + (entry[1] === 1 ? ' repo' : ' repos');
            fill.style.width = (entry[1] / repos.length * 100) + '%';
            label.append(name, count);
            track.appendChild(fill);
            row.append(label, track);
            chart.appendChild(row);
          });
        }

        insights.hidden = false;
      })
      .catch(function () {
        const error = document.getElementById('github-insights-error');
        if (error) error.hidden = false;
      });
  }

  /* ── High school research gallery lightbox ──────── */
  const lightbox = document.getElementById('research-lightbox');
  if (lightbox) {
    const lightboxImage = lightbox.querySelector('img');
    const lightboxCaption = lightbox.querySelector('figcaption');
    const closeButton = lightbox.querySelector('.research-lightbox__close');
    let lastTrigger = null;

    function closeLightbox() {
      lightbox.hidden = true;
      lightboxImage.src = '';
      document.body.classList.remove('lightbox-open');
      if (lastTrigger) lastTrigger.focus();
    }

    document.querySelectorAll('.research-gallery__trigger').forEach(function (trigger) {
      trigger.setAttribute('aria-controls', 'research-lightbox');
      trigger.setAttribute('aria-haspopup', 'dialog');
      trigger.addEventListener('click', function () {
        lastTrigger = trigger;
        lightboxImage.src = trigger.dataset.lightboxSrc;
        lightboxImage.alt = trigger.dataset.lightboxAlt;
        lightboxCaption.textContent = trigger.dataset.lightboxCaption;
        lightbox.hidden = false;
        document.body.classList.add('lightbox-open');
        closeButton.focus();
      });
    });

    closeButton.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !lightbox.hidden) closeLightbox();
    });
  }

  /* ── Electronics card details ───────────────────── */
  document.querySelectorAll('.electronics-card__details-toggle').forEach(function (toggle) {
    toggle.addEventListener('click', function () {
      const card = toggle.closest('.electronics-card');
      if (!card) return;
      const isFlipped = card.classList.toggle('is-flipped');
      const front = card.querySelector('.electronics-card__face--front');
      const back = card.querySelector('.electronics-card__face--back');
      front.inert = isFlipped;
      back.inert = !isFlipped;
      front.setAttribute('aria-hidden', String(isFlipped));
      back.setAttribute('aria-hidden', String(!isFlipped));
      card.querySelectorAll('.electronics-card__details-toggle').forEach(function (button) {
        button.setAttribute('aria-expanded', String(isFlipped));
      });
      (isFlipped ? back : front).querySelector('.electronics-card__details-toggle').focus();
    });
  });

  /* ── Currently exploring selection ──────────────── */
  const exploringDescription = document.getElementById('exploring-description');
  const exploringItems = document.querySelectorAll('.exploring__item');
  if (exploringDescription && exploringItems.length) {
    exploringItems.forEach(function (item) {
      item.addEventListener('click', function () {
        exploringItems.forEach(function (otherItem) {
          const selected = otherItem === item;
          otherItem.classList.toggle('is-selected', selected);
          otherItem.setAttribute('aria-pressed', String(selected));
        });
        exploringDescription.textContent = item.dataset.description;
        document.querySelectorAll('.exploring__panel').forEach(function (panel) {
          panel.hidden = panel.id !== item.dataset.panel;
        });
      });
    });
  }
}());
