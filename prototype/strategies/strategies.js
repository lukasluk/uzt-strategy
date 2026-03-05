(function () {
  const searchInput = document.getElementById('searchInput');
  const strategyLangSelect = document.getElementById('strategyLangSelect');
  const openPlatformHeaderLink = document.getElementById('openPlatformHeaderLink');
  const sectorSelect = document.getElementById('sectorSelect');
  const themeSelect = document.getElementById('themeSelect');
  const regionSelect = document.getElementById('regionSelect');
  const resetFiltersButton = document.getElementById('resetFiltersButton');
  const cardsGrid = document.getElementById('cardsGrid');
  const resultCount = document.getElementById('resultCount');
  const previewTitle = document.getElementById('previewTitle');
  const previewSubline = document.getElementById('previewSubline');
  const strategyPreviewFrame = document.getElementById('strategyPreviewFrame');
  const openFullMapLink = document.getElementById('openFullMapLink');

  const state = {
    loading: false,
    lang: 'en',
    selectedStrategyId: '',
    strategies: [],
    filters: {
      q: '',
      sector: '',
      theme: '',
      region: ''
    }
  };

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function normalizeLang(value) {
    const token = String(value || '').trim().toLowerCase();
    return token === 'lt' ? 'lt' : 'en';
  }

  function truncateText(value, maxLength) {
    const text = String(value || '').trim();
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 3).trimEnd()}...`;
  }

  function setLoading(isLoading) {
    state.loading = Boolean(isLoading);
    if (searchInput) searchInput.disabled = state.loading;
    if (sectorSelect) sectorSelect.disabled = state.loading;
    if (themeSelect) themeSelect.disabled = state.loading;
    if (regionSelect) regionSelect.disabled = state.loading;
    if (resetFiltersButton) resetFiltersButton.disabled = state.loading;
  }

  function readFiltersFromUrl() {
    const params = new URLSearchParams(window.location.search);
    state.lang = normalizeLang(params.get('lang'));
    state.filters.q = String(params.get('q') || '').trim();
    state.filters.sector = String(params.get('sector') || '').trim();
    state.filters.theme = String(params.get('theme') || '').trim();
    state.filters.region = String(params.get('region') || '').trim();
    state.selectedStrategyId = String(params.get('strategyId') || '').trim();
  }

  function syncFiltersToUrl() {
    const url = new URL(window.location.href);
    const entries = [
      ['q', state.filters.q],
      ['sector', state.filters.sector],
      ['theme', state.filters.theme],
      ['region', state.filters.region],
      ['strategyId', state.selectedStrategyId]
    ];
    entries.forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    });
    window.history.replaceState({}, '', url.toString());
  }

  function setFilterControlsFromState() {
    if (strategyLangSelect) strategyLangSelect.value = state.lang;
    if (searchInput) searchInput.value = state.filters.q;
    if (sectorSelect) sectorSelect.value = state.filters.sector;
    if (themeSelect) themeSelect.value = state.filters.theme;
    if (regionSelect) regionSelect.value = state.filters.region;
  }

  function fillSelectOptions(selectNode, options, currentValue, emptyLabel) {
    if (!(selectNode instanceof HTMLSelectElement)) return;
    const list = Array.isArray(options) ? options : [];
    const html = [`<option value="">${escapeHtml(emptyLabel)}</option>`];
    list.forEach((entry) => {
      const value = String(entry?.value || '').trim();
      if (!value) return;
      const count = Number(entry?.count || 0);
      html.push(
        `<option value="${escapeHtml(value)}">${escapeHtml(`${value} (${count})`)}</option>`
      );
    });
    selectNode.innerHTML = html.join('');
    if (currentValue && list.some((entry) => String(entry?.value || '') === currentValue)) {
      selectNode.value = currentValue;
    } else {
      selectNode.value = '';
    }
  }

  function getSelectedStrategy() {
    if (!state.selectedStrategyId) return state.strategies[0] || null;
    return state.strategies.find((item) => item.id === state.selectedStrategyId) || state.strategies[0] || null;
  }

  function renderPreview(strategy) {
    if (!strategy) {
      if (previewTitle) previewTitle.textContent = 'Select a card to preview map';
      if (previewSubline) previewSubline.textContent = 'Map preview appears here once a strategy is selected.';
      if (strategyPreviewFrame) strategyPreviewFrame.removeAttribute('src');
      if (openFullMapLink) openFullMapLink.setAttribute('href', `/index.html?view=map&lang=${encodeURIComponent(state.lang)}`);
      if (openPlatformHeaderLink) openPlatformHeaderLink.setAttribute('href', `/index.html?view=map&lang=${encodeURIComponent(state.lang)}`);
      return;
    }

    if (previewTitle) previewTitle.textContent = strategy.strategyTitle || 'Strategy';
    if (previewSubline) {
      previewSubline.textContent = `${strategy.institutionName || 'Institution'} | ${strategy.periodLabel || 'N/A'} | ${strategy.theme || 'Theme'}`;
    }
    if (strategyPreviewFrame) strategyPreviewFrame.setAttribute('src', strategy.embedMapUrl || '');
    if (openFullMapLink) openFullMapLink.setAttribute('href', strategy.mapUrl || `/index.html?view=map&lang=${encodeURIComponent(state.lang)}`);
    if (openPlatformHeaderLink) openPlatformHeaderLink.setAttribute('href', strategy.mapUrl || `/index.html?view=map&lang=${encodeURIComponent(state.lang)}`);
  }

  function renderCards() {
    if (!(cardsGrid instanceof HTMLElement)) return;
    const list = Array.isArray(state.strategies) ? state.strategies : [];
    if (resultCount) resultCount.textContent = String(list.length);

    if (!list.length) {
      cardsGrid.innerHTML = `
        <div class="empty-state">
          No strategies matched your current filters. Try resetting sector, theme, region, or search text.
        </div>
      `;
      renderPreview(null);
      return;
    }

    const selected = getSelectedStrategy();
    state.selectedStrategyId = selected?.id || '';

    cardsGrid.innerHTML = list.map((item) => {
      const isActive = item.id === state.selectedStrategyId;
      const description = truncateText(item.strategyDescription, 180);
      return `
        <article class="strategy-card ${isActive ? 'is-active' : ''}" data-strategy-id="${escapeHtml(item.id)}">
          <h3>${escapeHtml(item.strategyTitle || 'Untitled strategy')}</h3>
          <p class="subline">${escapeHtml(item.institutionName || 'Institution')}</p>
          <p class="period">${escapeHtml(item.periodLabel || 'N/A')}</p>
          <div class="chip-row">
            <span class="chip">${escapeHtml(item.sector || 'Sector')}</span>
            <span class="chip">${escapeHtml(item.theme || 'Theme')}</span>
            <span class="chip">${escapeHtml(item.region || 'Region')}</span>
          </div>
          ${description ? `<p class="subline">${escapeHtml(description)}</p>` : ''}
          <div class="stats">
            <span>Goals: ${Number(item.goalsCount || 0)}</span>
            <span>Initiatives: ${Number(item.initiativesCount || 0)}</span>
          </div>
        </article>
      `;
    }).join('');

    cardsGrid.querySelectorAll('[data-strategy-id]').forEach((node) => {
      node.addEventListener('click', () => {
        const strategyId = String(node.getAttribute('data-strategy-id') || '').trim();
        if (!strategyId) return;
        state.selectedStrategyId = strategyId;
        syncFiltersToUrl();
        renderCards();
      });
    });

    renderPreview(getSelectedStrategy());
  }

  function renderStructuredData(strategies) {
    const previous = document.getElementById('strategyLibraryJsonLd');
    if (previous) previous.remove();
    const list = Array.isArray(strategies) ? strategies : [];
    if (!list.length) return;

    const payload = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: list.slice(0, 60).map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.strategyTitle || 'Strategy',
        description: item.strategyDescription || '',
        url: `https://digistrategy.eu${item.mapUrl || '/index.html?view=map&lang=en'}`
      }))
    };
    const script = document.createElement('script');
    script.id = 'strategyLibraryJsonLd';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(payload);
    document.head.appendChild(script);
  }

  function buildApiUrl() {
    const url = new URL('/api/v1/public/strategies', window.location.origin);
    url.searchParams.set('lang', state.lang);
    if (state.filters.q) url.searchParams.set('q', state.filters.q);
    if (state.filters.sector) url.searchParams.set('sector', state.filters.sector);
    if (state.filters.theme) url.searchParams.set('theme', state.filters.theme);
    if (state.filters.region) url.searchParams.set('region', state.filters.region);
    return url.toString();
  }

  async function loadStrategies() {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(), {
        method: 'GET',
        credentials: 'same-origin'
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(String(data?.error || 'Failed to load strategy library'));
      }

      const filters = data?.filters && typeof data.filters === 'object' ? data.filters : {};
      fillSelectOptions(sectorSelect, filters.sectors, state.filters.sector, 'All sectors');
      fillSelectOptions(themeSelect, filters.themes, state.filters.theme, 'All themes');
      fillSelectOptions(regionSelect, filters.regions, state.filters.region, 'All regions');

      state.strategies = Array.isArray(data?.strategies) ? data.strategies : [];
      if (!state.strategies.some((item) => item.id === state.selectedStrategyId)) {
        state.selectedStrategyId = state.strategies[0]?.id || '';
      }
      syncFiltersToUrl();
      renderCards();
      renderStructuredData(state.strategies);
    } catch (_error) {
      state.strategies = [];
      renderCards();
      if (cardsGrid) {
        cardsGrid.innerHTML = `
          <div class="empty-state">
            Failed to load strategy catalog right now. Please refresh the page.
          </div>
        `;
      }
    } finally {
      setLoading(false);
    }
  }

  function bindFilterEvents() {
    if (strategyLangSelect) {
      strategyLangSelect.addEventListener('change', () => {
        state.lang = normalizeLang(strategyLangSelect.value);
        syncFiltersToUrl();
        loadStrategies();
      });
    }
    if (sectorSelect) {
      sectorSelect.addEventListener('change', () => {
        state.filters.sector = String(sectorSelect.value || '').trim();
        syncFiltersToUrl();
        loadStrategies();
      });
    }
    if (themeSelect) {
      themeSelect.addEventListener('change', () => {
        state.filters.theme = String(themeSelect.value || '').trim();
        syncFiltersToUrl();
        loadStrategies();
      });
    }
    if (regionSelect) {
      regionSelect.addEventListener('change', () => {
        state.filters.region = String(regionSelect.value || '').trim();
        syncFiltersToUrl();
        loadStrategies();
      });
    }

    let searchTimer = null;
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        if (searchTimer) clearTimeout(searchTimer);
        searchTimer = window.setTimeout(() => {
          state.filters.q = String(searchInput.value || '').trim();
          syncFiltersToUrl();
          loadStrategies();
        }, 260);
      });
    }

    if (resetFiltersButton) {
      resetFiltersButton.addEventListener('click', () => {
        state.filters = { q: '', sector: '', theme: '', region: '' };
        setFilterControlsFromState();
        syncFiltersToUrl();
        loadStrategies();
      });
    }
  }

  readFiltersFromUrl();
  setFilterControlsFromState();
  bindFilterEvents();
  loadStrategies();
})();
    url.searchParams.set('lang', state.lang);
