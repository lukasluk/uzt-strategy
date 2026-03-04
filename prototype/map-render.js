// Map render markup builders extracted from app-map.js
// This file must load before app-map.js.

function buildMapHeaderMarkup({ graph, activeLayer, editable }) {
  if (state.embedMapMode) return '';
  return `
      <div class="step-header">
        <h2>${escapeHtml(mapLang('Strategijų žemėlapis', 'Strategy map'))}</h2>
        <div class="header-stack step-header-actions">
          <span class="tag">${escapeHtml(mapLang('Institucija', 'Institution'))}: ${escapeHtml(graph.institution.name || graph.institution.slug)}</span>
          <span class="tag">${escapeHtml(mapLang('Strategija', 'Strategy'))}: ${escapeHtml(graph.institution.strategy?.title || '-')}</span>
          ${activeLayer === 'strategic-links' ? `<span class="tag tag-main">${escapeHtml(mapLang('Rodoma', 'Viewing'))}: ${escapeHtml(graph.institution.name || graph.institution.slug)} / ${escapeHtml(graph.institution.strategy?.title || '-')} - Strategic links</span>` : ''}
          ${editable ? `<span class="tag tag-main">${escapeHtml(mapLang('Admin: galite tempti', 'Admin: you can drag'))} ${escapeHtml(activeLayer === 'initiatives' ? mapLang('iniciatyvų korteles', 'initiative cards') : mapLang('gairių korteles', 'guideline cards'))}</span>` : ''}
        </div>
      </div>
      <p class="prompt">${activeLayer === 'strategic-links'
        ? escapeHtml(mapLang('Peržiūrėkite tiesioginius tarpstrateginius ryšius. Rodoma aktyvios strategijos struktūra ir susietos kitų strategijų gairės.', 'Review direct cross-strategy links. You see the active strategy structure and linked guidelines from related strategies.'))
        : escapeHtml(mapLang('Peržiūrėkite pasirinktos institucijos strategijos sluoksnius. Iniciatyvų sluoksnyje gairių kortelės lieka matomos, bet užrakintos.', 'Review selected institution strategy layers. In the initiatives layer, guideline cards remain visible, but locked.'))}</p>
    `;
}

function buildMapToolbarMarkup({ activeLayer, hasInitiativeNodes }) {
  return `
      <div class="map-overlay-toolbar">
        <div class="map-layer-toggle map-overlay-layer-toggle">
          <button type="button" data-map-layer-btn="guidelines" class="btn ${activeLayer === 'guidelines' ? 'btn-primary' : 'btn-ghost'}">${escapeHtml(mapLang('Gairės', 'Guidelines'))}</button>
          <button type="button" data-map-layer-btn="initiatives" class="btn ${activeLayer === 'initiatives' ? 'btn-primary' : 'btn-ghost'}" ${hasInitiativeNodes ? '' : 'disabled'}>${escapeHtml(mapLang('Iniciatyvos', 'Initiatives'))}</button>
          <button type="button" data-map-layer-btn="strategic-links" class="btn ${activeLayer === 'strategic-links' ? 'btn-primary' : 'btn-ghost'}">Strategic links</button>
        </div>
        <div class="map-overlay-actions">
          <button type="button" data-map-reset-btn class="btn btn-ghost">${escapeHtml(mapLang('Centruoti vaizdą', 'Center view'))}</button>
          <button type="button" data-map-fullscreen-btn class="btn btn-ghost btn-icon map-fullscreen-btn" aria-label="${escapeHtml(mapLang('Įjungti pilno ekrano režimą', 'Enable fullscreen mode'))}" title="${escapeHtml(mapLang('Įjungti pilno ekrano režimą', 'Enable fullscreen mode'))}"></button>
        </div>
      </div>
    `;
}

