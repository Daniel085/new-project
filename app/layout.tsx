import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Family Meal Planner",
  description: "Generate weekly meal plans and shop on Walmart",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gradient-to-br from-orange-50 via-white to-green-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}