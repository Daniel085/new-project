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
      <body className="antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}