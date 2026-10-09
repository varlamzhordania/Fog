import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import {refreshToken} from "@/lib/api/auth";
import {clearAuthCookies, setAuthCookies} from "@/lib/auth-cookies";

const AUTH_CLIENT_ID = process.env.AUTH_CLIENT_ID;
const AUTH_CLIENT_SECRET = process.env.AUTH_CLIENT_SECRET;

export async function POST() {
    const cookieStore = await cookies();
    const storedRefreshToken = cookieStore.get("refresh_token")?.value;

    if (!storedRefreshToken) {
        return NextResponse.json(
            {error: "No refresh token found. Please log in again."},
            {status: 401}
        );
    }

    try {
        const {
            access_token,
            refresh_token: newRefreshToken,
            expires_in,
        } = await refreshToken({
            refresh_token: storedRefreshToken,
            client_id: AUTH_CLIENT_ID,
            client_secret: AUTH_CLIENT_SECRET,
        });
        const response = NextResponse.json(
            {access_token, expires_in},
            {status: 200}
        );

        setAuthCookies(response, {access_token, expires_in, refresh_token: newRefreshToken});

        return response;
    } catch (e) {
        // Refresh failed — clear both cookies so the client knows to re-authenticate
        const response = NextResponse.json(
            {error: "Session expired. Please log in again."},
            {status: 401}
        );

        clearAuthCookies(response);

        return response;
    }
}
