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

// ══════════════════════════════════════════════════════════════
// MODE NAVIGATION (Single Session vs. Batch Prediction)
// ══════════════════════════════════════════════════════════════
const tabSingle = document.getElementById('tabSingle');
const tabBatch = document.getElementById('tabBatch');
const viewSingle = document.getElementById('viewSingle');
const viewBatch = document.getElementById('viewBatch');

function switchTab(mode) {
  if (mode === 'single') {
    tabSingle.classList.add('active');
    tabBatch.classList.remove('active');
    viewSingle.style.display = 'block';
    viewBatch.style.display = 'none';
  } else {
    tabBatch.classList.add('active');
    tabSingle.classList.remove('active');
    viewBatch.style.display = 'block';
    viewSingle.style.display = 'none';
  }
}

if (tabSingle && tabBatch) {
  tabSingle.addEventListener('click', () => switchTab('single'));
  tabBatch.addEventListener('click', () => switchTab('batch'));
}

// ══════════════════════════════════════════════════════════════
// BATCH PREDICTION MODULE
// ══════════════════════════════════════════════════════════════
let currentBatchSessions = [];
let currentBatchResults = null;

// DOM Elements - Batch Input
const dropZone = document.getElementById('batchDropZone');
const batchFileInput = document.getElementById('batchFileInput');
const btnBrowseFile = document.getElementById('btnBrowseFile');
const batchFileStatus = document.getElementById('batchFileStatus');
const batchFileName = document.getElementById('batchFileName');
const batchRecordCount = document.getElementById('batchRecordCount');
const btnRemoveBatchFile = document.getElementById('btnRemoveBatchFile');

const btnLoadSampleBatch = document.getElementById('btnLoadSampleBatch');
const btnDownloadTemplate = document.getElementById('btnDownloadTemplate');
const btnClearBatch = document.getElementById('btnClearBatch');

const btnToggleDirectJson = document.getElementById('btnToggleDirectJson');
const directJsonLabel = document.getElementById('directJsonLabel');
const directJsonContainer = document.getElementById('directJsonContainer');
const batchJsonArea = document.getElementById('batchJsonArea');
const btnApplyJson = document.getElementById('btnApplyJson');

const btnRunBatch = document.getElementById('btnRunBatch');
const btnRunBatchText = document.getElementById('btnRunBatchText');
const btnBatchSpinner = document.getElementById('btnBatchSpinner');
const batchErrorAlert = document.getElementById('batchErrorAlert');

// DOM Elements - Batch Results
const batchPlaceholder = document.getElementById('batchPlaceholder');
const batchResultsContent = document.getElementById('batchResultsContent');
const kpiTotalSessions = document.getElementById('kpiTotalSessions');
const kpiPurchases = document.getElementById('kpiPurchases');
const kpiConversionRate = document.getElementById('kpiConversionRate');
const kpiNonPurchases = document.getElementById('kpiNonPurchases');
const kpiAvgProb = document.getElementById('kpiAvgProb');
const kpiHighIntent = document.getElementById('kpiHighIntent');

const filterOutcome = document.getElementById('filterOutcome');
const filterIntent = document.getElementById('filterIntent');
const batchSearchInput = document.getElementById('batchSearchInput');
const btnExportBatchCsv = document.getElementById('btnExportBatchCsv');
const batchTableBody = document.getElementById('batchTableBody');
const batchCountInfo = document.getElementById('batchCountInfo');
const btnToggleBatchDebug = document.getElementById('btnToggleBatchDebug');
const batchDebugJson = document.getElementById('batchDebugJson');

