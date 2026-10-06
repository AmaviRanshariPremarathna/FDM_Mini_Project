from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class SessionInput(BaseModel):
    Administrative: int = Field(..., ge=0, description="Number of administrative pages visited")
    Administrative_Duration: float = Field(..., ge=0.0, description="Total time spent on administrative pages (seconds)")
    Informational: int = Field(..., ge=0, description="Number of informational pages visited")
    Informational_Duration: float = Field(..., ge=0.0, description="Total time spent on informational pages (seconds)")
    ProductRelated: int = Field(..., ge=0, description="Number of product-related pages visited")
    ProductRelated_Duration: float = Field(..., ge=0.0, description="Total time spent on product-related pages (seconds)")
    BounceRates: float = Field(..., ge=0.0, le=1.0, description="Average bounce rate of pages visited by the visitor")
    ExitRates: float = Field(..., ge=0.0, le=1.0, description="Average exit rate of pages visited by the visitor")
    PageValues: float = Field(..., ge=0.0, description="Average value of the pages visited before completing a transaction")
    SpecialDay: float = Field(0.0, ge=0.0, le=1.0, description="Closeness of browsing date to a special day (e.g. Mother's Day)")
    Month: str = Field(..., description="Month of the session (e.g. Nov, May, Dec, Mar, etc.)")
    OperatingSystems: int = Field(..., ge=1, le=8, description="Operating system identifier (1-8)")
    Browser: int = Field(..., ge=1, le=13, description="Browser identifier (1-13)")
    Region: int = Field(1, ge=1, le=9, description="Geographic region identifier (1-9)")
    TrafficType: int = Field(..., ge=1, le=20, description="Traffic source type identifier (1-20)")
    VisitorType: str = Field(..., description="Visitor category: Returning_Visitor, New_Visitor, or Other")
    Weekend: bool = Field(..., description="Whether the session occurred on a weekend (True/False)")

    @field_validator("Month")
    @classmethod
    def validate_month(cls, v: str) -> str:
        month_map = {
            "January": "Jan",
            "February": "Feb",
            "March": "Mar",
            "April": "Apr",
            "May": "May",
            "June": "June",
            "Jun": "June",
            "July": "Jul",
            "August": "Aug",
            "September": "Sep",
            "October": "Oct",
            "November": "Nov",
            "December": "Dec",
        }
        valid_months = {
            "Jan", "Feb", "Mar", "Apr", "May", "June", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        }
        clean_v = v.strip().capitalize()
        normalized = month_map.get(clean_v, clean_v)
        if normalized not in valid_months:
            raise ValueError(f"Invalid Month '{v}'. Must be a valid calendar month.")
        return normalized

    @field_validator("VisitorType")
    @classmethod
    def validate_visitor_type(cls, v: str) -> str:
        valid_types = {"Returning_Visitor", "New_Visitor", "Other"}
        clean_v = v.strip()
        if clean_v not in valid_types:
            raise ValueError(f"Invalid VisitorType '{v}'. Must be one of {sorted(list(valid_types))}")
        return clean_v

    model_config = {
        "json_schema_extra": {
            "example": {
                "Administrative": 2,
                "Administrative_Duration": 85.5,
                "Informational": 1,
                "Informational_Duration": 32.0,
                "ProductRelated": 18,
                "ProductRelated_Duration": 640.2,
                "BounceRates": 0.01,
                "ExitRates": 0.03,
                "PageValues": 16.4,
                "SpecialDay": 0.0,
                "Month": "Nov",
                "OperatingSystems": 2,
                "Browser": 2,
                "Region": 1,
                "TrafficType": 2,
                "VisitorType": "Returning_Visitor",
                "Weekend": False,
            }
        }
    }


class SessionFeaturesSummary(BaseModel):
    TotalPages: int
    TotalDuration: float
    AvgTimePerPage: float
    VisitorType_Weekend: str


class PredictionResponse(BaseModel):
    prediction: str = Field(..., description="'Purchase' or 'No Purchase'")
    prediction_class: int = Field(..., description="1 for Purchase, 0 for No Purchase")
    purchase_probability: float = Field(..., description="Calibrated probability of purchase (0.0 to 1.0)")
    confidence_percentage: str = Field(..., description="Human-readable confidence percentage")
    intent_level: str = Field(..., description="'High Intent', 'Moderate Intent', or 'Low Intent'")
    recommendation: str = Field(..., description="Actionable business guidance for e-commerce marketers")
    session_summary: SessionFeaturesSummary = Field(..., description="Derived feature summary from session activity")


class BatchPredictionRequest(BaseModel):
    sessions: List[SessionInput]


class BatchPredictionResponse(BaseModel):
    total_sessions: int
    predicted_purchases: int
    predictions: List[PredictionResponse]


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_name: str
    model_version: str
    expected_features_count: int
