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


def build_preprocessor(numerical_columns, categorical_columns=None):
    """
    Create categorical encoding and numerical scaling.
    Exclude Revenue and fit only on training data.
    """

    # Allow a different categorical list for feature experiments
    if categorical_columns is None:
        categorical_columns = CATEGORICAL_COLUMNS

    categorical_transformer = OneHotEncoder(
        handle_unknown="ignore",
        sparse_output=False,
    )

    numerical_transformer = StandardScaler()

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "categorical",
                categorical_transformer,
                categorical_columns,
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