(function () {
  const activeStrategyLinks = Array.from(document.querySelectorAll('[data-active-strategy-link]'));
  const metricInstitutions = document.getElementById('metricInstitutions');

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

  loadPublicInstitutions();
  initReveal();
})();