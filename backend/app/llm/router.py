import app.llm.models as llm_models
from app.worker.tasks import generate_geospatial_report
from app.llm.schemas import MessageCreate, ChatRename, ChatPinToggle
from fastapi import APIRouter, HTTPException, Request, Depends
from app.dependencies import check_auth, rate_limiter

router = APIRouter(dependencies=[
    Depends(check_auth),
    Depends(rate_limiter)
])

# Endpoint to retrieve user's chats
@router.get("/llm/chat", tags=["llm"])
async def get_user_chats(request: Request):
    try:
        chats = llm_models.get_user_chats(
            user_id=request.state.user.id
        )

        return { "chats": chats }
    except Exception as err:
        print("ERROR: Failed to retrieve user chats:", str(err))

        raise HTTPException(
            status_code=500,
            detail={
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Something went wrong"
            }
        )
    
# Endpoint to create a new chat
@router.post("/llm/chat/new", tags=["llm"])
async def create_new_chat(request: Request):
    try:
        chat = llm_models.create_new_chat(
            user_id=request.state.user.id
        )

        if chat is None:
            raise Exception("Failed to create chat")

        return {
            "chat": {
                "id": chat[0]["id"],
                "created_at": chat[0]["created_at"],
                "title": chat[0]["title"],
                "is_pinned": chat[0]["is_pinned"]
            },
            "message": "Chat created successfully"
        }
    except Exception as err:
        print("ERROR: Failed to create chat:", str(err))

        raise HTTPException(
            status_code=500,
            detail={
                "code": "CHAT_CREATION_FAILED",
                "message": "Failed to create chat"
            }
        )

# Endpoint to handle chat message
@router.post("/llm/chat/{chat_id}", tags=["llm"])
async def send_message_to_llm(
    chat_id: str,
    payload: MessageCreate,
    request: Request
):
    try:
        user_id = request.state.user.id
        if not llm_models.chat_exists(chat_id, user_id):
            raise Exception("Chat history not found")
        
        user_message = llm_models.save_chat_message(
            chat_id=chat_id, 
            user_id=user_id, 
            role="user",
            content=payload.message
        )

        generate_geospatial_report.delay(chat_id, user_id, payload.message)
    
        return { "message": user_message[0] }
    except Exception as err:
        error_msg = str(err).lower()
        print("ERROR: Failed to send chat message:", str(err))

        if "not found" in error_msg:
            raise HTTPException(
                status_code=404,
                detail={
                    "code": "CHAT_NOT_FOUND",
                    "message": "Chat not found"
                }
            )

        raise HTTPException(
            status_code=500,
            detail={
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Something went wrong"
            }
        )

# Endpoint to retrieve chat history
@router.get("/llm/chat/{chat_id}", tags=["llm"])
async def get_chat_conversation(chat_id: str, request: Request):
    try:
        user_id = request.state.user.id
        if not llm_models.chat_exists(chat_id, user_id):
            raise Exception("Chat history not found")

        messages = llm_models.get_chat_message(
            chat_id=chat_id,
            user_id=user_id
        )

        return {
            "chat_id": chat_id,
            "messages": messages
        }
    except Exception as err:
        error_msg = str(err).lower()
        print("ERROR: Failed to retrieve chat history:", str(err))

        if "not found" in error_msg:
            raise HTTPException(
                status_code=404,
                detail={
                    "code": "CHAT_NOT_FOUND",
                    "message": "Chat not found"
                }
            )

        raise HTTPException(
            status_code=500,
            detail={
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Something went wrong"
            }
        )

# Endpoint to delete a chat
@router.delete("/llm/chat/{chat_id}", tags=["llm"])
async def delete_chat(chat_id: str, request: Request):
    try:
        user_id = request.state.user.id
        if not llm_models.chat_exists(chat_id, user_id):
            raise Exception("Chat history not found")

        llm_models.delete_chat(chat_id, user_id)

        return { "message": "Chat deleted successfully" }
    except Exception as err:
        error_msg = str(err).lower()
        print("ERROR: Failed to delete chat:", str(err))

        if "not found" in error_msg:
            raise HTTPException(
                status_code=404,
                detail={
                    "code": "CHAT_NOT_FOUND",
                    "message": "Chat not found"
                }
            )

        raise HTTPException(
            status_code=500,
            detail={
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Something went wrong"
            }
        )

# Endpoint to update chat's title
@router.patch("/llm/chat/{chat_id}", tags=["llm"])
async def rename_user_chat(
    chat_id: str,
    payload: ChatRename, 
    request: Request
):
    try:
        user_id = request.state.user.id
        if not llm_models.chat_exists(chat_id, user_id):
            raise Exception("Chat history not found")
        
        updated_chat = llm_models.rename_chat(
            chat_id=chat_id,
            user_id=user_id,
            new_title=payload.new_title
        )

        return {
            "chat": {
                "id": updated_chat[0]["id"],
                "title": updated_chat[0]["title"],
                "created_at": updated_chat[0]["created_at"],
                "is_pinned": updated_chat[0]["is_pinned"]
            },
            "message": "Chat renamed successfully"
        }
    except Exception as err:
        error_msg = str(err).lower()
        print("ERROR: Failed to rename chat:", str(err))

        if "not found" in error_msg:
            raise HTTPException(
                status_code=404,
                detail={
                    "code": "CHAT_NOT_FOUND",
                    "message": "Chat not found"
                }
            )

        raise HTTPException(
            status_code=500,
            detail={"code": "RENAME_FAILED", "message": str(err)}
        )

@router.patch("/llm/chat/{chat_id}/pin", tags=["llm"])
async def toggle_chat_pin(
    chat_id: str, 
    request: Request,
    payload: ChatPinToggle
):
    try:
        user_id = request.state.user.id
        if not llm_models.chat_exists(chat_id, user_id):
            raise Exception("Chat history not found")

        updated_chat = llm_models.toggle_chat_pin(
            chat_id=chat_id,
            user_id=request.state.user.id,
            is_pinned=payload.is_pinned 
        )

        return {
            "chat": {
                "id": updated_chat[0]["id"],
                "title": updated_chat[0]["title"],
                "created_at": updated_chat[0]["created_at"],
                "is_pinned": updated_chat[0]["is_pinned"]
            },
            "message": "Chat pin toggled successfully"
        }
    except Exception as err:
        error_msg = str(err).lower()
        print("ERROR: Failed to rename chat:", str(err))

        if "not found" in error_msg:
            raise HTTPException(
                status_code=404,
                detail={
                    "code": "CHAT_NOT_FOUND",
                    "message": "Chat not found"
                }
            )

        raise HTTPException(
            status_code=500,
            detail={"code": "RENAME_FAILED", "message": str(err)}
        )
    