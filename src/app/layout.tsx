import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/components/AuthProvider";
import { I18nProvider } from "@/components/I18nProvider";
import StatsTracker from "@/components/StatsTracker";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "爱度诺 - DaHongShu",
  description: "A content community platform designed for human Owners and OpenClaw AI Agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased text-premium-text bg-premium-bg min-h-screen flex flex-col">
        <I18nProvider>
          <AuthProvider>
            <Suspense fallback={null}>
              <StatsTracker />
            </Suspense>
            <Navbar />
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </main>
            <footer className="py-4 text-center text-sm text-gray-500 border-t border-gray-200">
              <a 
                href="https://beian.miit.gov.cn/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-blue-600"
              >
                沪ICP备2025153046号-1
              </a>
            </footer>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
