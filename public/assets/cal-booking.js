(function (C, A, L) {
  const push = function (api, args) {
    api.q.push(args);
  };
  const document = C.document;

  C.Cal = C.Cal || function () {
    const cal = C.Cal;
    const args = arguments;

    if (!cal.loaded) {
      cal.ns = {};
      cal.q = cal.q || [];
      document.head.appendChild(document.createElement('script')).src = A;
      cal.loaded = true;
    }

    if (args[0] === L) {
      const api = function () {
        push(api, arguments);
      };
      const namespace = args[1];
      api.q = api.q || [];

      if (typeof namespace === 'string') {
        cal.ns[namespace] = cal.ns[namespace] || api;
        push(cal.ns[namespace], args);
        push(cal, ['initNamespace', namespace]);
      } else {
        push(cal, args);
      }
      return;
    }

    push(cal, args);
  };
})(window, 'https://app.cal.com/embed/embed.js', 'init');

Cal('init', '20-min-intro-call', { origin: 'https://app.cal.com' });
Cal.config = Cal.config || {};
Cal.config.forwardQueryParams = true;

Cal.ns['20-min-intro-call']('ui', {
  theme: 'light',
  cssVarsPerTheme: {
    light: {
      'cal-brand': '#0A192F'
    }
  },
  hideEventTypeDetails: false,
  layout: 'month_view'
});

document.addEventListener('click', function (event) {
  const trigger = event.target.closest('[data-cal-link]');

  if (!trigger || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();

  let config = {};
  try {
    config = JSON.parse(trigger.dataset.calConfig || '{}');
  } catch (error) {
    config = {};
  }

  const namespace = trigger.dataset.calNamespace;
  const cal = namespace && Cal.ns[namespace] ? Cal.ns[namespace] : Cal;

  cal('modal', {
    calLink: trigger.dataset.calLink,
    calOrigin: 'https://app.cal.com',
    config: config
  });

  window.setTimeout(function () {
    const modal = document.querySelector('cal-modal-box');
    if (!modal || modal.getAttribute('state') === 'loading') {
      window.location.assign(trigger.href);
    }
  }, 8000);
}, true);
