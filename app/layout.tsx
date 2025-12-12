"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  // Публичные страницы, не требующие авторизации
  const publicPages = ["/", "/login"];
  const isPublicPage = publicPages.includes(pathname);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/verify", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.token && data.userName) {
            setUserName(data.userName);
            // Сохраняем токен в localStorage
            localStorage.setItem("token", data.token);
          } else {
            // Токен не пришел
            if (!isPublicPage) {
              router.push("/login");
            }
          }
        } else {
          // Ошибка авторизации
          if (!isPublicPage) {
            router.push("/login");
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        if (!isPublicPage) {
          router.push("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, isPublicPage, router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      localStorage.removeItem("token");
      setUserName(undefined);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Показываем загрузку только для защищенных страниц
  if (isLoading && !isPublicPage) {
    return (
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Navbar userName={userName} onLogout={handleLogout} />
        {children}
      </body>
    </html>
  );
}