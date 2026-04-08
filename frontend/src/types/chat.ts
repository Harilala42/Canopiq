export interface ChatData
{
    id: string;
    title: string;
    created_at: string;
    is_pinned: boolean;
}

export interface MessageData
{
    id: string;
    role: "user" | "model";
    content: string;
    created_at: string;
}
