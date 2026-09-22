function updateCohortCalc() {
      const accountsInput = document.getElementById('calc-input-accounts');
      const costInput = document.getElementById('calc-input-cost');
      const closedInput = document.getElementById('calc-input-closed');
      
      if (!accountsInput || !costInput || !closedInput) return;
      
      const accounts = Math.max(0, parseFloat(accountsInput.value) || 0);
      const cost = Math.max(0, parseFloat(costInput.value) || 0);
      const rawClosed = parseFloat(closedInput.value) || 0;
      const closedRate = Math.min(1, Math.max(0, rawClosed / 100));
      
      const spend = accounts * cost;
      const closedSpend = Math.round(accounts * closedRate) * cost;
      const yearOneOfDay90Survivors = 0.41 / 0.55;
      const survivors = Math.round(accounts * (1 - closedRate) * yearOneOfDay90Survivors);
      const perSurvivor = survivors > 0 ? Math.round(spend / survivors) : 0;
      
      const fmt = (n) => '$' + Math.round(n).toLocaleString('en-US');
      const fmtNum = (n) => Math.round(n).toLocaleString('en-US');
      
      const elSpend = document.getElementById('calc-spend');
      const elClosedSpend = document.getElementById('calc-closed-spend');
      const elSurvivors = document.getElementById('calc-survivors');
      const elPerSurvivor = document.getElementById('calc-per-survivor');
      const elHole = document.getElementById('calc-hole');
      
      if (elSpend) elSpend.textContent = fmt(spend);
      if (elClosedSpend) elClosedSpend.textContent = fmt(closedSpend);
      if (elSurvivors) elSurvivors.textContent = fmtNum(survivors);
      if (elPerSurvivor) elPerSurvivor.textContent = fmt(perSurvivor);
      if (elHole) elHole.textContent = fmt(perSurvivor);
      const elReported = document.getElementById('calc-reported');
      if (elReported) elReported.textContent = fmt(cost);

      const artifactSpend = document.getElementById('artifact-spend');
      const artifactOpened = document.getElementById('artifact-opened');
      const artifactDay90 = document.getElementById('artifact-day90');
      const artifactYear1 = document.getElementById('artifact-year1');
      if (artifactSpend) artifactSpend.textContent = fmt(spend);
      if (artifactOpened) artifactOpened.textContent = fmtNum(accounts);
      if (artifactDay90) artifactDay90.textContent = fmtNum(accounts * (1 - closedRate));
      if (artifactYear1) artifactYear1.textContent = fmtNum(survivors);
      
      const elBridge = document.getElementById('bridge-hole');
      if (elBridge) elBridge.textContent = fmt(perSurvivor);
    }

    ['calc-input-accounts', 'calc-input-cost', 'calc-input-closed'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', updateCohortCalc);
      }
    });
    window.addEventListener('DOMContentLoaded', updateCohortCalc);
    updateCohortCalc();

    const pageRoot = document.documentElement;
    function updateTrace() {
      const scrollable = pageRoot.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      pageRoot.style.setProperty('--trace-depth', `${Math.max(0, Math.min(1, progress)) * 100}%`);
    }
    window.addEventListener('scroll', updateTrace, { passive: true });
    window.addEventListener('resize', updateTrace);
    updateTrace();
