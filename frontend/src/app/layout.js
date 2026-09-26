import './globals.css';
import AppInitializer from '@/components/layout/AppInitializer';
import {Atomic_Age, Roboto, Poppins} from "next/dist/compiled/@next/font/dist/google";


export const metadata = {
    title: 'FOG | Storefront & Mycology Research',
    description: 'Premium mycology research, spores, and supplies with anonymous checkout.',
};

export default function RootLayout({children}) {
    return (
        <html lang="en">
        <body
            className="min-h-screen bg-[#000000] text-[#FFFFFF] antialiased selection:bg-[#0C6E99] selection:text-[#FFFFFF]">
        <AppInitializer>{children}</AppInitializer>
        </body>
        </html>
    );
}