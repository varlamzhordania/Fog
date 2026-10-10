export class ApiError extends Error {
    constructor(status, data) {
        super(data?.detail || data?.error_description || data?.error || `Request failed with status ${status}`);
        this.name = "ApiError";
        this.status = status;
        this.data = data;
    }
}