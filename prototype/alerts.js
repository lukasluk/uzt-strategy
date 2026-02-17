(() => {
  const hasNotyf = typeof window !== 'undefined' && typeof window.Notyf === 'function';
  const now = () => Date.now();
  let lastMessage = '';
  let lastType = '';
  let lastAt = 0;

  const notyf = hasNotyf
    ? new window.Notyf({
      duration: 3200,
      position: { x: 'right', y: 'top' },
      ripple: true,
      dismissible: true,
      types: [
        {
          type: 'success',
          background: '#1f8f4f',
          icon: false
        },
        {
          type: 'error',
          background: '#b63b3b',
          icon: false
        },
        {
          type: 'info',
          background: '#2b6fbe',
          icon: false
        },
        {
          type: 'warning',
          background: '#9b6a1e',
          icon: false
        }
      ]
    })
    : null;

  function normalizeMessage(message) {
    return String(message || '').trim();
  }

  function shouldSkip(type, message) {
    const normalized = normalizeMessage(message);
    if (!normalized) return true;
    const ts = now();
    if (normalized === lastMessage && type === lastType && ts - lastAt < 900) return true;
    lastMessage = normalized;
    lastType = type;
    lastAt = ts;
    return false;
  }

  function show(type, message) {
    const normalized = normalizeMessage(message);
    if (shouldSkip(type, normalized)) return;

    if (!notyf) {
      if (type === 'error') {
        console.error(normalized);
      } else {
        console.log(normalized);
      }
      return;
    }

    notyf.open({ type, message: normalized });
  }

  window.DigiAlerts = {
    success(message) { show('success', message); },
    error(message) { show('error', message); },
    info(message) { show('info', message); },
    warning(message) { show('warning', message); }
  };
})();
