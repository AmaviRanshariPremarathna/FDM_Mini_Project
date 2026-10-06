# Project Documentation

This directory contains in-depth documentation detailing the scientific methodology, model evaluation, and selection decisions for the FDM Mini Project.

---

## Documents

### 1. [FINAL_MODEL_SELECTION.md](FINAL_MODEL_SELECTION.md)
Comprehensive report detailing the candidate model comparison (Logistic Regression, Gaussian Naive Bayes, Random Forest, and Gradient Boosting) under 5-fold stratified cross-validation on the training set (9,764 sessions). Provides detailed justifications for choosing the **Random Forest Classifier** as the final project champion based on:
- Highest overall accuracy (90.20%)
- Highest F1-score (0.6895) and PR-AUC (0.7503) on the imbalanced minority class
- Balanced precision (64.40%) vs. recall (74.25%) trade-off
- Low false positive burden (only 627 out-of-fold training false alarms)

### 2. [STAGE_8_FINAL_TEST_REPORT.md](STAGE_8_FINAL_TEST_REPORT.md)
The empirical evaluation of the champion Random Forest model on the **2,441 unseen, isolated holdout test sessions**. Features:
- Comparison between 5-fold cross-validation and test set performance
- Generalization gap analysis demonstrating near-zero drop ($\Delta \text{F1} = -0.0056$)
- Detailed test confusion matrix (1,906 True Negatives, 278 True Positives, 153 False Positives, 104 False Negatives)
- Operational metrics (72.77% Sensitivity, 92.57% Specificity, 64.50% Precision)
- Verification that no data leakage occurred during model development
