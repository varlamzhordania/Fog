import {NextResponse} from "next/server";
import {cookies} from "next/headers";

import {retrieveSelf, refreshToken} from "@/lib/api/auth";

const AUTH_CLIENT_ID = process.env.AUTH_CLIENT_ID;
const AUTH_CLIENT_SECRET = process.env.AUTH_CLIENT_SECRET;

const cookieOptions = {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/",
};

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

        // 4. Store new access token
        response.cookies.set("access_token", newAccessToken, {
            ...cookieOptions, maxAge: expires_in,
        });

        // 5. Store rotated refresh token if provided
        if (newRefreshToken) {
            response.cookies.set("refresh_token", newRefreshToken, {
                ...cookieOptions, maxAge: 60 * 60 * 24 * 7,
            });
        }

        return response;

    } catch (error) {
        console.error("Authorization failed:", error);

        response = NextResponse.json({
            error: "Session expired. Please log in again.",
        }, {status: 401});

        response.cookies.set("access_token", "", {
            ...cookieOptions, maxAge: 0,
        });

        response.cookies.set("refresh_token", "", {
            ...cookieOptions, maxAge: 0,
        });

        return response;
    }
}