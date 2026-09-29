/* The measurement reset's cohort calculator: what the opening campaign cost per account still
   open at the end of year one. */
(function () {
  function updateCohortCalc() {
    const accountsInput = document.getElementById('calc-input-accounts') as HTMLInputElement | null;
    const costInput = document.getElementById('calc-input-cost') as HTMLInputElement | null;
    const closedInput = document.getElementById('calc-input-closed') as HTMLInputElement | null;

    if (!accountsInput || !costInput || !closedInput) return;

    const accounts = Math.max(0, parseFloat(accountsInput.value) || 0);
    const cost = Math.max(0, parseFloat(costInput.value) || 0);
    const rawClosed = parseFloat(closedInput.value) || 0;
    const closedRate = Math.min(1, Math.max(0, rawClosed / 100));

    const spend = accounts * cost;
    const closedSpend = Math.round(accounts * closedRate) * cost;
    const yearOneOfDay90Survivors = 0.41 / 0.55;
    const survivors = Math.round(accounts * (1 - closedRate) * yearOneOfDay90Survivors);
    const perSurvivor = survivors > 0 ? Math.round(spend / survivors) : null;

    const fmt = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
    // When every account closes there is no surviving account to divide by.
    const fmtPer = (n: number | null) => n === null ? 'n/a' : fmt(n);
    const fmtNum = (n: number) => Math.round(n).toLocaleString('en-US');

    const elSpend = document.getElementById('calc-spend');
    const elClosedSpend = document.getElementById('calc-closed-spend');
    const elSurvivors = document.getElementById('calc-survivors');
    const elPerSurvivor = document.getElementById('calc-per-survivor');
    const elHole = document.getElementById('calc-hole');

    if (elSpend) elSpend.textContent = fmt(spend);
    if (elClosedSpend) elClosedSpend.textContent = fmt(closedSpend);
    if (elSurvivors) elSurvivors.textContent = fmtNum(survivors);
    if (elPerSurvivor) elPerSurvivor.textContent = fmtPer(perSurvivor);
    if (elHole) elHole.textContent = fmtPer(perSurvivor);
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
  }

  // On leaving a field, show the value the calculation actually used.
  const limits: Record<string, [number, number]> = { 'calc-input-accounts': [0, Infinity], 'calc-input-cost': [0, Infinity], 'calc-input-closed': [0, 100] };
  Object.entries(limits).forEach(([id, [min, max]]) => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (!el) return;
    el.addEventListener('change', () => {
      const value = parseFloat(el.value);
      el.value = String(Math.min(max, Math.max(min, isFinite(value) ? value : 0)));
      updateCohortCalc();
    });
  });

  let hasTrackedCalculatorUse = false;
  ['calc-input-accounts', 'calc-input-cost', 'calc-input-closed'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        updateCohortCalc();
        if (!hasTrackedCalculatorUse) {
          window.posthog?.capture('measurement_calculator_used');
          hasTrackedCalculatorUse = true;
        }
      });
    }
  });
  window.addEventListener('DOMContentLoaded', updateCohortCalc);
  updateCohortCalc();
})();