// Sample Batch Dataset (10 Diverse Realistic Sessions)
const SAMPLE_BATCH_DATA = [
  {
    Administrative: 3,
    Administrative_Duration: 120.0,
    Informational: 1,
    Informational_Duration: 45.0,
    ProductRelated: 25,
    ProductRelated_Duration: 950.0,
    BounceRates: 0.005,
    ExitRates: 0.015,
    PageValues: 35.5,
    SpecialDay: 0.0,
    Month: "Nov",
    OperatingSystems: 2,
    Browser: 2,
    Region: 1,
    TrafficType: 2,
    VisitorType: "Returning_Visitor",
    Weekend: false
  },
  {
    Administrative: 0,
    Administrative_Duration: 0.0,
    Informational: 0,
    Informational_Duration: 0.0,
    ProductRelated: 2,
    ProductRelated_Duration: 25.0,
    BounceRates: 0.20,
    ExitRates: 0.20,
    PageValues: 0.0,
    SpecialDay: 0.0,
    Month: "Feb",
    OperatingSystems: 1,
    Browser: 1,
    Region: 1,
    TrafficType: 1,
    VisitorType: "Returning_Visitor",
    Weekend: false
  },
  {
    Administrative: 2,
    Administrative_Duration: 60.0,
    Informational: 0,
    Informational_Duration: 0.0,
    ProductRelated: 18,
    ProductRelated_Duration: 480.0,
    BounceRates: 0.01,
    ExitRates: 0.02,
    PageValues: 18.0,
    SpecialDay: 0.0,
    Month: "Dec",
    OperatingSystems: 2,
    Browser: 2,
    Region: 3,
    TrafficType: 2,
    VisitorType: "Returning_Visitor",
    Weekend: true
  },
  {
    Administrative: 1,
    Administrative_Duration: 30.0,
    Informational: 2,
    Informational_Duration: 75.0,
    ProductRelated: 14,
    ProductRelated_Duration: 320.0,
    BounceRates: 0.02,
    ExitRates: 0.035,
    PageValues: 8.5,
    SpecialDay: 0.0,
    Month: "Oct",
    OperatingSystems: 3,
    Browser: 2,
    Region: 2,
    TrafficType: 3,
    VisitorType: "New_Visitor",
    Weekend: true
  },
  {
    Administrative: 0,
    Administrative_Duration: 0.0,
    Informational: 0,
    Informational_Duration: 0.0,
    ProductRelated: 1,
    ProductRelated_Duration: 10.0,
    BounceRates: 0.20,
    ExitRates: 0.20,
    PageValues: 0.0,
    SpecialDay: 0.0,
    Month: "Mar",
    OperatingSystems: 2,
    Browser: 2,
    Region: 1,
    TrafficType: 1,
    VisitorType: "Returning_Visitor",
    Weekend: false
  },
  {
    Administrative: 5,
    Administrative_Duration: 180.0,
    Informational: 2,
    Informational_Duration: 60.0,
    ProductRelated: 40,
    ProductRelated_Duration: 1450.0,
    BounceRates: 0.003,
    ExitRates: 0.01,
    PageValues: 48.2,
    SpecialDay: 0.0,
    Month: "Nov",
    OperatingSystems: 2,
    Browser: 2,
    Region: 1,
    TrafficType: 2,
    VisitorType: "Returning_Visitor",
    Weekend: false
  },
  {
    Administrative: 4,
    Administrative_Duration: 90.0,
    Informational: 3,
    Informational_Duration: 140.0,
    ProductRelated: 8,
    ProductRelated_Duration: 180.0,
    BounceRates: 0.04,
    ExitRates: 0.06,
    PageValues: 0.0,
    SpecialDay: 0.0,
    Month: "May",
    OperatingSystems: 1,
    Browser: 1,
    Region: 4,
    TrafficType: 4,
    VisitorType: "Returning_Visitor",
    Weekend: false
  },
  {
    Administrative: 2,
    Administrative_Duration: 45.0,
    Informational: 0,
    Informational_Duration: 0.0,
    ProductRelated: 16,
    ProductRelated_Duration: 420.0,
    BounceRates: 0.012,
    ExitRates: 0.025,
    PageValues: 14.8,
    SpecialDay: 0.6,
    Month: "May",
    OperatingSystems: 2,
    Browser: 2,
    Region: 1,
    TrafficType: 2,
    VisitorType: "New_Visitor",
    Weekend: false
  },
  {
    Administrative: 0,
    Administrative_Duration: 0.0,
    Informational: 0,
    Informational_Duration: 0.0,
    ProductRelated: 3,
    ProductRelated_Duration: 45.0,
    BounceRates: 0.12,
    ExitRates: 0.15,
    PageValues: 0.0,
    SpecialDay: 0.0,
    Month: "Jul",
    OperatingSystems: 3,
    Browser: 2,
    Region: 2,
    TrafficType: 3,
    VisitorType: "Returning_Visitor",
    Weekend: false
  },
  {
    Administrative: 6,
    Administrative_Duration: 220.0,
    Informational: 2,
    Informational_Duration: 90.0,
    ProductRelated: 52,
    ProductRelated_Duration: 1890.0,
    BounceRates: 0.002,
    ExitRates: 0.008,
    PageValues: 62.4,
    SpecialDay: 0.0,
    Month: "Nov",
    OperatingSystems: 2,
    Browser: 2,
    Region: 1,
    TrafficType: 2,
    VisitorType: "Returning_Visitor",
    Weekend: true
  }
];

