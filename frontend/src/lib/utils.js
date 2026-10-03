export const validateEmail = (value) => {
    return !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value);
}
export const validatePassword = (value) => {
    // if (value.length < 8) {
    //     return "Password must be at least 8 characters";
    // }
    // if (!/[A-Z]/.test(value)) {
    //     return "Password must contain at least one uppercase letter";
    // }
    // if (!/[0-9]/.test(value)) {
    //     return "Password must contain at least one number";
    // }
    return null;
}

export const getClientIp = (headers) => {
    // Cloudflare
    const cfIp = headers.get("cf-connecting-ip");

    if (cfIp) {
        return cfIp;
    }

    // Standard reverse proxy header
    const forwardedFor = headers.get("x-forwarded-for");

    if (forwardedFor) {
        return forwardedFor.split(",")[0].trim();
    }

    // Alternative proxy header
    const realIp = headers.get("x-real-ip");

    if (realIp) {
        return realIp;
    }

    return null;
}

export const getApiErrorMessage = (error, fallback = "Something went wrong.") => {
    const data = error?.response?.data;
    if (!data) return error?.message || fallback;
    if (typeof data === "string") return data;
    if (data.detail) return Array.isArray(data.detail) ? data.detail[0] : data.detail;

    const first = Object.values(data)[0];
    if (Array.isArray(first)) return String(first[0]);
    if (typeof first === "string") return first;
    if (first && typeof first === "object") return String(Object.values(first)[0]?.[0] ?? fallback);
    return fallback;
};