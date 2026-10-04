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


def build_preprocessor(numerical_columns, categorical_columns=None, scaler="standard"):
    """
    Create categorical encoding and numerical scaling.
    Exclude Revenue and fit only on training data.

    Parameters
    ----------
    numerical_columns : list
        List of numeric column names to scale.
    categorical_columns : list, optional
        List of categorical column names to one-hot encode.
    scaler : {"standard", "robust", "minmax"}, default="standard"
        Scaling method to apply:
        - "standard": StandardScaler (zero mean, unit variance)
        - "robust": RobustScaler (scales using median and IQR, outlier-resilient)
        - "minmax": MinMaxScaler (bounds features between [0, 1])
    """

    # Allow a different categorical list for feature experiments
    if categorical_columns is None:
        categorical_columns = CATEGORICAL_COLUMNS

    categorical_transformer = OneHotEncoder(
        handle_unknown="ignore",
        sparse_output=False,
    )

    if scaler == "robust":
        from sklearn.preprocessing import RobustScaler
        numerical_transformer = RobustScaler()
    elif scaler == "minmax":
        from sklearn.preprocessing import MinMaxScaler
        numerical_transformer = MinMaxScaler()
    else:
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