function buildGuidelineEdgeMarkup({ graph, nodeById, activeLayer }) {
  return graph.guidelineEdges.map((edge) => {
    const fromNode = nodeById[edge.from];
    const toNode = nodeById[edge.to];
    if (!fromNode || !toNode) return '';
    const lineSide = fromNode.kind === 'guideline'
      ? normalizeLineSide(fromNode.guideline?.lineSide)
      : 'auto';
    const isParentRoot = edge.type === 'root'
      && toNode.kind === 'guideline'
      && String(toNode.guideline?.relationType || '').toLowerCase() === 'parent';
    const parentRootClass = isParentRoot ? ' edge-root-parent' : '';
    const edgeTone = activeLayer === 'strategic-links'
      ? (toNode.strategyTone || fromNode.strategyTone || null)
      : null;
    const edgeToneStyle = edgeTone
      ? ` style="--strategy-guideline-edge:${escapeHtml(edgeTone.border)}"`
      : '';
    return `<path class="strategy-map-edge edge-${escapeHtml(edge.type)}${parentRootClass} edge-guideline-layer" data-layer="guidelines" data-from="${escapeHtml(edge.from)}" data-to="${escapeHtml(edge.to)}" data-line-side="${escapeHtml(lineSide)}"${edgeToneStyle} d="${edgePath(fromNode, toNode, lineSide)}"></path>`;
  }).join('');
}

function buildStrategyGuidelineEdgeMarkup({ graph, nodeById }) {
  return graph.strategyGuidelineEdges.map((edge) => {
    const fromNode = nodeById[edge.from];
    const toNode = nodeById[edge.to];
    if (!fromNode || !toNode) return '';
    return `<path class="strategy-map-edge edge-strategy-link edge-guideline-layer" data-layer="guidelines" data-from="${escapeHtml(edge.from)}" data-to="${escapeHtml(edge.to)}" data-line-side="auto" d="${edgePath(fromNode, toNode, 'auto')}"></path>`;
  }).join('');
}

function buildStrategicEdgeMarkup({ graph, nodeById }) {
  return (Array.isArray(graph.strategicEdges) ? graph.strategicEdges : []).map((edge) => {
    const fromNode = nodeById[edge.from];
    const toNode = nodeById[edge.to];
    if (!fromNode || !toNode) return '';
    const tone = edge?.strategyTone && typeof edge.strategyTone === 'object' ? edge.strategyTone : null;
    const toneStyle = tone
      ? ` style="--strategy-edge:${escapeHtml(tone.edge)};--strategy-edge-soft:${escapeHtml(tone.border)}"`
      : '';
    return `<path class="strategy-map-edge edge-strategic-cross edge-strategic-layer" data-layer="strategic-links" data-from="${escapeHtml(edge.from)}" data-to="${escapeHtml(edge.to)}" data-line-side="auto"${toneStyle} d="${edgePath(fromNode, toNode, 'auto')}"></path>`;
  }).join('');
}

function buildInitiativeEdgeMarkup({ graph, nodeById }) {
  return graph.initiativeEdges.map((edge) => {
    const fromNode = nodeById[edge.from];
    const toNode = nodeById[edge.to];
    if (!fromNode || !toNode) return '';
    const lineSide = fromNode.kind === 'initiative'
      ? normalizeLineSide(fromNode.initiative?.lineSide)
      : 'auto';
    return `<path class="strategy-map-edge edge-initiative edge-initiative-layer" data-layer="initiatives" data-from="${escapeHtml(edge.from)}" data-to="${escapeHtml(edge.to)}" data-line-side="${escapeHtml(lineSide)}" d="${edgePath(fromNode, toNode, lineSide)}"></path>`;
  }).join('');
}

