export const metadata = {
    robots: "noindex, nofollow",
};

export default function AuthLayout({children}) {
    return (
        <div className="flex min-h-[78vh] items-center justify-center px-4 py-16">
            {children}
        </div>
    );
}
