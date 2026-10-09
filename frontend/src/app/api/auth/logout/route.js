import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import {revokeToken} from "@/lib/api/auth";
import {clearAuthCookies} from "@/lib/auth-cookies";

const secure = process.env.NODE_ENV === "production";
const expired = {httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 0};

export async function POST() {
    const store = await cookies();
    const refresh = store.get("refresh_token")?.value;
    const access = store.get("access_token")?.value;


    const token = refresh || access;
    if (token) {
        await revokeToken({
            token,
            client_id: process.env.AUTH_CLIENT_ID,
            client_secret: process.env.AUTH_CLIENT_SECRET,
        }).catch(() => {});
    }

    const response = NextResponse.json({success: true, message: "Logout successful."});
    clearAuthCookies(response);
    return response;
}