function buildInstitutionNodeMarkup({ node, activeLayer, editable }) {
  const cycleState = node.institution.cycle?.state || '-';
  const strategyTitle = String(
    node.institution.strategy?.title || state.strategy?.title || mapLang('Strategija', 'Strategy')
  ).trim();
  const pulseActive = Date.now() < Number(state.mapInstitutionPulseUntil || 0);
  const relatedInstitutionInStrategicLayer = activeLayer === 'strategic-links' && node.clusterRole === 'related';
  const switchPerspectiveLabel = mapLang('Atidaryti strategijos perspektyvą', 'Open strategy perspective');
  const institutionClass = [
    'strategy-map-node',
    'institution-node',
    node.institution.slug === state.institutionSlug ? 'active' : '',
    pulseActive ? 'pulse-active' : '',
    activeLayer === 'strategic-links' && node.strategyTone ? 'map-strategy-colored' : '',
    relatedInstitutionInStrategicLayer ? 'map-strategy-related' : '',
    activeLayer === 'strategic-links' && node.clusterRole === 'active' ? 'map-strategy-active' : '',
    activeLayer === 'strategic-links' && node.canSwitchPerspective ? 'map-strategy-switchable' : ''
  ].filter(Boolean).join(' ');
  const perspectiveAttrs = activeLayer === 'strategic-links' && node.canSwitchPerspective
    ? `data-action="open-strategy-perspective" data-map-interactive="true" data-target-institution="${escapeHtml(node.institution.slug || '')}" data-target-strategy="${escapeHtml(node.institution.strategy?.slug || '')}" role="button" tabindex="0" aria-label="${escapeHtml(switchPerspectiveLabel)}" title="${escapeHtml(switchPerspectiveLabel)}"`
    : '';
  const strategicNodeTag = activeLayer === 'strategic-links'
    ? (node.clusterRole === 'related'
      ? `<span class="tag">${escapeHtml(mapLang('Susieta strategija', 'Linked strategy'))}</span>`
      : '')
    : `<span class="tag">${escapeHtml(cycleState.toUpperCase())}</span>`;
  const cycleStatusLine = activeLayer === 'strategic-links'
    ? ''
    : `<small class="institution-cycle-label">${escapeHtml(mapLang('Strategijos ciklo būsena', 'Strategy cycle status'))}</small>`;
  const strategyToneStyle = activeLayer === 'strategic-links' && node.strategyTone
    ? `--strategy-pastel:${escapeHtml(node.strategyTone.pastel)};--strategy-border:${escapeHtml(node.strategyTone.border)};--strategy-ink:${escapeHtml(node.strategyTone.ink)};`
    : '';
  return `
        <article class="${institutionClass}"
                 data-node-id="${escapeHtml(node.id)}"
                 data-kind="institution"
                 data-entity-id="${escapeHtml(node.entityId)}"
                 data-cycle-id="${escapeHtml(node.cycleId || '')}"
                 data-x="${node.x}"
                 data-y="${node.y}"
                 data-w="${node.w}"
                 data-h="${node.h}"
                 data-draggable="${editable ? 'true' : 'false'}"
                 ${perspectiveAttrs}
                 style="${strategyToneStyle}left:${node.x}px;top:${node.y}px;width:${node.w}px;min-height:${node.h}px;">
          <strong>${escapeHtml(node.institution.name)}</strong>
          <small class="institution-subtitle">${escapeHtml(strategyTitle)}</small>
          ${strategicNodeTag}
          ${cycleStatusLine}
        </article>
      `;
}

