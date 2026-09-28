export const metadata = {
    robots: "noindex, nofollow",
};

/**
 * Shared layout for all authentication pages.
 * The root layout (Navbar + Footer) already wraps this.
 * This layout simply centres the auth card in the remaining viewport.
 */
export default function AuthLayout({children}) {
    return (
        <div className="flex min-h-[78vh] items-center justify-center px-4 py-16">
            {children}
        </div>
    );
}
