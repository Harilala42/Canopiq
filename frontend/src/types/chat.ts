export type JobStatus = "queued" | "analyzing_prompt" | "computing_gee" | "generating_report" | "failed" | "completed";

export interface ChatData
{
    id: string;
    title: string;
    created_at: string;
    is_pinned: boolean;
    isNew?: boolean;
}

export interface MessageData
{
    id: string;
    role: "user" | "model";
    content: string;
    created_at: string;
}
