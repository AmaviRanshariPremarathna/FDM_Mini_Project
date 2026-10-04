import numpy as np
import pandas as pd

SKEWED_COLUMNS = [
    "ProductRelated",
    "ProductRelated_Duration",
    "PageValues",
    "Administrative_Duration",
    "Informational_Duration",
]


def add_engineered_features(X, include_advanced_features=False):
    """
    Derive TotalPages, TotalDuration, AvgTimePerPage, and a
    VisitorType x Weekend interaction feature, from RAW values.

    Must run BEFORE apply_log_transform() — these are sums of raw
    page/duration columns, so they need to be built before those
    columns get log-transformed, or the sums would be meaningless.

    Row-wise arithmetic only, no fitted parameters — safe to apply
    identically to train and test.

    Parameters
    ----------
    X : pd.DataFrame
        Input raw dataframe.
    include_advanced_features : bool, default=False
        If True, adds high-signal behavioral ratio and interaction features:
        - Bounce_Exit_Ratio: bounce rate relative to exit rate (page abandonment indicator)
        - PageValue_Duration: interaction between page value and log browsing time
        - Has_PageValues: indicator flag for non-zero page values (addresses zero-inflation)
    """
    X = X.copy()

    X["TotalPages"] = X["Administrative"] + X["Informational"] + X["ProductRelated"]
    X["TotalDuration"] = (
        X["Administrative_Duration"] + X["Informational_Duration"] + X["ProductRelated_Duration"]
    )
    X["AvgTimePerPage"] = np.where(
        X["TotalPages"] > 0, X["TotalDuration"] / X["TotalPages"], 0
    )
    X["VisitorType_Weekend"] = X["VisitorType"].astype(str) + "_" + X["Weekend"].astype(str)

    if include_advanced_features:
        # Behavioral ratio: bounce relative to exit rate
        X["Bounce_Exit_Ratio"] = np.where(
            X["ExitRates"] > 0, X["BounceRates"] / X["ExitRates"], 0.0
        )
        # Interaction between high page value and session duration
        X["PageValue_Duration"] = X["PageValues"] * np.log1p(X["TotalDuration"])
        # Sparsity flag for zero-inflated PageValues
        X["Has_PageValues"] = (X["PageValues"] > 0).astype(float)

    return X


def apply_log_transform(X, columns=None):
    """
    Replace right-skewed columns with their log1p-transformed values,
    IN PLACE (same column names) — not as separate '_log' columns.

    Runs AFTER add_engineered_features(), so any derived columns confirmed
    skewed (e.g. TotalPages, TotalDuration) can be included via the
    `columns` argument.

    Fit-free transform, safe to apply identically to train and test.
    """
    X = X.copy()
    cols_to_transform = columns if columns is not None else SKEWED_COLUMNS
    for col in cols_to_transform:
        X[col] = np.log1p(X[col])
    return X