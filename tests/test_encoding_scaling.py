import sys
from pathlib import Path
import pandas as pd
from sklearn.model_selection import train_test_split

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.preprocessing.encoding_scaling import (
    CATEGORICAL_COLUMNS,
    build_preprocessor,
)
from src.preprocessing.feature_engineering import add_engineered_features


def test_encoding_and_scaling_pipeline():
    data = pd.read_csv("data/raw/online_shoppers_intention.csv")
    X = data.drop(columns=["Revenue"])
    y = data["Revenue"]
    X = add_engineered_features(X)

    numerical_columns = [
        column
        for column in X.columns
        if column not in CATEGORICAL_COLUMNS
    ]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    preprocessor = build_preprocessor(numerical_columns)
    X_train_processed = preprocessor.fit_transform(X_train)
    X_test_processed = preprocessor.transform(X_test)

    assert X_train_processed.shape[0] == len(X_train)
    assert X_test_processed.shape[0] == len(X_test)


def test_scaler_options():
    data = pd.read_csv("data/raw/online_shoppers_intention.csv")
    X = data.drop(columns=["Revenue"])
    y = data["Revenue"]
    X = add_engineered_features(X)

    numerical_columns = [
        column
        for column in X.columns
        if column not in CATEGORICAL_COLUMNS
    ]

    X_train, _, _, _ = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    prep_robust = build_preprocessor(numerical_columns, scaler="robust")
    X_tr_rob = prep_robust.fit_transform(X_train)
    assert X_tr_rob.shape[0] == len(X_train)

    prep_minmax = build_preprocessor(numerical_columns, scaler="minmax")
    X_tr_mm = prep_minmax.fit_transform(X_train)
    assert X_tr_mm.shape[0] == len(X_train)


if __name__ == "__main__":
    test_encoding_and_scaling_pipeline()
    test_scaler_options()
    print("Encoding and scaling tests passed successfully.")