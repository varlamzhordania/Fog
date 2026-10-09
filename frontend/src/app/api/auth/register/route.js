import {NextResponse} from "next/server";
import {serverFetch} from "@/lib/api/server";
import {loginWithPassword, retrieveSelf} from "@/lib/api/auth";
import {API_ENDPOINTS} from "@/lib/config";
import {setAuthCookies} from "@/lib/auth-cookies";

const AUTH_CLIENT_ID = process.env.AUTH_CLIENT_ID;
const AUTH_CLIENT_SECRET = process.env.AUTH_CLIENT_SECRET;

export async function POST(request) {
    try {
        const body = await request.json();
        const {email, first_name, last_name, password1, password2} = body;

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

        await serverFetch(API_ENDPOINTS.account.register, {
            method: "POST",
            body: {email, first_name, last_name, password: password1, password_confirm: password2},
        });

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


        const response = NextResponse.json(
            {access_token, expires_in, user},
            {status: 201}
        );

        setAuthCookies(response, {access_token, refresh_token, expires_in})

        return response;
    } catch (e) {
     const status = e?.status || 400;
        const errors = e?.data || {};

        const message =
            errors?.email?.[0] ||
            errors?.first_name?.[0] ||
            errors?.last_name?.[0] ||
            errors?.password?.[0] ||
            errors?.password_confirm?.[0] ||
            errors?.non_field_errors?.[0] ||
            errors?.detail ||
            errors?.error ||
            "Registration failed. Please try again.";

        return NextResponse.json(
            {
                error: message,
                errors,
            },
            {status}
        );
    }
}