function buildGuidelineNodeMarkup({ node, activeLayer, editable }) {
  const relation = String(node.guideline.relationType || 'orphan');
  const score = Number(node.guideline.totalScore || 0);
  const mapCommentCount = Math.max(
    0,
    Array.isArray(node.guideline.comments)
      ? node.guideline.comments.length
      : Number(node.guideline.commentCount || 0)
  );
  const strategyLinks = relation === 'parent' && activeLayer !== 'strategic-links'
    ? mapNormalizeStrategyLinks(node.guideline.strategyLinks).filter((item) => !item || item.isCrossStrategy !== false)
    : [];
  const uniqueLinks = [];
  const seenLinkKeys = new Set();
  strategyLinks.forEach((link) => {
    const key = [
      String(link.otherInstitutionSlug || '').trim().toLowerCase(),
      String(link.otherStrategySlug || '').trim().toLowerCase(),
      String(link.otherGuidelineId || '').trim()
    ].join('|');
    if (!String(link.otherGuidelineId || '').trim()) return;
    if (seenLinkKeys.has(key)) return;
    seenLinkKeys.add(key);
    uniqueLinks.push(link);
  });
  const scoreForSquares = Math.max(0, Math.round(score));
  const voteSquares = scoreForSquares
    ? Array.from({ length: scoreForSquares }, () => '<span class="map-vote-square" aria-hidden="true"></span>').join('')
    : '';
  const strategicFocusChip = activeLayer === 'strategic-links' && node.isStrategicLinked
    ? `<span class="map-strategy-link-chip" title="${escapeHtml(mapLang('Gairė turi tarpstrateginį ryšį', 'Guideline has a cross-strategy link'))}">${escapeHtml(mapLang('Susieta', 'Linked'))}</span>`
    : '';
  const strategyLinkListMarkup = relation === 'parent' && uniqueLinks.length && activeLayer !== 'strategic-links'
    ? `
          <div class="map-strategy-link-list">
            ${uniqueLinks.slice(0, 2).map((link) => `
              <button
                type="button"
                class="map-strategy-link-btn"
                data-map-interactive="true"
                data-action="open-strategy-link"
                data-target-institution="${escapeHtml(link.otherInstitutionSlug)}"
                data-target-strategy="${escapeHtml(link.otherStrategySlug)}"
                data-target-guideline="${escapeHtml(link.otherGuidelineId)}"
                title="${escapeHtml(mapLang('Atidaryti susietos gairės kontekstą', 'Open linked guideline context'))}"
              >${escapeHtml(mapStrategyLinkLabel(link))}</button>
            `).join('')}
            ${uniqueLinks.length > 2 ? `<span class="map-strategy-link-more">+${uniqueLinks.length - 2}</span>` : ''}
          </div>
        `
    : '';
  const strategicGuidelineClass = activeLayer === 'strategic-links'
    ? ` map-strategy-colored ${node.clusterRole === 'related' ? 'map-strategy-related' : 'map-strategy-active'} ${node.isStrategicLinked ? 'map-strategic-linked' : 'map-strategic-unlinked'}`
    : '';
  const guidelineOwnerLabel = activeLayer === 'strategic-links'
    ? `${String(node.institution.name || node.institution.slug || '').trim()} / ${String(node.institution.strategy?.title || '-').trim()}`
    : `${String(node.institution.slug || '').trim()}`;
  const guidelineToneStyle = activeLayer === 'strategic-links' && node.strategyTone
    ? `--strategy-pastel:${escapeHtml(node.strategyTone.pastel)};--strategy-border:${escapeHtml(node.strategyTone.border)};--strategy-ink:${escapeHtml(node.strategyTone.ink)};`
    : '';
  const mapCommentButtonLabel = mapLang('Rodyti aprašymą ir komentarus', 'Show description and comments');

  return `
        <article class="strategy-map-node guideline-node relation-${escapeHtml(relation)} status-${escapeHtml(String(node.guideline.status || 'active').toLowerCase())}${strategicGuidelineClass}"
                 data-layer="guidelines"
                 data-node-id="${escapeHtml(node.id)}"
                 data-kind="guideline"
                 data-entity-id="${escapeHtml(node.entityId)}"
                 data-cycle-id="${escapeHtml(node.cycleId || '')}"
                 data-x="${node.x}"
                 data-y="${node.y}"
                 data-w="${node.w}"
                 data-h="${node.h}"
                 data-draggable="${editable ? 'true' : 'false'}"
                 style="${guidelineToneStyle}left:${node.x}px;top:${node.y}px;width:${node.w}px;min-height:${node.h}px;">
          <div class="map-node-head">
            <h4>${escapeHtml(node.guideline.title)}</h4>
          </div>
          <small>${escapeHtml(guidelineOwnerLabel)}</small>
          <div class="map-vote-row">
            <span class="map-vote-chip" title="${escapeHtml(mapLang('Bendras balas', 'Total score'))}">
              <strong>${score}</strong>
            </span>
            ${strategicFocusChip}
          </div>
          ${strategyLinkListMarkup}
          ${voteSquares ? `<div class="map-vote-squares">${voteSquares}</div>` : ''}
          <button
            type="button"
            class="map-comment-btn"
            data-map-comment-kind="guideline"
            data-map-comment-id="${escapeHtml(node.guideline.id)}"
            data-map-interactive="true"
            aria-label="${escapeHtml(mapCommentButtonLabel)}"
            title="${escapeHtml(mapCommentButtonLabel)}"
          >
            <span class="map-comment-icon" aria-hidden="true">${MAP_COMMENT_ICON_SVG}</span>
            <span class="map-comment-count">${mapCommentCount}</span>
          </button>
        </article>
      `;
}

