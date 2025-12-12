"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  userName?: string;
  onLogout?: () => void;
};

export default function Navbar({ userName, onLogout }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: "Changelog", href: "#" },
    { label: "Feedback", href: "#" },
  ];

  return (
    <nav className="w-full border-b border-border bg-card sticky top-0 z-50">
      <div className="container mx-auto px-1 py-1">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            href="/" 
            className="text-xl font-extrabold text-foreground hover:opacity-80 transition-opacity"
          >
            BRIEF.LY
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <div className="flex items-center gap-6">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors font-bold"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Auth Section */}
            {userName ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">
                  {userName}
                </span>
                <button 
                  onClick={onLogout}
                  className="px-4 py-2 text-sm font-medium bg-muted text-muted-foreground rounded-lg hover:bg-accent hover:text-foreground transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link 
                href="/login"
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-foreground"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 space-y-3">
            {navItems.map((item) => (
              <button
                key={item.label}
                className="block w-full text-left px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
              >
                {item.label}
              </button>
            ))}
            
            {/* Mobile Auth Section */}
            {userName ? (
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="px-4 py-2 text-sm font-medium text-foreground">
                  {userName}
                </div>
                <button 
                  onClick={onLogout}
                  className="w-full px-4 py-2 text-sm font-medium bg-muted text-muted-foreground rounded-lg hover:bg-accent hover:text-foreground transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link 
                href="/login"
                className="block w-full px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-center"
              >
                Login
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}