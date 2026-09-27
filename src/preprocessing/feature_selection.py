import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.inspection import permutation_importance
from sklearn.model_selection import StratifiedKFold, cross_validate


def correlation_pairs(X, threshold=0.80, columns=None):
    """Return numeric feature pairs whose absolute correlation is high."""
    numeric = X.select_dtypes(include=np.number)
    if columns is not None:
        numeric = numeric.loc[:, list(columns)]

    correlation = numeric.corr().abs()
    pairs = []
    for first_index, first_column in enumerate(correlation.columns):
        for second_column in correlation.columns[first_index + 1:]:
            value = correlation.loc[first_column, second_column]
            if value >= threshold:
                pairs.append(
                    {
                        "feature_a": first_column,
                        "feature_b": second_column,
                        "correlation": numeric[first_column].corr(numeric[second_column]),
                        "absolute_correlation": value,
                    }
                )

    return pd.DataFrame(
        pairs,
        columns=["feature_a", "feature_b", "correlation", "absolute_correlation"],
    ).sort_values("absolute_correlation", ascending=False, ignore_index=True)


def cross_validated_permutation_importance(
    estimator,
    X,
    y,
    scoring="f1",
    cv=None,
    n_repeats=10,
    random_state=42,
):
    """Rank features by permutation importance on held-out CV folds."""
    splitter = cv or StratifiedKFold(n_splits=5, shuffle=True, random_state=random_state)
    importances = []
    feature_names = list(X.columns) if hasattr(X, "columns") else list(range(X.shape[1]))

    for train_indices, validation_indices in splitter.split(X, y):
        model = clone(estimator)
        X_fold_train = X.iloc[train_indices] if hasattr(X, "iloc") else X[train_indices]
        X_fold_validation = X.iloc[validation_indices] if hasattr(X, "iloc") else X[validation_indices]
        y_fold_train = y.iloc[train_indices] if hasattr(y, "iloc") else y[train_indices]
        y_fold_validation = y.iloc[validation_indices] if hasattr(y, "iloc") else y[validation_indices]

        model.fit(X_fold_train, y_fold_train)
        result = permutation_importance(
            model,
            X_fold_validation,
            y_fold_validation,
            scoring=scoring,
            n_repeats=n_repeats,
            random_state=random_state,
        )
        importances.append(result.importances_mean)

    return pd.DataFrame(
        {
            "feature": feature_names,
            "importance_mean": np.mean(importances, axis=0),
            "importance_std": np.std(importances, axis=0),
        }
    ).sort_values("importance_mean", ascending=False, ignore_index=True)


def compare_feature_drop(estimator, X, y, feature, scoring="f1", cv=None):
    """Compare the full feature set with one candidate removed using CV."""
    if feature not in X.columns:
        raise KeyError(f"Feature not found: {feature}")

    splitter = cv or StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    rows = []
    for name, features in (("keep", X.columns), ("drop", X.columns.drop(feature))):
        scores = cross_validate(
            estimator,
            X.loc[:, features],
            y,
            scoring=scoring,
            cv=splitter,
            return_train_score=False,
        )["test_score"]
        rows.append(
            {
                "feature_set": name,
                "mean_score": scores.mean(),
                "std_score": scores.std(),
            }
        )

    return pd.DataFrame(rows)