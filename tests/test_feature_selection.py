import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold

from src.preprocessing.feature_selection import (
    categorical_chi2_screening,
    compare_feature_drop,
    correlation_pairs,
    cross_validated_permutation_importance,
    select_features_by_importance,
)


def test_correlation_pairs_returns_candidates_without_mutating_input():
    X = pd.DataFrame({"BounceRates": [0.1, 0.2, 0.3, 0.4], "ExitRates": [0.2, 0.4, 0.6, 0.8], "Other": [1, 2, 1, 2]})
    original = X.copy()

    pairs = correlation_pairs(X, threshold=0.95)

    assert pairs.loc[0, "feature_a"] == "BounceRates"
    assert pairs.loc[0, "feature_b"] == "ExitRates"
    pd.testing.assert_frame_equal(X, original)


def test_permutation_importance_and_feature_drop_are_cv_based():
    rng = np.random.RandomState(42)
    X = pd.DataFrame(rng.normal(size=(80, 3)), columns=["signal", "redundant", "noise"])
    X["redundant"] = X["signal"] + rng.normal(scale=0.05, size=len(X))
    y = (X["signal"] > 0).astype(int)
    estimator = LogisticRegression(max_iter=1000)
    cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)

    importance = cross_validated_permutation_importance(estimator, X, y, cv=cv, n_repeats=2)
    comparison = compare_feature_drop(estimator, X, y, "redundant", cv=cv)

    assert set(importance["feature"]) == set(X.columns)
    assert set(comparison["feature_set"]) == {"keep", "drop"}
    assert np.isfinite(comparison["mean_score"]).all()


def test_compare_feature_drop_supports_multiple_features():
    rng = np.random.RandomState(42)
    X = pd.DataFrame(rng.normal(size=(80, 4)), columns=["f1", "f2", "f3", "f4"])
    y = (X["f1"] > 0).astype(int)
    estimator = LogisticRegression(max_iter=1000)
    cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)

    comparison = compare_feature_drop(estimator, X, y, ["f2", "f3"], cv=cv, drop_name="drop_redundant")
    assert set(comparison["feature_set"]) == {"keep", "drop_redundant"}
    assert np.isfinite(comparison["mean_score"]).all()


def test_categorical_chi2_screening_and_importance_selection():
    X = pd.DataFrame({
        "Month": ["May", "May", "Nov", "Nov", "May", "Nov", "May", "Nov"] * 10,
        "RandomCat": ["A", "B", "A", "B", "A", "B", "A", "B"] * 10,
    })
    y = pd.Series([0, 0, 1, 1, 0, 1, 0, 1] * 10)

    chi_df = categorical_chi2_screening(X, y)
    assert "feature" in chi_df.columns
    assert "p_value" in chi_df.columns
    assert chi_df.loc[chi_df["feature"] == "Month", "significant"].iloc[0]

    imp_df = pd.DataFrame({
        "feature": ["f1", "f2", "f3"],
        "importance_mean": [0.15, -0.01, 0.05],
    })
    selected = select_features_by_importance(imp_df, threshold=0.0)
    assert selected == ["f1", "f3"]


def test_sequential_backward_selection_and_variance():
    from src.preprocessing.feature_selection import (
        filter_low_variance_features,
        sequential_backward_selection,
    )
    rng = np.random.RandomState(42)
    X = pd.DataFrame(rng.normal(size=(80, 4)), columns=["f1", "f2", "f3", "constant"])
    X["constant"] = 5.0
    y = (X["f1"] > 0).astype(int)

    filtered = filter_low_variance_features(X, threshold=0.0)
    assert "constant" not in filtered
    assert "f1" in filtered

    estimator = LogisticRegression(max_iter=1000)
    cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
    selected, history = sequential_backward_selection(estimator, X[["f1", "f2", "f3"]], y, min_features=1, cv=cv)
    assert "f1" in selected
    assert len(history) >= 1