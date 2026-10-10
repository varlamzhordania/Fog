import {NextResponse} from "next/server";
import {serverFetch} from "@/lib/api/server";
import {API_ENDPOINTS} from "@/lib/config";

export async function POST(request) {
    try {
        const {email} = await request.json();

        if (!email) {
            return NextResponse.json(
                {error: "Email address is required."},
                {status: 400}
            );
        }

        await serverFetch(API_ENDPOINTS.account.passwordReset, {
            method: "POST",
            body: {email},
        });

        // Always return success to prevent email enumeration
        return NextResponse.json(
            {message: "If an account with that email exists, a password reset link has been sent."},
            {status: 200}
        );
    } catch (e) {
        // Still return a generic success to prevent email enumeration
        if (e?.status === 404) {
            return NextResponse.json(
                {message: "If an account with that email exists, a password reset link has been sent."},
                {status: 200}
            );
        }

        const status = e?.status || 400;
        const message =
            e?.data?.email?.[0] ||
            e?.data?.detail ||
            e?.data?.error ||
            "Failed to process password reset request.";

        return NextResponse.json({error: message}, {status});
    }
}
