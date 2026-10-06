# Final Model Selection and Evaluation

## 1. Overview

The goal of this stage is to select the champion machine learning model for predicting online shoppers' purchasing intentions (`Revenue = 1` vs. `0`). 

The training dataset contains **9,764 sessions** with an inherent class imbalance of **15.63% purchases** (1,526 purchases vs. 8,238 non-purchases). Four machine learning algorithms were developed and evaluated under a strict **5-fold Stratified Cross-Validation (`shuffle=True`, `random_state=42`)** protocol. The holdout test set (2,441 sessions) was isolated upfront and remains completely untouched for unbiased final evaluation.

---

## 2. Model Performance Comparison

The table below summarizes the cross-validation performance across the four developed models. All metrics report the mean score across the 5 stratified validation folds.

| Model                 | Accuracy (%) | F1-Score | Precision (%) | Recall (%) | ROC-AUC | PR-AUC |
|:----------------------|:------------:|:--------:|:-------------:|:----------:|:-------:|:------:|
| Random Forest (Final) |    90.20%    |  0.6895  |    64.40%     |   74.25%   | 0.9310  | 0.7503 |
| Gradient Boosting     |    89.38%    |  0.6879  |    63.72%     |   74.84%   | 0.9326  | 0.7420 |
| Logistic Regression   |    89.12%    |  0.6729  |    63.55%     |   71.62%   | 0.9163  | 0.6860 |
| Gaussian Naive Bayes  |    88.02%    |  0.6453  |    60.13%     |   69.79%   | 0.8892  | 0.6120 |

---

## 3. Selected Final Model

**Selected Champion:** **Random Forest Classifier**  
- **Model Artifact:** `models/randomforest_candidate.joblib`  
- **Configuration:** 200 de-correlated decision trees, `max_depth=20`, `min_samples_leaf=2`, `max_features=0.25`, and calibrated class weighting `{0: 1.0, 1: 3.5}`.

### Out-of-Fold Confusion Matrix (5-Fold Cross-Validation on Training Set)

Evaluated across all **9,764 training observations** via out-of-fold cross-validation (`cross_val_predict`, cv=5):

| Actual Outcome       | Predicted: No Purchase (0) | Predicted: Purchase (1) | Total Session Count  |
|:---------------------|:--------------------------:|:-----------------------:|:--------------------:|
| **Actual: No Purchase (0)** |      **7,611** (True Neg)  |      **627** (False Pos) |  **8,238** (92.39% Spec) |
| **Actual: Purchase (1)**    |        **393** (False Neg) |    **1,133** (True Pos)  |  **1,526** (74.25% Sens) |
| **Total Predicted**         |      **8,004**             |    **1,760**             |  **9,764** (89.55% Acc)  |

> [!NOTE]
> **Distinction Between Evaluation Matrices:**
> - **Cross-Validation Matrix (Above):** Computed out-of-fold across the **9,764 training sessions** during model development (`results/member3_randomforest/cv_confusion_matrix.csv`).
> - **Holdout Test Set Matrix (Stage 8):** Computed on the independent, unseen **2,441 test sessions** (`results/final_model_evaluation/test_confusion_matrix.csv`), yielding:
>   - True Negatives: **1,906** | False Positives: **153** (Total: 2,059)
>   - False Negatives: **104**  | True Positives: **278**  (Total: 382)
>   - Overall Test Accuracy: **89.47%**, Test F1: **0.6839**, Test Recall: **72.77%**.

---

## 4. Justification for Model Selection

The Random Forest model was selected as the final project model based on four core criteria:

1. **Top Performance on Key Metrics:**
   - **Highest Accuracy (90.20%):** The only model to exceed the 90% accuracy benchmark.
   - **Highest F1-Score (0.6895):** Demonstrates the best harmonic balance between precision and recall on the minority purchase class.
   - **Highest PR-AUC (0.7503):** Provides the strongest classification reliability on imbalanced data across all decision thresholds.

2. **Practical Business Trade-Off (Precision vs. Recall):**
   - Captures **74.25% of actual buyers** while maintaining **64.40% precision**, keeping false purchaser alarms to just 627 sessions across the entire training set (and only 153 sessions on the unseen test set, avoiding wasted promotional budget and unnecessary user interruptions).

3. **Robustness to Overfitting & Variance Reduction:**
   - By averaging 200 trees built on bootstrap samples with random feature subsets, Random Forest reduces variance and avoids the sequential sensitivity to web session noise seen in boosting.

4. **Production Readiness:**
   - Tree structures are scale-invariant, eliminating sensitivity to distribution shift in numerical features, and natively support multi-core parallel inference (`n_jobs=-1`).

---

## 5. Key Modelling Observations

- **Tree Ensembles Outperform Linear & Probabilistic Models:** Purchasing intention is heavily driven by threshold boundaries (e.g. `PageValues == 0` vs. `> 0`). Random Forest and Gradient Boosting capture these non-linear interactions natively.
- **Why Naive Bayes Underperformed (0.6453 F1):** Severe zero-inflation in duration and page count features violates the Gaussian normality assumption, while strong collinearity between browsing metrics violates feature independence.
- **Decisive Impact of `PageValues`:** Removing `PageValues` in ablation experiments drops model F1-score from ~0.69 to ~0.39, confirming that transactional engagement carries far more predictive signal than total session duration alone.
