import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import {clearAuthCookies, setAuthCookies} from "@/lib/auth-cookies";
import {retrieveSelf, refreshToken} from "@/lib/api/auth";

const AUTH_CLIENT_ID = process.env.AUTH_CLIENT_ID;
const AUTH_CLIENT_SECRET = process.env.AUTH_CLIENT_SECRET;


export async function GET() {
    const cookieStore = await cookies();

    const accessToken = cookieStore.get("access_token")?.value;
    const refresh = cookieStore.get("refresh_token")?.value;

    if (!accessToken && !refresh) {
        return NextResponse.json({error: "You are not logged in."}, {status: 401});
    }

    let response = null;

    try {
        // 1. Try the current access token first
        if (accessToken) {
            try {
                const user = await retrieveSelf(accessToken);

                return NextResponse.json({user, access_token: accessToken}, {status: 200});
            } catch (error) {
                // Access token is probably expired.
                // Continue below and try the refresh token.
                if (!refresh) {
                    throw error;
                }
            }
        }

        // 2. No access token or access token expired -> refresh
        if (!refresh) {
            return NextResponse.json({error: "Session expired. Please log in again."}, {status: 401});
        }

        const {
            access_token: newAccessToken, refresh_token: newRefreshToken, expires_in,
        } = await refreshToken({
            refresh_token: refresh, client_id: AUTH_CLIENT_ID, client_secret: AUTH_CLIENT_SECRET,
        });

        // 3. Retry /me using the new access token
        const user = await retrieveSelf(newAccessToken);

        response = NextResponse.json({
            user, access_token: newAccessToken, expires_in
        }, {status: 200});

        setAuthCookies(response, {access_token: newAccessToken, expires_in, refresh_token: newRefreshToken});

        return response;

    } catch (error) {

        if (![400, 401].includes(error?.status)) {
            return NextResponse.json({error: "Service temporarily unavailable."}, {status: 503});
        }

        response = NextResponse.json({
            error: "Session expired. Please log in again.",
        }, {status: 401});

        clearAuthCookies(response);

        return response;
    }
}