function buildInitiativeNodeMarkup({ node, editable }) {
  const score = Number(node.initiative.totalScore || 0);
  const mapCommentCount = Math.max(
    0,
    Array.isArray(node.initiative.comments)
      ? node.initiative.comments.length
      : Number(node.initiative.commentCount || 0)
  );
  const scoreForSquares = Math.max(0, Math.round(score));
  const voteSquares = scoreForSquares
    ? Array.from({ length: scoreForSquares }, () => '<span class="map-vote-square initiative-square" aria-hidden="true"></span>').join('')
    : '';
  const mapCommentButtonLabel = mapLang('Rodyti aprašymą ir komentarus', 'Show description and comments');

  return `
      <article class="strategy-map-node initiative-node status-${escapeHtml(String(node.initiative.status || 'active').toLowerCase())}"
               data-layer="initiatives"
               data-node-id="${escapeHtml(node.id)}"
               data-kind="initiative"
               data-entity-id="${escapeHtml(node.entityId)}"
               data-cycle-id="${escapeHtml(node.cycleId || '')}"
               data-x="${node.x}"
               data-y="${node.y}"
               data-w="${node.w}"
               data-h="${node.h}"
               data-draggable="${editable ? 'true' : 'false'}"
               style="left:${node.x}px;top:${node.y}px;width:${node.w}px;min-height:${node.h}px;">
        <div class="map-node-head">
          <h4>${escapeHtml(node.initiative.title)}</h4>
        </div>
        <div class="map-vote-row">
          <span class="map-vote-chip" title="${escapeHtml(mapLang('Bendras balas', 'Total score'))}">
            <strong>${score}</strong>
          </span>
        </div>
        ${voteSquares ? `<div class="map-vote-squares">${voteSquares}</div>` : ''}
        <button
          type="button"
          class="map-comment-btn"
          data-map-comment-kind="initiative"
          data-map-comment-id="${escapeHtml(node.initiative.id)}"
          data-map-interactive="true"
          aria-label="${escapeHtml(mapCommentButtonLabel)}"
          title="${escapeHtml(mapCommentButtonLabel)}"
        >
          <span class="map-comment-icon" aria-hidden="true">${MAP_COMMENT_ICON_SVG}</span>
          <span class="map-comment-count">${mapCommentCount}</span>
        </button>
      </article>
    `;
}

function buildNodeMarkup({ graph, activeLayer, editable }) {
  return graph.nodes.map((node) => {
    if (node.kind === 'institution') {
      return buildInstitutionNodeMarkup({ node, activeLayer, editable });
    }
    if (node.kind === 'guideline') {
      return buildGuidelineNodeMarkup({ node, activeLayer, editable });
    }
    return buildInitiativeNodeMarkup({ node, editable });
  }).join('');
}

function buildMapCommentItems(graph) {
  const items = new Map();
  graph.nodes.forEach((node) => {
    if (node.kind === 'guideline' && node.guideline?.id) {
      items.set(`guideline:${node.guideline.id}`, {
        kind: 'guideline',
        id: node.guideline.id,
        title: node.guideline.title || mapLang('Gairė', 'Guideline'),
        description: node.guideline.description || mapLang('Aprašymas nepateiktas.', 'Description not provided.'),
        comments: Array.isArray(node.guideline.comments) ? node.guideline.comments : []
      });
    }
    if (node.kind === 'initiative' && node.initiative?.id) {
      items.set(`initiative:${node.initiative.id}`, {
        kind: 'initiative',
        id: node.initiative.id,
        title: node.initiative.title || mapLang('Iniciatyva', 'Initiative'),
        description: node.initiative.description || mapLang('Aprašymas nepateiktas.', 'Description not provided.'),
        comments: Array.isArray(node.initiative.comments) ? node.initiative.comments : []
      });
    }
  });
  return items;
}

