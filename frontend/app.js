// Configuration: determine API base URL
const API_BASE_URL = (window.location.protocol === 'file:' || !window.location.origin)
  ? 'http://localhost:8000'
  : window.location.origin;

// DOM Elements
const form = document.getElementById('predictionForm');
const btnPredict = document.getElementById('btnPredict');
const btnSpinner = document.getElementById('btnSpinner');
const formError = document.getElementById('formError');
const systemStatus = document.getElementById('systemStatus');
const statusLabel = document.getElementById('statusLabel');

// Results elements
const resultsPlaceholder = document.getElementById('resultsPlaceholder');
const resultsContent = document.getElementById('resultsContent');
const outcomeBanner = document.getElementById('outcomeBanner');
const outcomeIcon = document.getElementById('outcomeIcon');
const outcomeLabel = document.getElementById('outcomeLabel');
const intentPill = document.getElementById('intentPill');
const probValue = document.getElementById('probValue');
const progressBar = document.getElementById('progressBar');
const recText = document.getElementById('recText');
const insTotalPages = document.getElementById('insTotalPages');
const insTotalDuration = document.getElementById('insTotalDuration');
const insAvgTime = document.getElementById('insAvgTime');
const insInteraction = document.getElementById('insInteraction');
const btnToggleDebug = document.getElementById('btnToggleDebug');
const debugJson = document.getElementById('debugJson');

// Scenario Presets
const presets = {
  highIntent: {
    Administrative: 3,
    Administrative_Duration: 120.0,
    Informational: 1,
    Informational_Duration: 45.0,
    ProductRelated: 25,
    ProductRelated_Duration: 950.0,
    PageValues: 35.5,
    BounceRates: 0.005,
    ExitRates: 0.015,
    SpecialDay: 0.0,
    Month: 'Nov',
    VisitorType: 'Returning_Visitor',
    Weekend: 'false',
    TrafficType: 2,
    OperatingSystems: 2,
    Browser: 2,
    Region: 1,
  },
  casual: {
    Administrative: 0,
    Administrative_Duration: 0.0,
    Informational: 0,
    Informational_Duration: 0.0,
    ProductRelated: 2,
    ProductRelated_Duration: 25.0,
    PageValues: 0.0,
    BounceRates: 0.20,
    ExitRates: 0.20,
    SpecialDay: 0.0,
    Month: 'Feb',
    VisitorType: 'Returning_Visitor',
    Weekend: 'false',
    TrafficType: 1,
    OperatingSystems: 1,
    Browser: 1,
    Region: 1,
  },
  weekend: {
    Administrative: 2,
    Administrative_Duration: 60.0,
    Informational: 0,
    Informational_Duration: 0.0,
    ProductRelated: 18,
    ProductRelated_Duration: 480.0,
    PageValues: 18.0,
    BounceRates: 0.01,
    ExitRates: 0.02,
    SpecialDay: 0.0,
    Month: 'Dec',
    VisitorType: 'Returning_Visitor',
    Weekend: 'true',
    TrafficType: 2,
    OperatingSystems: 2,
    Browser: 2,
    Region: 3,
  },
  clear: {
    Administrative: 0,
    Administrative_Duration: 0.0,
    Informational: 0,
    Informational_Duration: 0.0,
    ProductRelated: 0,
    ProductRelated_Duration: 0.0,
    PageValues: 0.0,
    BounceRates: 0.0,
    ExitRates: 0.0,
    SpecialDay: 0.0,
    Month: 'Nov',
    VisitorType: 'Returning_Visitor',
    Weekend: 'false',
    TrafficType: 1,
    OperatingSystems: 1,
    Browser: 1,
    Region: 1,
  }
};

function applyPreset(data) {
  for (const [key, value] of Object.entries(data)) {
    const el = document.getElementById(key);
    if (el) {
      el.value = value;
    }
  }
  clearError();
}

// Preset button handlers
document.getElementById('presetHighIntent').addEventListener('click', () => applyPreset(presets.highIntent));
document.getElementById('presetCasual').addEventListener('click', () => applyPreset(presets.casual));
document.getElementById('presetWeekend').addEventListener('click', () => applyPreset(presets.weekend));
document.getElementById('presetClear').addEventListener('click', () => applyPreset(presets.clear));

// Check Backend Health
async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      const data = await response.json();
      systemStatus.className = 'status-indicator online';
      statusLabel.textContent = `Backend Online • ${data.model_name.split(' ')[0]}`;
    } else {
      throw new Error('Health check returned non-200');
    }
  } catch (err) {
    systemStatus.className = 'status-indicator offline';
    statusLabel.textContent = 'Backend Offline (Start FastAPI server)';
  }
}

// Clear error banner
function clearError() {
  formError.style.display = 'none';
  formError.textContent = '';
}

// Show error banner
function showError(msg) {
  formError.style.display = 'block';
  formError.textContent = msg;
}

