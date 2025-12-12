"use client";

import { useState } from "react";

type FormType = "login" | "register";

type Props = {
  onSubmit: (type: FormType, data: FormData) => void;
};

export default function Login({ onSubmit }: Props) {
  const [activeTab, setActiveTab] = useState<FormType>("login");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit(activeTab, formData);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("login")}
            disabled={activeTab === "login"}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "login"
                ? "bg-accent text-accent-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab("register")}
            disabled={activeTab === "register"}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "register"
                ? "bg-accent text-accent-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            Register
          </button>
        </div>

        {/* Forms Container */}
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{
              transform: activeTab === "login" ? "translateX(0%)" : "translateX(-100%)",
            }}
          >
            {/* Login Form */}
            <div className="w-full flex-shrink-0 p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="block text-sm font-medium text-foreground mb-1">
                    Email
                  </label>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    required
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-sm font-medium text-foreground mb-1">
                    Password
                  </label>
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    required
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                  Login
                </button>
              </form>
            </div>

            {/* Register Form */}
            <div className="w-full flex-shrink-0 p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="register-name" className="block text-sm font-medium text-foreground mb-1">
                    Name
                  </label>
                  <input
                    id="register-name"
                    name="name"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="register-email" className="block text-sm font-medium text-foreground mb-1">
                    Email
                  </label>
                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    required
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="register-password" className="block text-sm font-medium text-foreground mb-1">
                    Password
                  </label>
                  <input
                    id="register-password"
                    name="password"
                    type="password"
                    required
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label htmlFor="register-confirm-password" className="block text-sm font-medium text-foreground mb-1">
                    Confirm Password
                  </label>
                  <input
                    id="register-confirm-password"
                    name="confirmPassword"
                    type="password"
                    required
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                  Register
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}