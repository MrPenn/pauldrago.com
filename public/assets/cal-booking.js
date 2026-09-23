(function (C, L) {
  const push = function (api, args) {
    api.q.push(args);
  };
  const document = C.document;

  C.Cal = C.Cal || function () {
    const cal = C.Cal;
    const args = arguments;

    if (!cal.ns) {
      cal.ns = {};
      cal.q = cal.q || [];
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
})(window, 'init');

// The embed script is fetched on demand instead of on page load; queued setup calls replay once it runs.
let calEmbedLoaded = null;
function loadCalEmbed() {
  if (!calEmbedLoaded) {
    calEmbedLoaded = new Promise(function (resolve) {
      const script = document.createElement('script');
      script.src = 'https://app.cal.com/embed/embed.js';
      script.onload = resolve;
      script.onerror = resolve;
      document.head.appendChild(script);
    });
  }
  return calEmbedLoaded;
}

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

Cal.ns['20-min-intro-call']('on', {
  action: 'bookingSuccessfulV2',
  callback: function () {
    window.posthog?.capture('booking_completed', { event_type: '20-min-intro-call' });
  }
});

// Fetch the embed when a visitor shows intent, or once the page has been idle for a few seconds.
['pointerover', 'focusin', 'touchstart'].forEach(function (type) {
  document.addEventListener(type, function onIntent(event) {
    if (event.target.closest && event.target.closest('[data-cal-link]')) {
      document.removeEventListener(type, onIntent, true);
      loadCalEmbed();
    }
  }, true);
});
window.addEventListener('load', function () {
  setTimeout(function () { (window.requestIdleCallback || setTimeout)(loadCalEmbed); }, 4000);
}, { once: true });

document.addEventListener('click', function (event) {
  const trigger = event.target.closest('[data-cal-link]');

  if (!trigger || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();

  window.posthog?.capture('booking_cta_clicked', {
    cta_location: trigger.closest('header') ? 'header' : trigger.classList.contains('btn-small') ? 'article_author' : 'page_content'
  });

  let config = {};
  try {
    config = JSON.parse(trigger.dataset.calConfig || '{}');
  } catch (error) {
    config = {};
  }

  const namespace = trigger.dataset.calNamespace;

  // A modal queued before the embed finishes loading is dropped, so open it only once the script has run.
  loadCalEmbed().then(function () {
    const cal = namespace && Cal.ns[namespace] ? Cal.ns[namespace] : Cal;
    cal('modal', {
      calLink: trigger.dataset.calLink,
      calOrigin: 'https://app.cal.com',
      config: config
    });
  });

  window.setTimeout(function () {
    const modal = document.querySelector('cal-modal-box');
    if (!modal || modal.getAttribute('state') === 'loading') {
      window.posthog?.capture('booking_fallback_redirect');
      window.location.assign(trigger.href);
    }
  }, 8000);
}, true);
