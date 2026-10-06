# Jupyter Notebooks Directory

This directory contains the exploratory data analysis, preprocessing, feature engineering/selection experiments, and model training notebooks developed across all four team members.

---

## Notebook Index & Workflow Progression

| # | Notebook | Author / Lead | Focus Area & Description |
|:---:|:---|:---|:---|
| **0** | `EDA_Full_Notebook.ipynb` | All Members | Unified comprehensive exploratory data analysis, class imbalance examination, correlation heatmaps, feature distribution plots, and outlier diagnosis. |
| **1** | `Member4_Validation_Split.ipynb` | Member 4 | Deduplication (identifying & removing 125 duplicate rows) and construction of the leak-free, stratified 80/20 train/test holdout split (`random_state=42`). |
| **2** | `Member1_FeatureEngineering.ipynb` | Member 1 | Derivation and validation of engineered behavioral signals: `TotalPages`, `TotalDuration`, `AvgTimePerPage`, `VisitorType_Weekend`, and right-skewness log transformations. |
| **3** | `Member2_EncodingScaling.ipynb` | Member 2 | Implementation and benchmarking of `ColumnTransformer` with `OneHotEncoder` and scaling variants (`StandardScaler`, `RobustScaler`, `MinMaxScaler`). |
| **4** | `Member4_Imbalance_PageValues.ipynb` | Member 4 | Detailed investigation of zero-inflated `PageValues`, class imbalance dynamics (15.6% positive rate), and cost-sensitive class weighting strategies. |
| **5** | `Member3_FeatureSelection.ipynb` | Member 3 | Statistical screening via Chi-square tests of independence, collinearity pruning, permutation importance, and Sequential Backward Selection (SBS). |
| **6** | `Member1_LogisticRegression.ipynb` | Member 1 | Logistic Regression baseline modeling, regularization tuning (L1/L2 penalty, C parameter sweeps), and convergence diagnostics. |
| **7** | `Member2_GaussianNB.ipynb` | Member 2 | Gaussian Naive Bayes modeling, exploring variance smoothing (`var_smoothing`), prior probabilities, and feature subset sensitivity. |
| **8** | `Member3_RandomForest.ipynb` | Member 3 | Random Forest ensemble development, tree depth / min samples tuning, class weighting calibration, out-of-fold cross-validation, and candidate artifact export. |
| **9** | `Member4_GradientBoosting.ipynb` | Member 4 | Gradient Boosting Machine (GBM) development, learning rate / n_estimators tuning, subsampling, and validation comparisons. |

---

## Execution Instructions

All notebooks are pre-executed with cells displaying their respective figures, metrics, and logs. To re-run any notebook:

1. Activate the project virtual environment:
   ```bash
   .\venv\Scripts\activate
   ```
2. Launch Jupyter Notebook or JupyterLab:
   ```bash
   jupyter lab
   # or
   jupyter notebook
   ```
3. Open and run the desired notebook sequentially from top to bottom.
