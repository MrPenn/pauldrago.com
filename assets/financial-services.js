const root = document.documentElement;
  const traced = document.querySelectorAll('.brief-panel, .router-row, .model-schematic');

  function updateTrace() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    root.style.setProperty('--trace-depth', `${Math.max(0, Math.min(1, progress)) * 100}%`);
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.28 });

    traced.forEach((item) => observer.observe(item));
  } else {
    traced.forEach((item) => item.classList.add('is-visible'));
  }

  window.addEventListener('scroll', updateTrace, { passive: true });
  window.addEventListener('resize', updateTrace);
  window.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.brief-panel')?.classList.add('is-visible');
    updateTrace();
  });
  document.querySelector('.brief-panel')?.classList.add('is-visible');
  updateTrace();
