# Stage 8: Final Model Evaluation Report

## 1. Executive Summary

In **Stage 8**, the final champion model (**Random Forest Classifier**, tuned in Stage 7) was evaluated for the first and only time on the **completely unseen, held-out test dataset**. 

To maintain strict scientific integrity and avoid data leakage, the test dataset remained entirely untouched during feature selection, model architecture exploration, and hyperparameter tuning.

### Test Dataset Properties
- **Total Test Observations:** 2,441 browsing sessions (20% holdout split)
- **Class Breakdown:**
  - Non-Purchasers (`Revenue = 0`): 2,059 sessions (84.35%)
  - Purchasers (`Revenue = 1`): 382 sessions (15.65%)
- **Feature Space:** 18 selected and engineered features matching the exact training pipeline.

---

## 2. Generalization Analysis: 5-Fold Cross-Validation vs. Unseen Test Set

The table below contrasts the expected cross-validation performance obtained during development against the empirical performance achieved on the unseen test set:

| Evaluation Metric | 5-Fold CV (Training) | Final Test (Unseen) | Generalization Gap | Status / Integrity |
|:------------------|:--------------------:|:-------------------:|:------------------:|:------------------:|
| **Accuracy (%)**  |        90.20%        |       89.47%        |       -0.73%       |  High Consistency  |
| **F1-Score**      |        0.6895        |       0.6839        |      -0.0056       |  Near-Zero Gap     |
| **Precision (%)** |        64.40%        |       64.50%        |       +0.10%       |  Precision Gain    |
| **Recall (%)**    |        74.25%        |       72.77%        |       -1.48%       |  Target Retained   |
| **ROC-AUC**       |        0.9310        |       0.9289        |      -0.0021       |  Robust Ranking    |
| **PR-AUC**        |        0.7503        |       0.7372        |      -0.0131       |  Strong Precision  |

### Key Generalization Insights
1. **Near-Zero F1 Gap ($\Delta = -0.0056$):** The drop in F1-score between training cross-validation (0.6895) and the unseen test set (0.6839) is under **0.6%**, which is well within the cross-validation standard deviation ($\sigma = 0.016$).
2. **Zero Overfitting:** The close alignment across all 6 metrics proves that the Random Forest model generalized without memorizing training noise.
3. **Precision Stability:** Test precision remained virtually identical ($64.50\%$ vs. $64.40\%$), confirming that the calibrated class weighting ratio ($3.5:1$) prevents false alarms on unseen visitors.

---

## 3. Test Set Confusion Matrix & Error Breakdown

Evaluated on all 2,441 unseen test sessions:

| Actual Session Outcome | Predicted: No Purchase | Predicted: Purchase | Total Sessions | Observed Rate |
|:-----------------------|:----------------------:|:-------------------:|:--------------:|:-------------:|
| **Actual: No Purchase**|    1,906 (True Neg)    |   153 (False Pos)   |     2,059      | 92.57% Spec   |
| **Actual: Purchase**   |     104 (False Neg)    |   278 (True Pos)    |       382      | 72.77% Sens   |
| **Total Predicted**    |         2,010          |         431         |     2,441      | 89.47% Acc    |

### Detailed Operational Metrics
- **True Positive Rate (Recall / Sensitivity):** $\mathbf{72.77\%}$ — Successfully captured 278 out of 382 genuine purchasing sessions.
- **True Negative Rate (Specificity):** $\mathbf{92.57\%}$ — Correctly identified 1,906 out of 2,059 non-purchasing visitors without interruption.
- **Precision (Positive Predictive Value):** $\mathbf{64.50\%}$ — Out of 431 visitors flagged as potential buyers, 278 actually completed a transaction.
- **False Alarm Rate:** Only **$7.43\%$** ($153 / 2,059$), preventing wasteful marketing spend on casual window shoppers.

---

## 4. Full Classification Report (Unseen Test Data)

| Class | Class Meaning | Precision | Recall | F1-Score | Support |
|:------|:--------------|:---------:|:------:|:--------:|:-------:|
| **0** | No Purchase   |  0.9483   | 0.9257 |  0.9368  |  2,059  |
| **1** | Purchase      |  0.6450   | 0.7277 |  0.6839  |   382   |
| ---   | Macro Avg     |  0.7966   | 0.8267 |  0.8104  |  2,441  |
| ---   | Weighted Avg  |  0.9008   | 0.8947 |  0.8973  |  2,441  |

---

## 5. Final Conclusion for Stage 8

1. **Successful Test Validation:** The champion Random Forest model achieves **89.47% Accuracy** and **0.6839 F1-Score** on the unseen test set, demonstrating robust performance on imbalanced e-commerce data.
2. **Methodological Validity:** The negligible discrepancy between 5-fold cross-validation and the held-out test set validates the data split, feature engineering, and hyperparameter tuning methodology.
3. **Deployment Readiness:** The model is verified for real-world integration in the FastAPI backend service (Stage 9) and web frontend (Stage 10).
