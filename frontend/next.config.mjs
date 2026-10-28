/** @type {import('next').NextConfig} */
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
let apiMediaPattern = null;
try {
    const apiUrl = new URL(apiBaseUrl);
    apiMediaPattern = {
        protocol: apiUrl.protocol.slice(0, -1),
        hostname: apiUrl.hostname,
        ...(apiUrl.port ? {port: apiUrl.port} : {}),
        pathname: "/media/**",
    };
} catch {
    // Keep the localhost defaults below if the API URL is unset or invalid.
}

const nextConfig = {
    output: "standalone",
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "placehold.co",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "images.unsplash.com",
                pathname: "/**",
            },
            {
                protocol: "http",
                hostname: "localhost",
                port: "8000",
                pathname: "/media/**",
            },
            {
                protocol: "http",
                hostname: "127.0.0.1",
                port: "8000",
                pathname: "/media/**",
            },
            ...(apiMediaPattern ? [apiMediaPattern] : []),
            {
                protocol: "http",
                hostname: "localhost",
                port: "8000",
                pathname: "/static/**",
            },
        ],
        dangerouslyAllowSVG: true,
        contentDispositionType: "attachment",
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
        // dangerouslyAllowLocalIP:true,
    },
    allowedDevOrigins: ['127.0.0.1', 'localhost'],
    trailingSlash: true,
    async rewrites() {
        const mediaBase = process.env.NEXT_PUBLIC_MEDIA_BASE_URL || "http://127.0.0.1:8000";
        if (!mediaBase) return [];
        return [
            {
                source: "/media/:path*",
                destination: `${mediaBase}/media/:path*`,
            },
        ];
    },
    async headers() {
        return [{
            source: "/:path*",
            headers: [
                {key: "X-Frame-Options", value: "SAMEORIGIN"},
                {key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()"},
            ],
        }];
    }

};

export default nextConfig;