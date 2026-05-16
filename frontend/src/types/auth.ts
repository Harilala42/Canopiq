export interface LoginFormData
{
    email: string;
    password: string;
}

export interface RegisterFormData
{
    email: string;
    username: string;
    password: string;
    confirmPassword?: string;
    consent?: boolean;
}
