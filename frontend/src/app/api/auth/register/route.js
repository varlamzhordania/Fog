import {NextResponse} from "next/server";
import {serverFetch} from "@/lib/api/server";
import {loginWithPassword, retrieveSelf} from "@/lib/api/auth";
import {API_ENDPOINTS} from "@/lib/config";

const AUTH_CLIENT_ID = process.env.AUTH_CLIENT_ID;
const AUTH_CLIENT_SECRET = process.env.AUTH_CLIENT_SECRET;

export async function POST(request) {
    try {
        const body = await request.json();
        const {email, password1, password2, username} = body;

        if (!email || !password1 || !password2) {
            return NextResponse.json(
                {error: "Email and password are required."},
                {status: 400}
            );
        }

        if (password1 !== password2) {
            return NextResponse.json(
                {error: "Passwords do not match."},
                {status: 400}
            );
        }

        // Create the account on Django
        await serverFetch(API_ENDPOINTS.account.register, {
            method: "POST",
            body: {email, username, password1, password2},
        });

        // Auto-login after successful registration
        const {
            access_token,
            refresh_token,
            expires_in,
        } = await loginWithPassword({
            username: email,
            password: password1,
            client_id: AUTH_CLIENT_ID,
            client_secret: AUTH_CLIENT_SECRET,
        });

        const user = await retrieveSelf(access_token);

        const secure = process.env.NODE_ENV === "production";

        const response = NextResponse.json(
            {access_token, expires_in, user},
            {status: 201}
        );

        response.cookies.set("access_token", access_token, {
            httpOnly: true,
            sameSite: "lax",
            secure,
            path: "/",
            maxAge: expires_in,
        });

        response.cookies.set("refresh_token", refresh_token, {
            httpOnly: true,
            sameSite: "lax",
            secure,
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;
    } catch (e) {
        const status = e?.status || 400;

        // Django may return field-level validation errors
        const fieldErrors = e?.data;
        const message =
            e?.data?.email?.[0] ||
            e?.data?.username?.[0] ||
            e?.data?.password1?.[0] ||
            e?.data?.non_field_errors?.[0] ||
            e?.data?.detail ||
            e?.data?.error ||
            e?.message ||
            "Registration failed. Please try again.";

        return NextResponse.json({error: message, errors: fieldErrors}, {status});
    }
}
