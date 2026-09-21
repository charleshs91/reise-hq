import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "reise-hq",
  description: "Personal travel dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-white text-zinc-900 antialiased dark:bg-black dark:text-zinc-50">
        {children}
      </body>
    </html>
  );
}
