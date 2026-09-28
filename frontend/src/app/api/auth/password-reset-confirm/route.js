import {NextResponse} from "next/server";
import {serverFetch} from "@/lib/api/server";
import {API_ENDPOINTS} from "@/lib/config";

export async function POST(request) {
    try {
        const {uid, token, new_password1, new_password2} = await request.json();

        if (!uid || !token || !new_password1 || !new_password2) {
            return NextResponse.json(
                {error: "All fields are required."},
                {status: 400}
            );
        }

        if (new_password1 !== new_password2) {
            return NextResponse.json(
                {error: "Passwords do not match."},
                {status: 400}
            );
        }

        await serverFetch(API_ENDPOINTS.account.passwordResetConfirm, {
            method: "POST",
            body: {uid, token, new_password1, new_password2},
        });

        return NextResponse.json(
            {message: "Password has been reset successfully."},
            {status: 200}
        );
    } catch (e) {
        const status = e?.status || 400;
        const message =
            e?.data?.token?.[0] ||
            e?.data?.uid?.[0] ||
            e?.data?.new_password1?.[0] ||
            e?.data?.new_password2?.[0] ||
            e?.data?.non_field_errors?.[0] ||
            e?.data?.detail ||
            e?.data?.error ||
            e?.message ||
            "Password reset failed. The link may have expired.";

        return NextResponse.json({error: message}, {status});
    }
}