function bindMapCommentModalInteractions({ stepView, graph }) {
  const commentModal = stepView.querySelector('#mapCommentModal');
  const commentTitle = stepView.querySelector('#mapCommentTitle');
  const commentDescription = stepView.querySelector('#mapCommentDescription');
  const commentOpenCardBtn = stepView.querySelector('#mapCommentOpenCardBtn');
  const commentList = stepView.querySelector('#mapCommentList');
  const mapCommentItems = buildMapCommentItems(graph);

  const closeMapCommentModal = () => {
    if (!commentModal) return;
    commentModal.hidden = true;
    document.body.classList.remove('map-comment-modal-open');
  };

  const openMapCommentModal = (kind, itemId) => {
    if (!commentModal || !commentTitle || !commentDescription || !commentList) return;
    const payload = mapCommentItems.get(`${String(kind || '').trim()}:${String(itemId || '').trim()}`);
    if (!payload) return;
    const comments = Array.isArray(payload.comments) ? payload.comments : [];
    commentTitle.textContent = payload.title;
    commentDescription.textContent = payload.description;
    if (commentOpenCardBtn) {
      commentOpenCardBtn.dataset.mapCommentKind = payload.kind || '';
      commentOpenCardBtn.dataset.mapCommentId = payload.id || '';
    }
    commentList.innerHTML = comments.length
      ? comments.map((comment) => renderCommentItem(comment)).join('')
      : `<li class="comment-item comment-item-empty">${escapeHtml(mapLang('Komentarų dar nėra.', 'No comments yet.'))}</li>`;
    commentModal.hidden = false;
    document.body.classList.add('map-comment-modal-open');
  };

  const openCardFromMapComment = () => {
    if (!commentOpenCardBtn) return;
    const kind = String(commentOpenCardBtn.dataset.mapCommentKind || '').trim();
    const id = String(commentOpenCardBtn.dataset.mapCommentId || '').trim();
    if (!kind || !id) return;

    closeMapCommentModal();

    if (kind === 'initiative') {
      if (typeof openInitiativeDetail === 'function') {
        openInitiativeDetail(id);
        return;
      }
      if (typeof scheduleInitiativeFocus === 'function') {
        scheduleInitiativeFocus(id);
      }
      if (typeof setActiveView === 'function') {
        setActiveView('initiatives');
      } else {
        state.activeView = 'initiatives';
        if (typeof syncRouteState === 'function') syncRouteState();
        if (typeof render === 'function') render();
      }
      return;
    }

    if (typeof openGuidelineDetail === 'function') {
      openGuidelineDetail(id);
      return;
    }
    if (typeof scheduleGuidelineFocus === 'function') {
      scheduleGuidelineFocus(id);
    }
    if (typeof setActiveView === 'function') {
      setActiveView('guidelines');
    } else {
      state.activeView = 'guidelines';
      if (typeof syncRouteState === 'function') syncRouteState();
      if (typeof render === 'function') render();
    }
  };

  if (commentModal) {
    commentModal.querySelectorAll('[data-map-comment-close="1"]').forEach((button) => {
      button.addEventListener('click', closeMapCommentModal);
    });
  }
  if (commentOpenCardBtn) {
    commentOpenCardBtn.addEventListener('click', openCardFromMapComment);
  }
  stepView.querySelectorAll('[data-map-comment-id]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openMapCommentModal(button.dataset.mapCommentKind, button.dataset.mapCommentId);
    });
  });
}

function bindMapStrategyNavigationInteractions({
  stepView,
  viewport,
  navigateToStrategyLink,
  navigateToStrategyPerspective
}) {
  stepView.querySelectorAll('[data-action="open-strategy-link"]').forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (typeof navigateToStrategyLink !== 'function') return;
      await navigateToStrategyLink({
        targetInstitutionSlug: button.dataset.targetInstitution,
        targetStrategySlug: button.dataset.targetStrategy,
        targetGuidelineId: button.dataset.targetGuideline
      });
    });
  });

  stepView.querySelectorAll('[data-action="open-strategy-perspective"]').forEach((node) => {
    const openPerspective = async (event) => {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      if (!(node instanceof HTMLElement)) return;
      if (node.dataset.justDragged === '1') return;
      if (viewport instanceof HTMLElement && viewport.dataset.justPanned === '1') return;
      if (typeof navigateToStrategyPerspective !== 'function') return;
      await navigateToStrategyPerspective({
        targetInstitutionSlug: node.dataset.targetInstitution,
        targetStrategySlug: node.dataset.targetStrategy,
        preserveStrategicLayer: true
      });
    };

    node.addEventListener('click', openPerspective);
    node.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      openPerspective(event);
    });
  });
}

