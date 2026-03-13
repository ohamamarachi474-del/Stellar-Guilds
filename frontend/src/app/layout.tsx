import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Stellar Guilds",
    description: "User Profile & Reputation Dashboard",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