const CSV_TEMPLATE_HEADERS = [
  "Administrative",
  "Administrative_Duration",
  "Informational",
  "Informational_Duration",
  "ProductRelated",
  "ProductRelated_Duration",
  "BounceRates",
  "ExitRates",
  "PageValues",
  "SpecialDay",
  "Month",
  "OperatingSystems",
  "Browser",
  "Region",
  "TrafficType",
  "VisitorType",
  "Weekend"
];

// Split single CSV line respecting quotes
function splitCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// Parse CSV text into array of validated session objects
function parseCSV(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) {
    throw new Error('CSV file must contain a header row and at least one data row.');
  }

  const rawHeaders = splitCsvLine(lines[0]).map(h => h.trim());
  const headerMap = {};
  rawHeaders.forEach((h, idx) => {
    const norm = h.toLowerCase().replace(/[^a-z0-9]/g, '');
    headerMap[norm] = idx;
  });

  const getCol = (rowArr, ...candidates) => {
    for (const c of candidates) {
      const norm = c.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (norm in headerMap) {
        const val = rowArr[headerMap[norm]];
        if (val !== undefined && val !== null) return val.trim();
      }
    }
    return undefined;
  };

  const sessions = [];
  const monthMap = {
    'january': 'Jan', 'february': 'Feb', 'march': 'Mar', 'april': 'Apr',
    'may': 'May', 'june': 'June', 'jun': 'June', 'july': 'Jul',
    'august': 'Aug', 'september': 'Sep', 'october': 'Oct',
    'november': 'Nov', 'december': 'Dec',
    'jan': 'Jan', 'feb': 'Feb', 'mar': 'Mar', 'apr': 'Apr',
    'jul': 'Jul', 'aug': 'Aug', 'sep': 'Sep', 'oct': 'Oct',
    'nov': 'Nov', 'dec': 'Dec'
  };

  for (let i = 1; i < lines.length; i++) {
    const row = splitCsvLine(lines[i]);
    if (row.length === 0 || (row.length === 1 && !row[0])) continue;

    const weekendRaw = (getCol(row, 'Weekend') || 'false').toLowerCase();
    const weekendVal = weekendRaw === 'true' || weekendRaw === '1' || weekendRaw === 'yes';

    const monthRaw = (getCol(row, 'Month') || 'Nov').toLowerCase();
    const monthVal = monthMap[monthRaw] || 'Nov';

    let visitorStr = getCol(row, 'VisitorType') || 'Returning_Visitor';
    if (visitorStr.toLowerCase().includes('returning')) visitorStr = 'Returning_Visitor';
    else if (visitorStr.toLowerCase().includes('new')) visitorStr = 'New_Visitor';
    else visitorStr = 'Other';

    const session = {
      Administrative: parseInt(getCol(row, 'Administrative') || '0', 10) || 0,
      Administrative_Duration: parseFloat(getCol(row, 'Administrative_Duration') || '0') || 0.0,
      Informational: parseInt(getCol(row, 'Informational') || '0', 10) || 0,
      Informational_Duration: parseFloat(getCol(row, 'Informational_Duration') || '0') || 0.0,
      ProductRelated: parseInt(getCol(row, 'ProductRelated') || '0', 10) || 0,
      ProductRelated_Duration: parseFloat(getCol(row, 'ProductRelated_Duration') || '0') || 0.0,
      BounceRates: Math.min(Math.max(parseFloat(getCol(row, 'BounceRates') || '0') || 0.0, 0.0), 1.0),
      ExitRates: Math.min(Math.max(parseFloat(getCol(row, 'ExitRates') || '0') || 0.0, 0.0), 1.0),
      PageValues: Math.max(parseFloat(getCol(row, 'PageValues') || '0') || 0.0, 0.0),
      SpecialDay: Math.min(Math.max(parseFloat(getCol(row, 'SpecialDay') || '0') || 0.0, 0.0), 1.0),
      Month: monthVal,
      OperatingSystems: Math.max(parseInt(getCol(row, 'OperatingSystems') || '1', 10) || 1, 1),
      Browser: Math.max(parseInt(getCol(row, 'Browser') || '1', 10) || 1, 1),
      Region: Math.max(parseInt(getCol(row, 'Region') || '1', 10) || 1, 1),
      TrafficType: Math.max(parseInt(getCol(row, 'TrafficType') || '1', 10) || 1, 1),
      VisitorType: visitorStr,
      Weekend: weekendVal,
    };
    sessions.push(session);
  }

  return sessions;
}

