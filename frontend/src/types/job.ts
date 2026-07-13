export type JobStatus = "queued" | "analyzing_prompt" | "computing_gee" | "generating_report" | "failed" | "completed" | "canceled";

export interface JobData
{
    id: string;
    status: JobStatus;
    err_message?: string;
}
