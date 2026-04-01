from pydantic import BaseModel
from uuid import UUID

class ChatRequest(BaseModel):
    message: str
    chat_id: UUID
