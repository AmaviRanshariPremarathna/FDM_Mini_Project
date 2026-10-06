# Online Shoppers Purchasing Intention Prediction

[![Python 3.11](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-green.svg)](https://fastapi.tiangolo.com/)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-1.4+-orange.svg)](https://scikit-learn.org/)
[![Tests](https://img.shields.io/badge/pytest-18%20passed-brightgreen.svg)](tests/)

A comprehensive, end-to-end Machine Learning and Data Mining system for predicting e-commerce purchasing intention (`Revenue = True` vs. `False`) based on online browsing sessions. Developed for the **Foundations of Data Mining (FDM) Mini Project**.

---

## 1. Project Overview & Problem Statement

E-commerce conversion rates are typically low (under 16%), resulting in severe class imbalance. Predicting whether a session will culminate in a purchase in real-time allows merchants to:
- Dynamically intervene with incentives (discounts, free shipping) for **high-intent buyers**.
- Deploy soft engagement prompts (live chat, reviews) for **hesitant/moderate-intent shoppers**.
- Minimize site friction and avoid wasting marketing spend on **casual window shoppers**.

### Dataset Specifications
- **Source:** Online Shoppers Purchasing Intention Dataset (UCI Machine Learning Repository)
- **Total Raw Records:** 12,330 sessions across 18 initial features
- **Deduplication:** 125 duplicate records identified and removed
- **Total Clean Records:** 12,205 sessions
- **Class Distribution:** 10,297 non-purchases (84.37%) vs. 1,908 purchases (15.63%)
- **Data Splitting Protocol:** Strict 80/20 stratified split (`random_state=42`, `shuffle=True`)
  - **Training Set (80%):** 9,764 sessions (8,238 negative, 1,526 positive)
  - **Isolated Test Set (20%):** 2,441 sessions (2,059 negative, 382 positive) — held out untouched until final Stage 8 evaluation.

---

## 2. Team Member Responsibilities & Contributions

| Member | Assigned Preprocessing / EDA Role | Assigned ML Modeling Role | Key Deliverables |
|:---|:---|:---|:---|
| **Member 1** | **Feature Engineering** | **Logistic Regression** | Derived `TotalPages`, `TotalDuration`, `AvgTimePerPage`, `VisitorType_Weekend`, log transformations for right-skewed predictors; tuned L2 regularized Logistic Regression. |
| **Member 2** | **Encoding & Scaling** | **Gaussian Naive Bayes** | Designed production `ColumnTransformer` with `OneHotEncoder`, `StandardScaler`, `RobustScaler`, and `MinMaxScaler`; optimized `var_smoothing` with feature subsets. |
| **Member 3** | **Feature Selection** | **Random Forest Classifier** | Executed Chi-square tests, correlation analysis, permutation importance, and Sequential Backward Selection (SBS); tuned champion Random Forest ensemble. |
| **Member 4** | **Validation Split & Class Imbalance** | **Gradient Boosting Classifier** | Engineered stratified splitting pipeline, investigated zero-inflated `PageValues` distributions, balanced class weighting strategies, and optimized Gradient Boosting. |

---

## 3. End-to-End Machine Learning Pipeline

```
Raw Data (12,330 sessions)
  │
  ├── 1. Cleaning & Deduplication (125 duplicates removed -> 12,205 sessions)
  ├── 2. Stratified 80/20 Holdout Split (Isolated test set of 2,441 rows)
  │
  └── 3. Preprocessing & Feature Engineering
        ├── Numerical features: TotalPages, TotalDuration, AvgTimePerPage
        ├── Categorical interaction: VisitorType_Weekend
        ├── Feature Selection: 18 optimal predictors selected
        └── Pipeline: OneHotEncoder (handle_unknown='ignore') + StandardScaler
              │
              ├── Logistic Regression       (5-Fold CV F1: 0.6729 | Acc: 89.12%)
              ├── Gaussian Naive Bayes      (5-Fold CV F1: 0.6453 | Acc: 88.02%)
              ├── Gradient Boosting         (5-Fold CV F1: 0.6879 | Acc: 89.38%)
              └── Random Forest [CHAMPION]  (5-Fold CV F1: 0.6895 | Acc: 90.20%)
                    │
                    ├── 4. Final Evaluation on Unseen Test Set (Stage 8)
                    │     • Test Accuracy: 89.47%
                    │     • Test F1-Score: 0.6839
                    │     • Generalization Gap: -0.0056 (Near Zero)
                    │
                    ├── 5. Production REST API (FastAPI)
                    └── 6. Interactive Web Dashboard (HTML5/CSS3/Vanilla JS)
```

---

## 4. Model Comparison & Champion Selection

All four candidate models were evaluated on the training set using **5-fold Stratified Cross-Validation (`shuffle=True`, `random_state=42`)**:

| Model Architecture | Accuracy (%) | F1-Score | Precision (%) | Recall (%) | ROC-AUC | PR-AUC | Selection Status |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---|
| **Random Forest (Final)** | **90.20%** | **0.6895** | **64.40%** | **74.25%** | **0.9310** | **0.7503** | 🏆 **Champion Model** |
| **Gradient Boosting** | 89.38% | 0.6879 | 63.72% | 74.84% | 0.9326 | 0.7420 | Strong Candidate |
| **Logistic Regression** | 89.12% | 0.6729 | 63.55% | 71.62% | 0.9163 | 0.6860 | Linear Baseline |
| **Gaussian Naive Bayes** | 88.02% | 0.6453 | 60.13% | 69.79% | 0.8892 | 0.6120 | Probabilistic Baseline |

### Champion Model Specification
- **Algorithm:** `RandomForestClassifier` (Scikit-Learn Pipeline)
- **Hyperparameters:** `n_estimators=200`, `max_depth=20`, `min_samples_leaf=2`, `max_features=0.25`, `class_weight={0: 1.0, 1: 3.5}`
- **Artifact:** [`models/randomforest_candidate.joblib`](models/randomforest_candidate.joblib)

### Unseen Test Set Generalization (Stage 8)
Evaluated on the 2,441 unseen holdout sessions:
- **Test Accuracy:** **89.47%** (vs. 90.20% CV $\rightarrow \Delta = -0.73\%$)
- **Test F1-Score:** **0.6839** (vs. 0.6895 CV $\rightarrow \Delta = -0.0056$)
- **Test Precision:** **64.50%** (vs. 64.40% CV $\rightarrow \Delta = +0.10\%$)
- **Test Recall:** **72.77%** (vs. 74.25% CV $\rightarrow \Delta = -1.48\%$)
- **Test ROC-AUC:** **0.9289** (vs. 0.9310 CV $\rightarrow \Delta = -0.0021$)
- **Test Specificity:** **92.57%** (1,906 / 2,059 non-purchasers correctly filtered)

---

## 5. Repository Structure

```
FDM_Mini_Project/
├── backend/                         # Production FastAPI application
│   ├── app.py                       # REST API & static file server
│   ├── schemas.py                   # Pydantic input/output validation models
│   ├── test_app.py                  # Integration test suite for endpoints
│   ├── README.md                    # Backend documentation
│   └── requirements.txt             # Backend-specific dependencies
├── data/                            # Datasets
│   ├── raw/                         # Raw dataset (online_shoppers_intention.csv)
│   ├── processed/                   # Engineered, processed, and selected splits
│   ├── X_train.csv, y_train.csv     # Raw stratified training split (9,764 rows)
│   └── X_test.csv, y_test.csv       # Raw stratified holdout test split (2,441 rows)
├── docs/                            # Documentation
│   ├── FINAL_MODEL_SELECTION.md     # In-depth model selection & justification
│   ├── STAGE_8_FINAL_TEST_REPORT.md # Unseen test set evaluation report
│   └── README.md                    # Documentation index
├── frontend/                        # Web user interface
│   ├── index.html                   # Semantic HTML5 layout
│   ├── style.css                    # Responsive CSS styling & animations
│   ├── app.js                       # Client-side validation & API integration
│   └── README.md                    # Frontend documentation
├── models/                          # Serialized trained scikit-learn models
│   ├── randomforest_candidate.joblib
│   ├── gradientboosting_candidate.joblib
│   ├── logisticregression_candidate.joblib
│   ├── gaussiannb_candidate.joblib
│   └── encoding_scaling.joblib
├── notebooks/                       # Jupyter notebooks documenting all stages
│   ├── EDA_Full_Notebook.ipynb
│   ├── Member1_FeatureEngineering.ipynb
│   ├── Member1_LogisticRegression.ipynb
│   ├── Member2_EncodingScaling.ipynb
│   ├── Member2_GaussianNB.ipynb
│   ├── Member3_FeatureSelection.ipynb
│   ├── Member3_RandomForest.ipynb
│   ├── Member4_GradientBoosting.ipynb
│   ├── Member4_Imbalance_PageValues.ipynb
│   ├── Member4_Validation_Split.ipynb
│   └── README.md
├── results/                         # Evaluation artifacts, CSVs, and confusion matrices
│   ├── final_model_evaluation/      # Stage 8 unseen test evaluation results
│   ├── member1_logisticregression/  # Member 1 experiment results
│   ├── member2_gaussiannb/          # Member 2 experiment results
│   ├── member3_randomforest/        # Member 3 experiment results
│   └── member4_gradientboosting/    # Member 4 experiment results
├── scripts/                         # Standalone execution scripts
│   └── evaluate_final_model.py      # Stage 8 evaluation script
├── src/                             # Reusable core modules
│   └── preprocessing/
│       ├── encoding_scaling.py      # ColumnTransformer pipeline builder
│       ├── feature_engineering.py   # Automated feature derivations
│       └── feature_selection.py     # SBS, permutation, and chi-squared tools
├── tests/                           # Project test suite
│   ├── test_encoding_scaling.py     # Encoding & scaling tests
│   ├── test_feature_engineering.py  # Feature engineering unit tests
│   └── test_feature_selection.py    # Feature selection unit tests
├── pytest.ini                       # Pytest configuration
├── requirements.txt                 # Project-wide Python dependencies
└── README.md                        # Master project documentation
```

---

## 6. Getting Started & Installation

### Step 1: Clone the Repository
```bash
git clone https://github.com/AmaviRanshariPremarathna/FDM_Mini_Project.git
cd FDM_Mini_Project
```

### Step 2: Create and Activate Virtual Environment
```bash
# Windows (PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Required Dependencies
```bash
pip install -r requirements.txt
```

---

## 7. Running the Application & Tests

### 1. Launch the Full-Stack Web Application
Run the unified FastAPI server, which serves both the REST API and the frontend dashboard on port `8000`:
```bash
uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```
- **Web UI:** Open your browser at [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

### 2. Run the Automated Test Suite
Execute the 18 automated unit and integration tests across preprocessing, models, and API endpoints:
```bash
pytest -v
```

### 3. Run the Stage 8 Final Model Evaluation
Reproduce the final test set metrics and re-generate the artifacts in `results/final_model_evaluation/`:
```bash
python scripts/evaluate_final_model.py
```

---

## 8. License & Academic Integrity

This project is developed for academic purposes under the **Foundations of Data Mining (FDM)** curriculum. All model artifacts, experiment outputs, and source code are maintained with strict isolation to ensure reproducible, leak-free evaluations.
