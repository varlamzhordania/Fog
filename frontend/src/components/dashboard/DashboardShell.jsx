"use client";

import {useEffect} from "react";
import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import {Skeleton, Typography} from "@heroui/react";
import {ClipboardList, LayoutDashboard, MapPinHouse, UserRound} from "lucide-react";
import Icon from "@/components/icon/Icon";
import {useAuthStore} from "@/stores/auth";
import {useCurrentUser} from "@/queries/auth";

const NAVIGATION = [
    {title: "Overview", href: "/dashboard", icon: LayoutDashboard},
    {title: "Orders", href: "/dashboard/orders", icon: ClipboardList},
    {title: "Addresses", href: "/dashboard/addresses", icon: MapPinHouse},
    {title: "Account", href: "/dashboard/account", icon: UserRound},
];

const DashboardShell = ({children}) => {
    const router = useRouter();
    const pathname = usePathname().replace(/\/$/, "");
    const {logged_in, user} = useAuthStore((state) => state);
    const {data, isPending} = useCurrentUser();

    // The auth store is filled by AppInitializer, so wait for the session check before redirecting.
    const isAuthenticated = logged_in || Boolean(data);

    useEffect(() => {
        if (!isPending && !isAuthenticated) router.replace("/login");
    }, [isPending, isAuthenticated, router]);

    if (!isAuthenticated) {
        return (
            <div className="container container-space flex flex-col gap-6">
                <Skeleton className="h-10 w-64 rounded-lg"/>
                <Skeleton className="h-64 w-full rounded-xl"/>
            </div>
        );
    }

    const isActive = (href) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href));

    return (
        <div className="container pb-16 pt-6 md:pb-24 md:pt-10">
            <header className="mb-8 border-b pb-6">
                <Typography type="body-sm" className="mb-1.5 text-muted uppercase tracking-wider">
                    My dashboard
                </Typography>
                <Typography type="h1" className="text-3xl font-light tracking-tight sm:text-4xl">
                    Hello{user?.first_name ? `, ${user.first_name}` : ""}
                </Typography>
            </header>

            <div className="grid grid-cols-12 items-start gap-8">
                <nav aria-label="Dashboard"
                     className="col-span-12 lg:sticky lg:top-28 lg:col-span-3">
                    <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
                        {NAVIGATION.map((item) => (
                            <li key={item.href} className="shrink-0">
                                <Link
                                    href={item.href}
                                    aria-current={isActive(item.href) ? "page" : undefined}
                                    className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium no-underline transition-colors ${
                                        isActive(item.href)
                                            ? "bg-accent/10 text-accent"
                                            : "text-muted hover:bg-default hover:text-foreground"
                                    }`}
                                >
                                    <Icon icon={item.icon} className="size-4"/>
                                    {item.title}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <section className="col-span-12 min-w-0 lg:col-span-9">
                    {children}
                </section>
            </div>
        </div>
    );
};

export default DashboardShell;
