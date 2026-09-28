import {NextResponse} from "next/server";
import {cookies} from "next/headers";

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
        return NextResponse.json(
            {error: "You are not logged in."},
            {status: 401}
        );
    }

    const secure = process.env.NODE_ENV === "production";

    const response = NextResponse.json(
        {success: true, message: "Logout successful."},
        {status: 200}
    );

    // Clear both tokens by setting maxAge to 0
    response.cookies.set("access_token", "", {
        httpOnly: true,
        sameSite: "lax",
        secure,
        path: "/",
        maxAge: 0,
    });

    response.cookies.set("refresh_token", "", {
        httpOnly: true,
        sameSite: "lax",
        secure,
        path: "/",
        maxAge: 0,
    });

    return response;
}
