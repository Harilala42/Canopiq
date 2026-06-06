import app.chat.models as chat_models
from fastapi import APIRouter, HTTPException, Request, Response, Depends
from app.chat.schemas import MessageCreate, ChatRename, ChatPinToggle
from app.llm.tasks import trigger_geospatial_request_analysis
from app.dependencies import check_auth, rate_limiter

router = APIRouter(dependencies=[
    Depends(check_auth),
    Depends(rate_limiter)
])

@router.get("/chat", tags=["chat"])
async def get_user_chats(request: Request):
    try:
        chats = chat_models.get_user_chats(
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
    
@router.post("/chat/new", tags=["chat"])
async def create_new_chat(request: Request):
    try:
        chat = chat_models.create_new_chat(
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

@router.post("/chat/{chat_id}", tags=["chat"])
async def send_message_to_llm(
    chat_id: str,
    payload: MessageCreate,
    request: Request,
    response: Response
):
    try:
        user_id = request.state.user.id
        if not chat_id or not chat_models.chat_exists(chat_id, user_id):
            raise HTTPException(
                status_code=404,
                detail={
                    "code": "CHAT_NOT_FOUND",
                    "message": "Chat not found"
                }
            )
        
        user_message = chat_models.save_chat_message(
            chat_id=chat_id, 
            user_id=user_id, 
            role="user",
            content=payload.message
        )

        trigger_geospatial_request_analysis.delay(chat_id, user_id, payload.message)
    
        response.status_code = 202
        return { "message": user_message[0] }
    except HTTPException:
        raise
    except Exception as err:
        print("ERROR: Failed to send chat message:", str(err))

        raise HTTPException(
            status_code=500,
            detail={
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Something went wrong"
            }
        )

@router.get("/chat/{chat_id}", tags=["chat"])
async def get_chat_conversation(chat_id: str, request: Request):
    try:
        user_id = request.state.user.id
        if not chat_id or not chat_models.chat_exists(chat_id, user_id):
            raise HTTPException(
                status_code=404,
                detail={
                    "code": "CHAT_NOT_FOUND",
                    "message": "Chat not found"
                }
            )

        messages = chat_models.get_chat_message(
            chat_id=chat_id,
            user_id=user_id
        )

        return {
            "chat_id": chat_id,
            "messages": messages
        }
    except HTTPException:
        raise
    except Exception as err:
        print("ERROR: Failed to retrieve chat history:", str(err))

        raise HTTPException(
            status_code=500,
            detail={
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Something went wrong"
            }
        )

@router.delete("/chat/{chat_id}", tags=["chat"])
async def delete_chat(chat_id: str, request: Request):
    try:
        user_id = request.state.user.id
        if not chat_id or not chat_models.chat_exists(chat_id, user_id):
            raise HTTPException(
                status_code=404,
                detail={
                    "code": "CHAT_NOT_FOUND",
                    "message": "Chat not found"
                }
            )

        chat_models.delete_chat(chat_id, user_id)

        return { "message": "Chat deleted successfully" }
    except HTTPException:
        raise
    except Exception as err:
        print("ERROR: Failed to delete chat:", str(err))

        raise HTTPException(
            status_code=500,
            detail={
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Something went wrong"
            }
        )

@router.patch("/chat/{chat_id}", tags=["chat"])
async def rename_user_chat(
    chat_id: str,
    payload: ChatRename, 
    request: Request
):
    try:
        user_id = request.state.user.id
        if not chat_id or not chat_models.chat_exists(chat_id, user_id):
            raise HTTPException(
                status_code=404,
                detail={
                    "code": "CHAT_NOT_FOUND",
                    "message": "Chat not found"
                }
            )
        
        updated_chat = chat_models.rename_chat(
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
    except HTTPException:
        raise
    except Exception as err:
        print("ERROR: Failed to rename chat:", str(err))

        raise HTTPException(
            status_code=500,
            detail={"code": "RENAME_FAILED", "message": str(err)}
        )

@router.patch("/chat/{chat_id}/pin", tags=["chat"])
async def toggle_chat_pin(
    chat_id: str, 
    request: Request,
    payload: ChatPinToggle
):
    try:
        user_id = request.state.user.id
        if not chat_id or not chat_models.chat_exists(chat_id, user_id):
            raise HTTPException(
                status_code=404,
                detail={
                    "code": "CHAT_NOT_FOUND",
                    "message": "Chat not found"
                }
            )

        updated_chat = chat_models.toggle_chat_pin(
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
    except HTTPException:
        raise
    except Exception as err:
        print("ERROR: Failed to rename chat:", str(err))

        raise HTTPException(
            status_code=500,
            detail={"code": "RENAME_FAILED", "message": str(err)}
        )
    