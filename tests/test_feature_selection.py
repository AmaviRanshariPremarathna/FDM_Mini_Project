import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold

from src.preprocessing.feature_selection import (
    compare_feature_drop,
    correlation_pairs,
    cross_validated_permutation_importance,
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