function bindMapViewportControlInteractions({ stepView, viewport, world, onFullscreenError }) {
  const resetButtons = Array.from(stepView.querySelectorAll('[data-map-reset-btn]'));
  if (resetButtons.length && viewport && world) {
    resetButtons.forEach((button) => {
      button.addEventListener('click', () => {
        fitMapToCurrentNodes(viewport, world);
      });
    });
  }

  const fullscreenButtons = Array.from(stepView.querySelectorAll('[data-map-fullscreen-btn]'));
  if (!fullscreenButtons.length) return;

  updateMapFullscreenButtonLabel();
  fullscreenButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        if (document.fullscreenElement === stepView) {
          await document.exitFullscreen();
        } else if (stepView && typeof stepView.requestFullscreen === 'function') {
          await stepView.requestFullscreen();
        }
      } catch (error) {
        if (typeof onFullscreenError === 'function') onFullscreenError(error);
        return;
      }

      updateMapFullscreenButtonLabel();
      if (viewport && world) fitMapToCurrentNodes(viewport, world);
    });
  });
}

function buildMapViewShellMarkup({
  mapHeader,
  activeLayer,
  editable,
  mapToolbar,
  strategicNoLinksMarkup,
  graph,
  guidelineEdgeMarkup,
  strategyGuidelineEdgeMarkup,
  initiativeEdgeMarkup,
  nodeMarkup,
  strategicEdgeMarkup,
  mapWatermarkClass,
  embedBranding
}) {
  return `
    <section class="map-view-shell">
      ${mapHeader}
      <section id="strategyMapViewport" class="strategy-map-viewport map-layer-${activeLayer} ${editable ? 'map-editable' : ''}">
        ${mapToolbar}
        ${strategicNoLinksMarkup}
        <div id="strategyMapWorld" class="strategy-map-world" style="width:${graph.width}px;height:${graph.height}px;">
          <svg class="strategy-map-lines guideline-lines" viewBox="0 0 ${graph.width} ${graph.height}" preserveAspectRatio="none">
            ${guidelineEdgeMarkup}
            ${strategyGuidelineEdgeMarkup}
          </svg>
          <svg class="strategy-map-lines initiative-lines" viewBox="0 0 ${graph.width} ${graph.height}" preserveAspectRatio="none">
            <defs>
              <linearGradient id="mapInitiativeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#2b6fbe" />
                <stop offset="100%" stop-color="#1f4f84" />
              </linearGradient>
            </defs>
            ${initiativeEdgeMarkup}
          </svg>
          ${nodeMarkup}
          <svg class="strategy-map-lines strategic-overlay-lines" viewBox="0 0 ${graph.width} ${graph.height}" preserveAspectRatio="none">
            ${strategicEdgeMarkup}
          </svg>
        </div>
        <div class="${mapWatermarkClass}" aria-hidden="true">
          <img src="assets/digistrategija-logo.svg?v=20260212c" alt="" />
        </div>
        ${embedBranding}
      </section>
    </section>
    <section id="mapCommentModal" class="map-comment-modal" hidden>
      <button type="button" class="map-comment-backdrop" data-map-comment-close="1" aria-label="${escapeHtml(mapLang('Uždaryti', 'Close'))}"></button>
      <article class="map-comment-card" role="dialog" aria-modal="true" aria-labelledby="mapCommentTitle">
        <div class="header-row">
          <h3 id="mapCommentTitle">${escapeHtml(mapLang('Elementas', 'Item'))}</h3>
          <button id="mapCommentCloseBtn" class="btn btn-ghost" type="button" data-map-comment-close="1">${escapeHtml(mapLang('Uždaryti', 'Close'))}</button>
        </div>
        <p id="mapCommentDescription" class="prompt map-comment-description"></p>
        <div class="map-comment-actions">
          <button id="mapCommentOpenCardBtn" class="btn btn-primary" type="button">${escapeHtml(mapLang('Atidaryti kortelę', 'Open card'))}</button>
        </div>
        <strong>${escapeHtml(mapLang('Komentarai', 'Comments'))}</strong>
        <ul id="mapCommentList" class="mini-list"></ul>
      </article>
    </section>
  `;
}
