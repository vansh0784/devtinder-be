export class BaseResponse {
    statusCode: number;
    message: string;
    access_token?: string;
    data?: any;
}

export class SessionDto {
    user_id: string;
    email: string;
}
