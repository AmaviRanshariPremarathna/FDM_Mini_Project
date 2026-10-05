# Stage 10: Frontend Development and User Experience

Interactive web frontend for the **Online Shopper Purchasing Intention Predictor**, integrated with the FastAPI backend and the champion **Random Forest** classification ensemble.

---

## 1. User Experience & Design Features

### Clear, Grouped Input Fields & Instructions
The form groups the 18 session attributes into 3 logical, intuitive sections:
1. **Page Browsing Activity:** Page visit counts and durations for Administrative, Informational, and Product pages.
2. **Behavioral & Intent Signals:** Bounce rate, exit rate, and highlighted **PageValues** input with helpful tooltips.
3. **Date, Context & Visitor Profile:** Month selector, visitor type, weekend indicator, special day closeness, and technical channel IDs.

### 1-Click Quick Scenario Presets
To facilitate effortless testing and demonstration without typing 18 numbers manually, four preset buttons are provided:
- **🔥 High-Intent Buyer:** Simulates an active holiday shopper in November with high PageValues ($35.5$), 25 product views, low bounce rate ($0.5\%$), and long session duration. Predicts **Purchase** ($>80\%$ probability).
- **👀 Casual Window Shopper:** Simulates a fleeting February browser with 2 product views, $0$ PageValues, and a high bounce rate ($20\%$). Predicts **No Purchase** ($<15\%$ probability).
- **⚡ Returning Weekend Shopper:** Simulates a returning visitor on a December weekend with moderate page values and steady engagement.
- **↺ Reset:** Clears the form to default state.

### Real-Time Validation
- **Client-Side Validation:** Enforces non-negative values for durations and page counts, and bounds probability rates (`BounceRates`, `ExitRates`) strictly between $0.0$ and $1.0$.
- **Backend Sync:** If malformed data is submitted, structured error details are highlighted in a red alert banner.

### Clear & Actionable Prediction Dashboard
When a prediction is returned, the results card displays:
1. **Prominent Outcome Banner:** Large, color-coded visual indicator: **✓ Likely to Purchase** (Green) or **✕ Unlikely to Purchase** (Slate).
2. **Intent Level Pill:** Categorizes traffic into **High Intent**, **Moderate Intent**, or **Low Intent**.
3. **Animated Probability Gauge:** Displays exact conversion probability (e.g., $84.2\%$) with an animated progress meter.
4. **E-Commerce Marketing Recommendation:** Context-aware tactical guidance (e.g. *Display a limited-time checkout offer or free shipping voucher to close the sale*).
5. **Engineered Feature Breakdown:** Displays dynamically derived metrics calculated by the feature engineering pipeline (`TotalPages`, `TotalDuration`, `AvgTimePerPage`, `VisitorType_Weekend`).
6. **Technical Debug Inspector:** Toggleable raw JSON inspector displaying the full API response.

### Live Connection Indicator
The header includes a real-time status pill that automatically queries `GET /health` to confirm the backend is online and the model is loaded.

---

## 2. End-to-End System Execution

### Option A: Unified Full-Stack Run (Recommended)
Because the FastAPI backend mounts the `frontend/` directory, a single command serves both the REST API and the web frontend on the exact same port:

```bash
uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

1. Open your browser and navigate to: **[http://localhost:8000](http://localhost:8000)**
2. The complete web dashboard will load immediately.
3. Test predictions using the form or quick scenario presets.

### Option B: Standalone Frontend
You can also open `frontend/index.html` directly in any web browser (`file:///.../frontend/index.html`) or via VS Code Live Server / static web server. 
The JavaScript client automatically detects whether it is running standalone and communicates with the FastAPI service running at `http://localhost:8000` via CORS.

---

## 3. Technology Stack

- **HTML5:** Semantic, accessible layout.
- **CSS3:** Custom responsive layout, CSS variables, card shadows, animations, and clean typography (`Plus Jakarta Sans`).
- **Modern JavaScript (ES6+):** Async `fetch` API, DOM manipulation, client-side validation, and dynamic state management (zero external JS dependencies).
