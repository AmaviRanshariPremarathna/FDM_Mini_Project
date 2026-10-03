# Final Model Selection

## 1. Introduction

The objective of this stage is to select the final machine learning model for predicting online shoppers' purchasing intentions. Four classification algorithms were evaluated: Logistic Regression, Gaussian Naive Bayes, Random Forest, and Gradient Boosting.

The models were compared using cross-validation performance, including F1-score, precision, recall, ROC-AUC, and average precision.

## 2. Model Comparison

The following table summarizes the cross-validation results of the four candidate models.

| Model                       | Mean F1-score | Precision | Recall |   ROC-AUC |
| --------------------------- | ------------: | --------: | -----: | --------: |
| Logistic Regression (tuned) |         0.667 |     0.579 |  0.790 |     0.909 |
| Gaussian Naive Bayes        |         0.595 |     0.484 |  0.772 |     0.869 |
| Random Forest (tuned)       |     **0.684** |     0.633 |  0.746 | **0.927** |
| Gradient Boosting (tuned)   |         0.662 |     0.564 |  0.803 |     0.924 |

*Note: Values are mean cross-validation scores. Minor differences in evaluation procedures should be considered when comparing models.*

## 3. Selected Final Model

The Random Forest classifier with tuned hyperparameters and balanced class weights was selected as the final candidate model.

It achieved the highest mean F1-score (0.6844) among the four evaluated models. It also achieved a mean ROC-AUC of 0.9270, indicating strong discrimination between purchasing and non-purchasing visitors.

## 4. Justification for Model Selection

The Random Forest model was selected based on the following considerations:

* **F1-score:** It achieved the highest mean F1-score among the evaluated models, providing a useful balance between precision and recall.
* **ROC-AUC:** It achieved the highest mean ROC-AUC, indicating strong ability to distinguish between the two classes.
* **Recall:** Its mean recall of 0.7464 indicates that it identifies a substantial proportion of actual purchasing visitors.
* **Class imbalance:** Balanced class weights were used to account for the imbalance between purchasing and non-purchasing visitors.
* **Model comparison:** It achieved better F1-score performance than Logistic Regression, Gaussian Naive Bayes, and Gradient Boosting in the saved cross-validation results.

Although Gradient Boosting achieved higher recall, Random Forest provided a higher F1-score and ROC-AUC. Therefore, Random Forest was selected based on the combined evaluation criteria.

## 5. Final Conclusion

Based on the experimental results, the tuned Random Forest classifier with balanced class weights was selected as the final model candidate for the online shoppers' purchasing intention prediction task.

The model achieved a mean F1-score of 0.6844, a mean recall of 0.7464, and a mean ROC-AUC of 0.9270 during cross-validation.

The selection was based on the model's overall performance across the evaluation metrics rather than on a single metric. The selected model should subsequently be evaluated on the held-out test set to assess its generalization performance.