// Clear / Show Batch Errors
function clearBatchError() {
  if (batchErrorAlert) {
    batchErrorAlert.style.display = 'none';
    batchErrorAlert.textContent = '';
  }
}

function showBatchError(msg) {
  if (batchErrorAlert) {
    batchErrorAlert.style.display = 'block';
    batchErrorAlert.textContent = msg;
  }
}

// Set loaded batch dataset into buffer
function setBatchData(sessions, sourceName) {
  if (!sessions || sessions.length === 0) {
    showBatchError('Dataset contained no valid shopper sessions.');
    return;
  }
  currentBatchSessions = sessions;
  batchFileName.textContent = sourceName;
  batchRecordCount.textContent = `${sessions.length} sessions ready`;
  batchFileStatus.style.display = 'inline-flex';
  btnRunBatchText.textContent = `Run Batch Prediction (${sessions.length} Sessions)`;
  clearBatchError();

  if (batchJsonArea) {
    batchJsonArea.value = JSON.stringify(sessions, null, 2);
  }
}

// Clear all batch data
function clearBatch() {
  currentBatchSessions = [];
  currentBatchResults = null;
  if (batchFileInput) batchFileInput.value = '';
  if (batchFileStatus) batchFileStatus.style.display = 'none';
  if (btnRunBatchText) btnRunBatchText.textContent = 'Run Batch Prediction';
  if (batchJsonArea) batchJsonArea.value = '';
  clearBatchError();
  if (batchPlaceholder) batchPlaceholder.style.display = 'block';
  if (batchResultsContent) batchResultsContent.style.display = 'none';
  if (batchTableBody) batchTableBody.innerHTML = '';
}

// File Reading Handler
function handleBatchFile(file) {
  if (!file) return;
  clearBatchError();
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const content = e.target.result;
      let sessions = [];
      if (file.name.toLowerCase().endsWith('.json')) {
        const parsed = JSON.parse(content);
        sessions = Array.isArray(parsed) ? parsed : (parsed.sessions || []);
      } else {
        sessions = parseCSV(content);
      }
      setBatchData(sessions, file.name);
    } catch (err) {
      showBatchError(`Error parsing file "${file.name}": ${err.message}`);
    }
  };

  reader.onerror = () => {
    showBatchError(`Failed to read file "${file.name}".`);
  };

  reader.readAsText(file);
}

