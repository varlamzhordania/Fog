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