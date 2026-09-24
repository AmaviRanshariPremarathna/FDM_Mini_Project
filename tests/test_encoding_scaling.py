import pandas as pd
from sklearn.model_selection import train_test_split

from src.preprocessing.encoding_scaling import (
    CATEGORICAL_COLUMNS,
    build_preprocessor,
)


data = pd.read_csv("data/raw/online_shoppers_intention.csv")

X = data.drop(columns=["Revenue"])
y = data["Revenue"]

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

print("Original dataset:", data.shape)
print("Training data:", X_train_processed.shape)
print("Testing data:", X_test_processed.shape)
print("Encoding and scaling test successful")