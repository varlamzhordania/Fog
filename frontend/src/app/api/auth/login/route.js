import {NextResponse} from "next/server";
import {loginWithPassword, retrieveSelf} from "@/lib/api/auth";
import {setAuthCookies} from "@/lib/auth-cookies";

const AUTH_CLIENT_ID = process.env.AUTH_CLIENT_ID;
const AUTH_CLIENT_SECRET = process.env.AUTH_CLIENT_SECRET;

export async function POST(request) {
    try {
        const {email, password} = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                {error: "Email and password are required."},
                {status: 400}
            );
        }

        const {
            access_token,
            refresh_token,
            expires_in,
        } = await loginWithPassword({
            username: email,
            password,
            client_id: AUTH_CLIENT_ID,
            client_secret: AUTH_CLIENT_SECRET,
        });


        const user = await retrieveSelf(access_token);

        const response = NextResponse.json(
            {
                access_token,
                expires_in,
                user: user?.email && user?.id ? user : undefined,
            },
            {status: 200}
        );


        setAuthCookies(response, {access_token, refresh_token, expires_in})

        return response;
    } catch (e) {
        const status = e?.status || 400;
        const message =
            e?.data?.error_description ||
            e?.data?.detail ||
            e?.data?.error ||
            "Invalid credentials.";

        return NextResponse.json({error: message}, {status});
    }
}
