import { Atomic_Age, Roboto, Poppins } from "next/font/google";
import "./globals.css";
import AppInitializer from "@/components/layout/AppInitializer";

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

export const metadata = {
  title: "FOG — Mycology & Secure Research Store",
  description: "Anonymous crypto checkout and mycology supplies.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`dark ${roboto.variable} ${poppins.variable} ${atomicAge.variable}`}
      data-theme="dark"
      suppressHydrationWarning
    >
      <body className="min-h-screen font-sans antialiased ">
        <AppInitializer>{children}</AppInitializer>
      </body>
    </html>
  );
}