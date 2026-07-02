import uuid
from typing import Optional
from pydantic import BaseModel, Field

class MessageCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    message_id: Optional[uuid.UUID] = None

class ChatRename(BaseModel):
    new_title: str = Field(..., min_length=1, max_length=50)

class ChatPinToggle(BaseModel):
    is_pinned: bool
