const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";
const secure = SITE_URL ? SITE_URL.startsWith("https://") : process.env.NODE_ENV === "production";

const base = {httpOnly: true, sameSite: "lax", secure, path: "/"};
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7; // keep equal to REFRESH_TOKEN_EXPIRE_SECONDS (3.5)

export function setAuthCookies(response, {access_token, expires_in, refresh_token}) {
    response.cookies.set("access_token", access_token, {...base, maxAge: expires_in});
    if (refresh_token) {
        response.cookies.set("refresh_token", refresh_token, {...base, maxAge: REFRESH_MAX_AGE});
    }
}

export function clearAuthCookies(response) {
    response.cookies.set("access_token", "", {...base, maxAge: 0});
    response.cookies.set("refresh_token", "", {...base, maxAge: 0});
}