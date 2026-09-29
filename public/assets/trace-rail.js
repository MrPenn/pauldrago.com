/* Reading progress for browsers without scroll timelines (site-shell.css draws the rail).
   Where the browser has scroll timelines the stylesheet fills the rail and this does nothing. */
(function () {
  if (window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()')) return;
  var root = document.documentElement, tick = null;
  var trace = function () {
    tick = null;
    var max = root.scrollHeight - window.innerHeight;
    root.style.setProperty('--trace-depth', (max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) * 100 : 0) + '%');
  };
  var schedule = function () { if (tick === null) tick = requestAnimationFrame(trace); };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  trace();
})();
