from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler


CATEGORICAL_COLUMNS = [
    "Month",
    "OperatingSystems",
    "Browser",
    "Region",
    "TrafficType",
    "VisitorType",
    "Weekend",
    "VisitorType_Weekend",
]


def build_preprocessor(numerical_columns):
    """
    Create a preprocessing pipeline for categorical encoding
    and numerical feature scaling.

    Important:
    - Do not include the target column 'Revenue'.
    - Fit the preprocessor only on training data.
    """

    categorical_transformer = OneHotEncoder(
        handle_unknown="ignore",
        sparse_output=False
    )

    numerical_transformer = StandardScaler()

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "categorical",
                categorical_transformer,
                CATEGORICAL_COLUMNS,
            ),
            (
                "numerical",
                numerical_transformer,
                numerical_columns,
            ),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )

    return preprocessor