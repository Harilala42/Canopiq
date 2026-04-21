from pydantic import BaseModel, Field, model_validator
from datetime import datetime

class MapRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    bbox: list[float]
    start_time: datetime
    end_time: datetime

    @model_validator(mode='after')
    def check_date_range(self) -> 'MapRequest':
        if self.start_time >= self.end_time:
            raise ValueError("startTime must be earlier than endTime")
        return self
