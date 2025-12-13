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
      const token = localStorage.getItem("token");
      
      // Если нет токена и страница не публичная - редирект на логин
      if (!token) {
        if (!isPublicPage) {
          router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        }
        setIsLoading(false);
        return;
      }

      // Если есть токен - проверяем его валидность
      try {
        const response = await fetch("/api/verify", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          // Проверяем что получили имя пользователя
          if (data.username) {
            setUserName(data.username);
          } else {
            // Токен валиден, но нет имени - очищаем токен
            localStorage.removeItem("token");
            if (!isPublicPage) {
              router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
            }
          }
        } else {
          // Токен невалиден - очищаем и редиректим
          localStorage.removeItem("token");
          if (!isPublicPage) {
            router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        // Ошибка при проверке - очищаем токен
        localStorage.removeItem("token");
        if (!isPublicPage) {
          router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, isPublicPage, router]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch("/api/logout", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      // Всегда очищаем токен и редиректим
      localStorage.removeItem("token");
      setUserName(undefined);
      
      // Если текущая страница не публичная - редирект на логин с сохранением пути
      // Если публичная - остаемся на текущей странице
      if (!isPublicPage) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      } else {
        router.push("/login");
      }
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