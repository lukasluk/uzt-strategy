(function () {
  const activeStrategyLinks = Array.from(document.querySelectorAll('[data-active-strategy-link]'));
  const metricInstitutions = document.getElementById('metricInstitutions');
  const navLinks = Array.from(document.querySelectorAll('[data-scroll-link]'));

  function setActiveStrategyHref(slug) {
    if (!slug) return;
    const href = `index.html?institution=${encodeURIComponent(slug)}&view=map`;
    activeStrategyLinks.forEach((link) => {
      link.setAttribute('href', href);
    });
  }

  async function loadPublicInstitutions() {
    try {
      const response = await fetch('/api/v1/public/institutions', {
        method: 'GET',
        credentials: 'same-origin'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const institutions = Array.isArray(payload?.institutions) ? payload.institutions : [];
      const active = institutions.filter((item) => String(item?.status || '').toLowerCase() === 'active');
      if (metricInstitutions) metricInstitutions.textContent = String(active.length || institutions.length || 0);

      const preferred = active.find((item) => String(item?.slug || '').trim())
        || institutions.find((item) => String(item?.slug || '').trim())
        || null;
      if (preferred?.slug) setActiveStrategyHref(String(preferred.slug));
    } catch {
      if (metricInstitutions) metricInstitutions.textContent = '1+';
      setActiveStrategyHref('uzt');
    }
  }

  function initReveal() {
    const items = Array.from(document.querySelectorAll('.section-reveal'));
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('revealed'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });

    items.forEach((item) => observer.observe(item));
  }

  function initNavScroll() {
    if (!navLinks.length) return;

    navLinks.forEach((link) => {
      link.addEventListener('click', (event) => {
        const href = String(link.getAttribute('href') || '').trim();
        if (!href.startsWith('#')) return;
        const target = document.querySelector(href);
        if (!(target instanceof HTMLElement)) return;
        event.preventDefault();
        navLinks.forEach((item) => item.classList.remove('active'));
        link.classList.add('active');
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    if (!('IntersectionObserver' in window)) return;

    const sections = navLinks
      .map((link) => {
        const href = String(link.getAttribute('href') || '').trim();
        if (!href.startsWith('#')) return null;
        const element = document.querySelector(href);
        if (!(element instanceof HTMLElement)) return null;
        return { link, element };
      })
      .filter(Boolean);

    if (!sections.length) return;

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;

      navLinks.forEach((link) => link.classList.remove('active'));
      const match = sections.find((item) => item.element === visible.target);
      if (match) match.link.classList.add('active');
    }, {
      rootMargin: '-28% 0px -56% 0px',
      threshold: [0.2, 0.45, 0.7]
    });

    sections.forEach((item) => observer.observe(item.element));
  }

  loadPublicInstitutions();
  initReveal();
  initNavScroll();
})();
