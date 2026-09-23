/**
 * VitalPulse: BP & Sugar Tracker — Interactive Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  initLiveGaugeSimulator();
  initFaqAccordion();
  initMobileMenu();
  initCopyButtons();
});

// ==========================================================================
// 1. Live Interactive Tachometer Simulator
// ==========================================================================
function initLiveGaugeSimulator() {
  const modeBpBtn = document.getElementById('sim-mode-bp');
  const modeSugarBtn = document.getElementById('sim-mode-sugar');
  const bpControls = document.getElementById('bp-controls');
  const sugarControls = document.getElementById('sugar-controls');

  const systolicInput = document.getElementById('slider-systolic');
  const diastolicInput = document.getElementById('slider-diastolic');
  const glucoseInput = document.getElementById('slider-glucose');

  const sysDisplay = document.getElementById('val-systolic');
  const diaDisplay = document.getElementById('val-diastolic');
  const glucDisplay = document.getElementById('val-glucose');

  const gaugeIndicatorBead = document.getElementById('gauge-indicator-bead');
  const beadGlow = document.getElementById('bead-glow');
  const beadCore = document.getElementById('bead-core');
  const gaugeArc = document.getElementById('gauge-active-arc');
  const gaugeValBig = document.getElementById('gauge-val-big');
  const gaugeUnitSmall = document.getElementById('gauge-unit-small');
  const gaugeBadge = document.getElementById('gauge-status-badge');

  const metric1Title = document.getElementById('metric-1-title');
  const metric1Val = document.getElementById('metric-1-val');
  const metric2Title = document.getElementById('metric-2-title');
  const metric2Val = document.getElementById('metric-2-val');

  if (!systolicInput || !gaugeArc) return;

  let currentMode = 'BP'; // 'BP' or 'SUGAR'

  function updateBpSimulation() {
    const sys = parseInt(systolicInput.value, 10);
    const dia = parseInt(diastolicInput.value, 10);

    sysDisplay.textContent = sys;
    diaDisplay.textContent = dia;

    // Range: 80 mmHg to 200 mmHg (matching Android app CircularArcGauge.kt)
    const minVal = 80;
    const maxVal = 200;
    const sweepFraction = Math.max(0, Math.min(1, (sys - minVal) / (maxVal - minVal)));
    const activeSweepDegrees = Math.max(8, sweepFraction * 360);

    // AHA 2017 Blood Pressure Risk Classification
    let category = '';
    let color = '';
    let bg = '';

    if (sys > 180 || dia > 120) {
      category = 'Hypertensive Crisis';
      color = '#DC2626';
      bg = 'rgba(220, 38, 38, 0.2)';
    } else if (sys >= 140 || dia >= 90) {
      category = 'Hypertension Stage 2';
      color = '#F97316';
      bg = 'rgba(249, 115, 22, 0.2)';
    } else if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) {
      category = 'Hypertension Stage 1';
      color = '#F59E0B';
      bg = 'rgba(245, 158, 11, 0.2)';
    } else if (sys >= 120 && sys <= 129 && dia < 80) {
      category = 'Elevated';
      color = '#06B6D4';
      bg = 'rgba(6, 182, 212, 0.2)';
    } else {
      category = 'Normal';
      color = '#10B981';
      bg = 'rgba(16, 185, 129, 0.2)';
    }

    // Dynamic metrics
    const map = Math.round((2 * dia + sys) / 3);
    const pp = sys - dia;

    gaugeValBig.innerHTML = `${sys}<span style="font-size: 1.4rem; font-weight: 700; color: #94A3B8;">/${dia}</span>`;
    gaugeUnitSmall.textContent = 'mmHg • AHA 2017';
    gaugeBadge.textContent = category;
    gaugeBadge.style.color = color;
    gaugeBadge.style.backgroundColor = bg;
    gaugeBadge.style.borderColor = color;

    metric1Title.textContent = 'Mean Arterial (MAP)';
    metric1Val.textContent = `${map} mmHg`;
    metric2Title.textContent = 'Pulse Pressure (PP)';
    metric2Val.textContent = `${pp} mmHg`;

    renderGaugeSweep(activeSweepDegrees, color);
  }

  function updateSugarSimulation() {
    const gluc = parseInt(glucoseInput.value, 10);
    glucDisplay.textContent = `${gluc} mg/dL`;

    // Range: 50 to 250 mg/dL (matching Android app CircularArcGauge.kt)
    const minVal = 50;
    const maxVal = 250;
    const sweepFraction = Math.max(0, Math.min(1, (gluc - minVal) / (maxVal - minVal)));
    const activeSweepDegrees = Math.max(8, sweepFraction * 360);

    let category = '';
    let color = '';
    let bg = '';

    // ADA Glycemic Clinical Standards (Fasting Context)
    if (gluc < 70) {
      category = 'Hypoglycemia Alert';
      color = '#DC2626';
      bg = 'rgba(220, 38, 38, 0.2)';
    } else if (gluc <= 99) {
      category = 'Normal Glycemic';
      color = '#10B981';
      bg = 'rgba(16, 185, 129, 0.2)';
    } else if (gluc <= 125) {
      category = 'Pre-Diabetes Range';
      color = '#F59E0B';
      bg = 'rgba(245, 158, 11, 0.2)';
    } else {
      category = 'Elevated Glycemic';
      color = '#EF4444';
      bg = 'rgba(239, 68, 68, 0.2)';
    }

    // Estimated HbA1c formula: (eAG + 46.7) / 28.7
    const hba1c = ((gluc + 46.7) / 28.7).toFixed(1);
    const mmol = (gluc / 18.0182).toFixed(1);

    gaugeValBig.textContent = gluc;
    gaugeUnitSmall.textContent = `mg/dL (${mmol} mmol/L)`;
    gaugeBadge.textContent = category;
    gaugeBadge.style.color = color;
    gaugeBadge.style.backgroundColor = bg;
    gaugeBadge.style.borderColor = color;

    metric1Title.textContent = 'Estimated HbA1c';
    metric1Val.textContent = `~${hba1c}%`;
    metric2Title.textContent = 'SI Unit Conversion';
    metric2Val.textContent = `${mmol} mmol/L`;

    renderGaugeSweep(activeSweepDegrees, color);
  }

  function renderGaugeSweep(degrees, color) {
    if (!gaugeArc || !gaugeIndicatorBead) return;
    const r = 90;
    const c = 2 * Math.PI * r; // ≈ 565.487
    const strokeLength = (degrees / 360) * c;
    gaugeArc.style.strokeDasharray = `${strokeLength} ${c}`;
    gaugeArc.style.stroke = color;

    // Rotate indicator bead along circumference
    gaugeIndicatorBead.setAttribute('transform', `rotate(${degrees}, 140, 140)`);
    if (beadGlow) beadGlow.setAttribute('fill', color);
    if (beadCore) beadCore.setAttribute('fill', color);
  }

  // Event Listeners
  systolicInput.addEventListener('input', updateBpSimulation);
  diastolicInput.addEventListener('input', updateBpSimulation);
  glucoseInput.addEventListener('input', updateSugarSimulation);

  if (modeBpBtn && modeSugarBtn) {
    modeBpBtn.addEventListener('click', () => {
      currentMode = 'BP';
      modeBpBtn.classList.add('btn-hero-primary');
      modeBpBtn.classList.remove('btn-hero-secondary');
      modeSugarBtn.classList.add('btn-hero-secondary');
      modeSugarBtn.classList.remove('btn-hero-primary');
      bpControls.style.display = 'block';
      sugarControls.style.display = 'none';
      updateBpSimulation();
    });

    modeSugarBtn.addEventListener('click', () => {
      currentMode = 'SUGAR';
      modeSugarBtn.classList.add('btn-hero-primary');
      modeSugarBtn.classList.remove('btn-hero-secondary');
      modeBpBtn.classList.add('btn-hero-secondary');
      modeBpBtn.classList.remove('btn-hero-primary');
      bpControls.style.display = 'none';
      sugarControls.style.display = 'block';
      updateSugarSimulation();
    });
  }

  // Initial calculation
  updateBpSimulation();
}

// ==========================================================================
// 2. FAQ Accordion Toggle
// ==========================================================================
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!question || !answer) return;

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close other open items for cleaner UX
      faqItems.forEach(other => {
        if (other !== item && other.classList.contains('open')) {
          other.classList.remove('open');
          other.querySelector('.faq-answer').style.maxHeight = null;
        }
      });

      if (isOpen) {
        item.classList.remove('open');
        answer.style.maxHeight = null;
      } else {
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 30 + 'px';
      }
    });
  });
}

// ==========================================================================
// 3. Mobile Navigation Menu
// ==========================================================================
function initMobileMenu() {
  const toggleBtn = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (!toggleBtn || !navLinks) return;

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    navLinks.classList.toggle('mobile-open');
    const isOpen = navLinks.classList.contains('mobile-open');
    toggleBtn.innerHTML = isOpen ? '✕' : '☰';
    toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Auto-close menu when tapping any link inside
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('mobile-open');
      toggleBtn.innerHTML = '☰';
      toggleBtn.setAttribute('aria-expanded', 'false');
    });
  });

  // Close when tapping outside the menu
  document.addEventListener('click', (e) => {
    if (!navLinks.contains(e.target) && !toggleBtn.contains(e.target)) {
      if (navLinks.classList.contains('mobile-open')) {
        navLinks.classList.remove('mobile-open');
        toggleBtn.innerHTML = '☰';
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
    }
  });
}

// ==========================================================================
// 4. One-Click Copy Privacy Policy Link for Play Console
// ==========================================================================
function initCopyButtons() {
  const copyButtons = document.querySelectorAll('.copy-policy-btn-trigger, #copy-policy-link-btn');
  const urlDisplay = document.getElementById('policy-url-display');
  const toast = document.getElementById('toast-notification');

  // Update display with active window URL if on privacy page
  if (urlDisplay && window.location.href) {
    urlDisplay.textContent = window.location.href;
  }

  if (copyButtons.length === 0) return;

  copyButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const currentUrl = window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(currentUrl).then(() => {
          showToast('✓ Privacy Policy URL copied for Play Console!');
        }).catch(() => {
          copyFallback(currentUrl);
        });
      } else {
        copyFallback(currentUrl);
      }
    });
  });

  function copyFallback(text) {
    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    tempInput.style.position = 'fixed';
    tempInput.style.left = '-9999px';
    document.body.appendChild(tempInput);
    tempInput.focus();
    tempInput.select();
    try {
      document.execCommand('copy');
      showToast('✓ Privacy Policy URL copied for Play Console!');
    } catch (err) {
      showToast('Link ready to copy from your browser address bar.');
    }
    document.body.removeChild(tempInput);
  }

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }
}
