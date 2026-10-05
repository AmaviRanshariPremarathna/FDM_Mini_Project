import numpy as np
import pandas as pd
from scipy import stats
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


def categorical_chi2_screening(X, y, categorical_columns=None, alpha=0.05):
    """
    Screen categorical features against a binary target using the Chi-Square
    test of independence (connecting Member 3 EDA findings to feature selection).
    """
    if categorical_columns is None:
        categorical_columns = X.select_dtypes(exclude=np.number).columns.tolist()

    results = []
    for col in categorical_columns:
        if col not in X.columns:
            raise KeyError(f"Categorical feature not found: {col}")
        contingency = pd.crosstab(X[col], y)
        chi2, p_val, dof, _ = stats.chi2_contingency(contingency)
        results.append(
            {
                "feature": col,
                "chi2": float(chi2),
                "p_value": float(p_val),
                "dof": int(dof),
                "significant": bool(p_val < alpha),
            }
        )

    return pd.DataFrame(results).sort_values("chi2", ascending=False, ignore_index=True)


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
    splitter = StratifiedKFold(n_splits=cv, shuffle=True, random_state=random_state) if isinstance(cv, int) else (cv if cv is not None else StratifiedKFold(n_splits=5, shuffle=True, random_state=random_state))
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


def compare_feature_drop(estimator, X, y, feature, scoring="f1", cv=None, drop_name="drop"):
    """
    Compare the full feature set with one or more candidate features removed using CV.
    `feature` can be a single column string or an iterable of column strings.
    """
    if isinstance(feature, str):
        drop_cols = [feature]
    else:
        drop_cols = list(feature)

    missing = [f for f in drop_cols if f not in X.columns]
    if missing:
        raise KeyError(f"Feature(s) not found: {missing}")

    splitter = cv or StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    remaining_features = X.columns.drop(drop_cols)

    rows = []
    for name, features in (("keep", X.columns), (drop_name, remaining_features)):
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


def select_features_by_importance(importance_df, threshold=0.0):
    """Return features with importance strictly greater than the given threshold."""
    return importance_df.loc[importance_df["importance_mean"] > threshold, "feature"].tolist()


def sequential_backward_selection(
    estimator,
    X,
    y,
    min_features=10,
    scoring="f1",
    cv=None,
    verbose=False,
):
    """
    Greedy sequential backward elimination (SBS).
    Iteratively removes the feature whose removal produces the highest CV score,
    stopping when removing any feature degrades performance or when min_features is reached.
    """
    splitter = cv or StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    current_features = list(X.columns)

    # Initial baseline score
    initial_scores = cross_validate(
        estimator, X.loc[:, current_features], y, scoring=scoring, cv=splitter
    )["test_score"]
    best_score = float(initial_scores.mean())
    history = [{"step": 0, "dropped": None, "score": best_score, "n_features": len(current_features)}]

    while len(current_features) > min_features:
        worst_feature = None
        best_candidate_score = -np.inf

        for candidate in current_features:
            trial_features = [f for f in current_features if f != candidate]
            scores = cross_validate(
                estimator, X.loc[:, trial_features], y, scoring=scoring, cv=splitter
            )["test_score"]
            mean_trial_score = float(scores.mean())

            if mean_trial_score > best_candidate_score:
                best_candidate_score = mean_trial_score
                worst_feature = candidate

        # If dropping improves or matches the score (tolerance of 1e-4)
        if best_candidate_score >= best_score - 1e-4:
            current_features.remove(worst_feature)
            best_score = best_candidate_score
            history.append({
                "step": len(history),
                "dropped": worst_feature,
                "score": best_score,
                "n_features": len(current_features),
            })
            if verbose:
                print(f"Dropped: {worst_feature} | New Score ({scoring}): {best_score:.4f}")
        else:
            break

    return current_features, pd.DataFrame(history)


def filter_low_variance_features(X, threshold=0.0):
    """Return columns with variance strictly greater than threshold (numeric only)."""
    numeric = X.select_dtypes(include=np.number)
    variances = numeric.var()
    retained_numeric = variances[variances > threshold].index.tolist()
    non_numeric = [col for col in X.columns if col not in numeric.columns]
    return retained_numeric + non_numeric