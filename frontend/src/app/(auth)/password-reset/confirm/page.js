import SuspenseBoundary from "@/components/SuspenseBoundary";
import ResetConfirmForm from "./ResetConfirmForm";

export const metadata = {
    title: "Set a new password",
    robots: "noindex, nofollow",
    referrer: "no-referrer",
};

export default function PasswordResetConfirmPage() {
    return (
        <SuspenseBoundary>
            <ResetConfirmForm/>
        </SuspenseBoundary>
    );
}