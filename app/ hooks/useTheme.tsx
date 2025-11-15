import { use, useEffect, useState } from "react";

export type Theme = "light" | "dark";

function getInitialTheme(): Theme {
    if (typeof window === "undefined") return "light";

    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme) return savedTheme;

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
}

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(getInitialTheme());

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, []);

    const applyTheme = (theme: Theme) => {
        setTheme(theme);
    };

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        applyTheme(newTheme);
        localStorage.setItem("theme", newTheme);
    };

    return { theme, toggleTheme };
}