// Drag & Drop Listeners
if (dropZone) {
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length > 0) {
      handleBatchFile(dt.files[0]);
    }
  });

  dropZone.addEventListener('click', (e) => {
    if (e.target !== btnRemoveBatchFile && !e.target.closest('#batchFileStatus')) {
      batchFileInput.click();
    }
  });
}

if (btnBrowseFile) {
  btnBrowseFile.addEventListener('click', (e) => {
    e.stopPropagation();
    batchFileInput.click();
  });
}

if (batchFileInput) {
  batchFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleBatchFile(e.target.files[0]);
    }
  });
}

if (btnRemoveBatchFile) {
  btnRemoveBatchFile.addEventListener('click', (e) => {
    e.stopPropagation();
    clearBatch();
  });
}

// Preset Quick Actions
if (btnLoadSampleBatch) {
  btnLoadSampleBatch.addEventListener('click', () => {
    setBatchData(SAMPLE_BATCH_DATA, 'sample_shopper_batch_10.csv');
  });
}

if (btnClearBatch) {
  btnClearBatch.addEventListener('click', clearBatch);
}

// Download CSV Template
if (btnDownloadTemplate) {
  btnDownloadTemplate.addEventListener('click', () => {
    const sampleRows = [
      "3,120.0,1,45.0,25,950.0,0.005,0.015,35.5,0.0,Nov,2,2,1,2,Returning_Visitor,FALSE",
      "0,0.0,0,0.0,2,25.0,0.20,0.20,0.0,0.0,Feb,1,1,1,1,Returning_Visitor,FALSE",
      "2,60.0,0,0.0,18,480.0,0.01,0.02,18.0,0.0,Dec,2,2,3,2,Returning_Visitor,TRUE"
    ];
    const csvContent = [CSV_TEMPLATE_HEADERS.join(','), ...sampleRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shopper_sessions_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

// Direct JSON Input Toggle
if (btnToggleDirectJson) {
  btnToggleDirectJson.addEventListener('click', () => {
    const isHidden = directJsonContainer.style.display === 'none';
    directJsonContainer.style.display = isHidden ? 'block' : 'none';
    directJsonLabel.textContent = isHidden
      ? 'Hide raw JSON payload ▴'
      : 'Or enter / paste raw JSON payload directly ▾';
  });
}

if (btnApplyJson) {
  btnApplyJson.addEventListener('click', () => {
    clearBatchError();
    try {
      const text = batchJsonArea.value.trim();
      if (!text) {
        showBatchError('JSON input is empty.');
        return;
      }
      const parsed = JSON.parse(text);
      const sessions = Array.isArray(parsed) ? parsed : (parsed.sessions || []);
      setBatchData(sessions, 'direct_json_payload.json');
    } catch (err) {
      showBatchError(`Invalid JSON format: ${err.message}`);
    }
  });
}

// Run Batch Prediction Execution
if (btnRunBatch) {
  btnRunBatch.addEventListener('click', async () => {
    clearBatchError();
    if (!currentBatchSessions || currentBatchSessions.length === 0) {
      showBatchError('Please upload a CSV dataset, load the sample batch, or enter JSON sessions first.');
      return;
    }

    btnRunBatch.disabled = true;
    btnBatchSpinner.style.display = 'inline-block';

    try {
      const response = await fetch(`${API_BASE_URL}/predict/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessions: currentBatchSessions }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const detail = errData.detail || 'Server encountered an error running batch prediction.';
        throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
      }

      const data = await response.json();
      currentBatchResults = data;
      renderBatchDashboard(data);

    } catch (err) {
      showBatchError(`Batch prediction failed: ${err.message}. Ensure backend is online.`);
    } finally {
      btnRunBatch.disabled = false;
      btnBatchSpinner.style.display = 'none';
    }
  });
}

// Render Batch Dashboard
function renderBatchDashboard(data) {
  batchPlaceholder.style.display = 'none';
  batchResultsContent.style.display = 'block';

  const total = data.total_sessions;
  const purchases = data.predicted_purchases;
  const nonPurchases = total - purchases;
  const convRate = total > 0 ? ((purchases / total) * 100).toFixed(1) : '0.0';

  const probs = data.predictions.map(p => p.purchase_probability);
  const avgProb = total > 0 ? (probs.reduce((a, b) => a + b, 0) / total * 100).toFixed(1) : '0.0';
  const highIntentCount = data.predictions.filter(p => p.intent_level.includes('High')).length;

  kpiTotalSessions.textContent = total;
  kpiPurchases.textContent = purchases;
  kpiConversionRate.textContent = `${convRate}% Conv`;
  kpiNonPurchases.textContent = nonPurchases;
  kpiAvgProb.textContent = `${avgProb}%`;
  kpiHighIntent.textContent = highIntentCount;

  renderBatchTable();
  batchDebugJson.textContent = JSON.stringify(data, null, 2);
}

// Render and Filter Batch Table
function renderBatchTable() {
  if (!currentBatchResults || !currentBatchResults.predictions) return;

  const outcomeVal = filterOutcome.value;
  const intentVal = filterIntent.value;
  const query = (batchSearchInput.value || '').toLowerCase().trim();

  const allItems = currentBatchResults.predictions.map((pred, idx) => ({
    pred,
    idx,
    session: currentBatchSessions[idx] || {},
  }));

  const filtered = allItems.filter(item => {
    const isPurchase = item.pred.prediction_class === 1;
    if (outcomeVal === 'purchase' && !isPurchase) return false;
    if (outcomeVal === 'nopurchase' && isPurchase) return false;

    if (intentVal === 'high' && !item.pred.intent_level.includes('High')) return false;
    if (intentVal === 'moderate' && !item.pred.intent_level.includes('Moderate')) return false;
    if (intentVal === 'low' && !item.pred.intent_level.includes('Low')) return false;

    if (query) {
      const matchText = `${item.session.Month || ''} ${item.session.VisitorType || ''} ${item.pred.intent_level} ${item.pred.recommendation} ${item.pred.prediction}`.toLowerCase();
      if (!matchText.includes(query)) return false;
    }
    return true;
  });

  batchTableBody.innerHTML = '';
  filtered.forEach(item => {
    const tr = document.createElement('tr');
    const isPurchase = item.pred.prediction_class === 1;
    const probPct = (item.pred.purchase_probability * 100).toFixed(1);

    let intentClass = 'low';
    if (item.pred.intent_level.includes('High')) intentClass = 'high';
    else if (item.pred.intent_level.includes('Moderate')) intentClass = 'moderate';

    const totalPages = item.pred.session_summary ? item.pred.session_summary.TotalPages : (item.session.ProductRelated || 0);
    const duration = item.pred.session_summary ? `${item.pred.session_summary.TotalDuration.toFixed(0)}s` : '-';
    const pageValStr = item.session.PageValues !== undefined ? Number(item.session.PageValues).toFixed(1) : '-';
    const bounceStr = item.session.BounceRates !== undefined ? (Number(item.session.BounceRates) * 100).toFixed(1) + '%' : '-';

    tr.innerHTML = `
      <td><strong>#${item.idx + 1}</strong></td>
      <td>
        <span class="badge-outcome ${isPurchase ? 'purchase' : 'nopurchase'}">
          ${isPurchase ? '✓ Purchase' : '✕ No Purchase'}
        </span>
      </td>
      <td>
        <div class="table-prob-cell">
          <span class="table-prob-val">${probPct}%</span>
          <div class="table-prob-track">
            <div class="table-prob-bar" style="width: ${Math.min(Math.max(probPct, 3), 100)}%;"></div>
          </div>
        </div>
      </td>
      <td><span class="intent-pill ${intentClass}">${item.pred.intent_level}</span></td>
      <td><strong>${pageValStr}</strong></td>
      <td>${bounceStr}</td>
      <td>${item.session.Month || '-'}</td>
      <td>${item.session.VisitorType || '-'}</td>
      <td><span style="font-size: 11.5px; color: #6b7a8e;">${totalPages} pgs • ${duration}</span></td>
      <td class="rec-cell">${item.pred.recommendation}</td>
    `;
    batchTableBody.appendChild(tr);
  });

  batchCountInfo.textContent = `Showing ${filtered.length} of ${allItems.length} sessions`;
}

// Table Filter Event Listeners
if (filterOutcome) filterOutcome.addEventListener('change', renderBatchTable);
if (filterIntent) filterIntent.addEventListener('change', renderBatchTable);
if (batchSearchInput) batchSearchInput.addEventListener('input', renderBatchTable);

// Toggle Batch Raw JSON
if (btnToggleBatchDebug) {
  btnToggleBatchDebug.addEventListener('click', () => {
    const isHidden = batchDebugJson.style.display === 'none';
    batchDebugJson.style.display = isHidden ? 'block' : 'none';
    btnToggleBatchDebug.textContent = isHidden ? 'Hide Raw API Batch JSON ▴' : 'Show Raw API Batch JSON ▾';
  });
}

// Export Batch Results to CSV
if (btnExportBatchCsv) {
  btnExportBatchCsv.addEventListener('click', () => {
    if (!currentBatchResults || !currentBatchResults.predictions || currentBatchResults.predictions.length === 0) {
      showBatchError('No batch predictions available to export.');
      return;
    }

    const exportHeaders = [
      "Session_Index",
      "Prediction",
      "Prediction_Class",
      "Purchase_Probability",
      "Confidence_Percentage",
      "Intent_Level",
      "Recommendation",
      "TotalPages",
      "TotalDuration",
      "AvgTimePerPage",
      "Administrative",
      "Administrative_Duration",
      "Informational",
      "Informational_Duration",
      "ProductRelated",
      "ProductRelated_Duration",
      "BounceRates",
      "ExitRates",
      "PageValues",
      "SpecialDay",
      "Month",
      "OperatingSystems",
      "Browser",
      "Region",
      "TrafficType",
      "VisitorType",
      "Weekend"
    ];

    const escapeCsv = (val) => {
      const str = String(val === undefined || val === null ? '' : val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };

    const rows = currentBatchResults.predictions.map((p, idx) => {
      const s = currentBatchSessions[idx] || {};
      const summary = p.session_summary || {};

      return [
        idx + 1,
        escapeCsv(p.prediction),
        p.prediction_class,
        p.purchase_probability,
        escapeCsv(p.confidence_percentage),
        escapeCsv(p.intent_level),
        escapeCsv(p.recommendation),
        summary.TotalPages !== undefined ? summary.TotalPages : '',
        summary.TotalDuration !== undefined ? summary.TotalDuration : '',
        summary.AvgTimePerPage !== undefined ? summary.AvgTimePerPage : '',
        s.Administrative !== undefined ? s.Administrative : '',
        s.Administrative_Duration !== undefined ? s.Administrative_Duration : '',
        s.Informational !== undefined ? s.Informational : '',
        s.Informational_Duration !== undefined ? s.Informational_Duration : '',
        s.ProductRelated !== undefined ? s.ProductRelated : '',
        s.ProductRelated_Duration !== undefined ? s.ProductRelated_Duration : '',
        s.BounceRates !== undefined ? s.BounceRates : '',
        s.ExitRates !== undefined ? s.ExitRates : '',
        s.PageValues !== undefined ? s.PageValues : '',
        s.SpecialDay !== undefined ? s.SpecialDay : '',
        escapeCsv(s.Month),
        s.OperatingSystems !== undefined ? s.OperatingSystems : '',
        s.Browser !== undefined ? s.Browser : '',
        s.Region !== undefined ? s.Region : '',
        s.TrafficType !== undefined ? s.TrafficType : '',
        escapeCsv(s.VisitorType),
        s.Weekend !== undefined ? s.Weekend : ''
      ].join(',');
    });

    const csvContent = [exportHeaders.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch_predictions_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

