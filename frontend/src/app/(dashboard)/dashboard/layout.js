import DashboardShell from "@/components/dashboard/DashboardShell";

export const metadata = {
    title: "My dashboard",
    robots: "noindex, nofollow",
};

export default function DashboardLayout({children}) {
    return <DashboardShell>{children}</DashboardShell>;
}