// Validate Inputs on Client
function validateFormData(payload) {
  if (payload.BounceRates < 0 || payload.BounceRates > 1.0) {
    return 'Bounce Rate must be a probability between 0.0 and 1.0.';
  }
  if (payload.ExitRates < 0 || payload.ExitRates > 1.0) {
    return 'Exit Rate must be a probability between 0.0 and 1.0.';
  }
  if (payload.PageValues < 0) {
    return 'PageValues cannot be negative.';
  }
  if (payload.Administrative < 0 || payload.Informational < 0 || payload.ProductRelated < 0) {
    return 'Page count values cannot be negative.';
  }
  if (payload.Administrative_Duration < 0 || payload.Informational_Duration < 0 || payload.ProductRelated_Duration < 0) {
    return 'Duration values cannot be negative.';
  }
  return null;
}

// Form Submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();

  const formData = new FormData(form);
  const payload = {
    Administrative: parseInt(formData.get('Administrative') || '0', 10),
    Administrative_Duration: parseFloat(formData.get('Administrative_Duration') || '0'),
    Informational: parseInt(formData.get('Informational') || '0', 10),
    Informational_Duration: parseFloat(formData.get('Informational_Duration') || '0'),
    ProductRelated: parseInt(formData.get('ProductRelated') || '0', 10),
    ProductRelated_Duration: parseFloat(formData.get('ProductRelated_Duration') || '0'),
    BounceRates: parseFloat(formData.get('BounceRates') || '0'),
    ExitRates: parseFloat(formData.get('ExitRates') || '0'),
    PageValues: parseFloat(formData.get('PageValues') || '0'),
    SpecialDay: parseFloat(formData.get('SpecialDay') || '0'),
    Month: formData.get('Month'),
    OperatingSystems: parseInt(formData.get('OperatingSystems') || '1', 10),
    Browser: parseInt(formData.get('Browser') || '1', 10),
    Region: parseInt(formData.get('Region') || '1', 10),
    TrafficType: parseInt(formData.get('TrafficType') || '1', 10),
    VisitorType: formData.get('VisitorType'),
    Weekend: formData.get('Weekend') === 'true',
  };

  const validationError = validateFormData(payload);
  if (validationError) {
    showError(validationError);
    return;
  }

  // Set loading state
  btnPredict.disabled = true;
  btnSpinner.style.display = 'inline-block';

  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const detail = errorData.detail || 'Server returned an error processing prediction.';
      throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    }

    const result = await response.json();
    renderResults(result);

  } catch (err) {
    showError(`Prediction failed: ${err.message}. Ensure the FastAPI server is running on ${API_BASE_URL}.`);
  } finally {
    btnPredict.disabled = false;
    btnSpinner.style.display = 'none';
  }
});

// Render Results Function
function renderResults(result) {
  resultsPlaceholder.style.display = 'none';
  resultsContent.style.display = 'block';

  const isPurchase = result.prediction_class === 1;

  // Outcome banner styling
  if (isPurchase) {
    outcomeBanner.className = 'outcome-banner purchase';
    outcomeIcon.textContent = '✓';
    outcomeLabel.textContent = 'Likely to Purchase';
  } else {
    outcomeBanner.className = 'outcome-banner no-purchase';
    outcomeIcon.textContent = '✕';
    outcomeLabel.textContent = 'Unlikely to Purchase';
  }

  // Intent pill
  intentPill.textContent = result.intent_level;
  if (result.intent_level.includes('High')) {
    intentPill.className = 'intent-pill high';
  } else if (result.intent_level.includes('Moderate')) {
    intentPill.className = 'intent-pill moderate';
  } else {
    intentPill.className = 'intent-pill low';
  }

  // Probability meter
  const probPct = (result.purchase_probability * 100).toFixed(1);
  probValue.textContent = `${probPct}%`;
  progressBar.style.width = `${Math.min(Math.max(probPct, 2), 100)}%`;

  // Recommendation
  recText.textContent = result.recommendation;

  // Session summary
  if (result.session_summary) {
    insTotalPages.textContent = result.session_summary.TotalPages;
    insTotalDuration.textContent = `${result.session_summary.TotalDuration.toFixed(1)}s`;
    insAvgTime.textContent = `${result.session_summary.AvgTimePerPage.toFixed(1)}s`;
    insInteraction.textContent = result.session_summary.VisitorType_Weekend;
  }

  // Raw JSON
  debugJson.textContent = JSON.stringify(result, null, 2);
}

// Toggle debug json
btnToggleDebug.addEventListener('click', () => {
  const isHidden = debugJson.style.display === 'none';
  debugJson.style.display = isHidden ? 'block' : 'none';
  btnToggleDebug.textContent = isHidden ? 'Hide Raw API JSON Payload ▴' : 'Show Raw API JSON Payload ▾';
});

// Initial health check on load
checkBackendHealth();
