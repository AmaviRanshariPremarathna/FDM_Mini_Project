import numpy as np
import pandas as pd

from src.preprocessing.feature_engineering import (
    add_engineered_features,
    apply_log_transform,
    SKEWED_COLUMNS,
)


def test_engineered_features():
    data = pd.read_csv("data/raw/online_shoppers_intention.csv")
    X = data.drop(columns=["Revenue"])

    X_eng = add_engineered_features(X)

    for col in ["TotalPages", "TotalDuration", "AvgTimePerPage", "VisitorType_Weekend"]:
        assert col in X_eng.columns

    assert X_eng["AvgTimePerPage"].isna().sum() == 0
    assert not np.isinf(X_eng["AvgTimePerPage"]).any()


def test_advanced_engineered_features():
    data = pd.read_csv("data/raw/online_shoppers_intention.csv")
    X = data.drop(columns=["Revenue"])

    X_eng = add_engineered_features(X, include_advanced_features=True)

    for col in ["Bounce_Exit_Ratio", "PageValue_Duration", "Has_PageValues"]:
        assert col in X_eng.columns

    assert X_eng["Bounce_Exit_Ratio"].isna().sum() == 0
    assert not np.isinf(X_eng["Bounce_Exit_Ratio"]).any()
    assert set(X_eng["Has_PageValues"].unique()).issubset({0.0, 1.0})


def test_log_transform_replaces_in_place():
    data = pd.read_csv("data/raw/online_shoppers_intention.csv")
    X = add_engineered_features(data.drop(columns=["Revenue"]))

    X_log = apply_log_transform(X, columns=SKEWED_COLUMNS)

    for col in SKEWED_COLUMNS:
        assert col in X_log.columns              # original name kept
        assert f"{col}_log" not in X_log.columns # no extra _log column
        assert np.allclose(X_log[col], np.log1p(X[col]))