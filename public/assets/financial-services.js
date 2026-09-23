const root = document.documentElement;
  function updateTrace() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    root.style.setProperty('--trace-depth', `${Math.max(0, Math.min(1, progress)) * 100}%`);
  }

  // The diagrams render in their final state from the first paint; this script only drives the reading rail.
  window.addEventListener('scroll', updateTrace, { passive: true });
  window.addEventListener('resize', updateTrace);
  window.addEventListener('DOMContentLoaded', updateTrace);
  updateTrace();
