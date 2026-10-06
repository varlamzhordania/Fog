import {Atomic_Age, Roboto, Poppins} from "next/font/google";
import "./globals.css";
import AppInitializer from "@/layouts/AppInitializer";
import RootProvider from "@/providers/RootProvider";
import Navbar from "@/components/Navbar";
import {serverFetch} from "@/lib/api/server";
import {API_ENDPOINTS} from "@/lib/config";
import Footer from "@/components/Footer";
import {AnnouncementBar} from "@/components/AnnouncementBar";

const atomicAge = Atomic_Age({
    weight: "400",
    subsets: ["latin"],
    variable: "--font-atomic-age",
    display: "swap",
});

const roboto = Roboto({
    weight: ["300", "400", "500", "700"],
    subsets: ["latin"],
    variable: "--font-roboto",
    display: "swap",
});

const poppins = Poppins({
    weight: ["300", "400", "500", "600", "700"],
    subsets: ["latin"],
    variable: "--font-poppins",
    display: "swap",
});

export async function generateMetadata() {
    let faviconUrl = '/default-fallback.ico';
    let title = 'FOG - Mycology Research & Supplies';
    let description = 'Anonymous crypto e-commerce for mycology research.';
    let keywords = 'mycology, spore microscopy, research genetics, lab supplies, crypto checkout';
    let ogImage = null;

    try {
        const res = await serverFetch(API_ENDPOINTS.website.config, {revalidate: 0});

        const config = res?.data || res;

        if (config) {
            if (config.WEBSITE_FAVICON) {
                faviconUrl = config.WEBSITE_FAVICON;
            }
            if (config.WEBSITE_TITLE) {
                title = config.WEBSITE_TITLE;
            }
            if (config.WEBSITE_META_DESCRIPTION) {
                description = config.WEBSITE_META_DESCRIPTION;
            }
            if (config.WEBSITE_META_KEYWORDS) {
                keywords = config.WEBSITE_META_KEYWORDS;
            }
            if (config.WEBSITE_OG_IMAGE) {
                ogImage = config.WEBSITE_OG_IMAGE;
            }
        }
    } catch (err) {
        console.error('Failed to fetch site config for metadata:', err);
    }

    return {
        title: {
            default: title,
            template: `%s | ${title.split('|')[0].trim() || 'FOG'}`,
        },
        description,
        keywords,
        icons: {
            icon: faviconUrl,
            shortcut: faviconUrl,
            apple: faviconUrl,
        },
        openGraph: {
            title,
            description,
            images: ogImage ? [{url: ogImage}] : [],
        },
    };
}

export default function RootLayout({children}) {

    return (
        <html
            lang="en"
            className={`dark ${roboto.variable} ${poppins.variable} ${atomicAge.variable}`}
            data-theme="dark"
            suppressHydrationWarning
        >
        <body className="min-h-screen font-sans antialiased" suppressHydrationWarning>
        <RootProvider>
            <AppInitializer>
                <AnnouncementBar/>
                <Navbar/>
                <main>
                    {children}
                </main>
                <Footer/>
            </AppInitializer>
        </RootProvider>
        </body>
        </html>
    );
}