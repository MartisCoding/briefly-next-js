"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo } from "react";

type FormType = "login" | "register";

type PasswordStrength = {
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  noForbiddenChars: boolean;
  score: number;
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<FormType>("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);

  // Forbidden characters for SQL injection prevention
  const forbiddenChars = /['"`;\\<>{}[\]]/;

  const validateInput = (value: string): boolean => {
    return !forbiddenChars.test(value);
  };

  const checkPasswordStrength = (password: string): PasswordStrength => {
    const strength: PasswordStrength = {
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
      noForbiddenChars: !forbiddenChars.test(password),
      score: 0,
    };

    // Calculate score
    let score = 0;
    if (strength.hasMinLength) score += 20;
    if (strength.hasUpperCase) score += 20;
    if (strength.hasLowerCase) score += 20;
    if (strength.hasNumber) score += 20;
    if (strength.hasSpecialChar) score += 20;
    if (!strength.noForbiddenChars) score = 0;

    strength.score = score;
    return strength;
  };

  // Calculate password strength using useMemo
  const passwordStrength = useMemo(() => {
    if (!registerPassword) {
      return {
        hasMinLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false,
        noForbiddenChars: true,
        score: 0,
      };
    }
    return checkPasswordStrength(registerPassword);
  }, [registerPassword]);

  // Calculate password match using useMemo
  const passwordMatch = useMemo<boolean | null>(() => {
    if (!confirmPassword) return null;
    return confirmPassword === registerPassword;
  }, [confirmPassword, registerPassword]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const formObject = Object.fromEntries(formData.entries());

    // Validate login form
    if (activeTab === "login") {
      if (!validateInput(loginEmail) || !validateInput(loginPassword)) {
        setIsLoading(false);
        return;
      }
    }

    // Validate register form
    if (activeTab === "register") {
      const email = formData.get("email") as string;
      const name = formData.get("name") as string;
      
      if (!validateInput(email) || !validateInput(name) || !validateInput(registerPassword)) {
        setIsLoading(false);
        return;
      }

      if (passwordStrength.score < 60) {
        setIsLoading(false);
        return;
      }

      if (registerPassword !== confirmPassword) {
        setIsLoading(false);
        return;
      }
    }
    
    try {
      const endpoint = activeTab === "login" ? "/api/login" : "/api/signin";
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formObject),
        credentials: "include",
      });

      const result = await response.json();

      if (response.ok) {
        // Успешный вход/регистрация
        if (result.token) {
          localStorage.setItem("token", result.token);
        }
        
        // Получаем redirect URL из query параметров или используем /lint по умолчанию
        const redirectTo = searchParams.get("redirect") || "/lint";
        router.push(redirectTo);
      } else {
        // Обработка ошибок от сервера
        if (response.status === 401) {
          setError(activeTab === "login" 
            ? "Incorrect email or password" 
            : "Email already exists");
        } else if (response.status === 400) {
          setError(result.error || "Invalid form data");
        } else if (response.status >= 500) {
          setError("Server error occurred. Please try again later");
        } else {
          setError(result.error || "An error occurred");
        }
      }
    } catch (err) {
      console.error(`${activeTab} error:`, err);
      setError("Network error. Please check your connection");
    } finally {
      setIsLoading(false);
    }
  };

  const getStrengthColor = (score: number) => {
    if (score < 40) return "bg-red-500";
    if (score < 60) return "bg-yellow-500";
    if (score < 80) return "bg-blue-500";
    return "bg-green-500";
  };

  const getStrengthText = (score: number) => {
    if (score < 40) return "Weak";
    if (score < 60) return "Fair";
    if (score < 80) return "Good";
    return "Strong";
  };

  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center bg-background p-4">
      <div className="flex gap-4 items-start max-w-5xl w-full">
        {/* Main Login/Register Form */}
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab("login")}
                disabled={activeTab === "login"}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === "login"
                    ? "bg-accent text-accent-foreground border-b-2 border-black"
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
                    ? "bg-accent text-accent-foreground border-b-2 border-black"
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
                        disabled={isLoading}
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 ${
                          loginEmail && !validateInput(loginEmail) ? "border-red-500" : "border-border"
                        }`}
                        placeholder="your@email.com"
                      />
                      {loginEmail && !validateInput(loginEmail) && (
                        <p className="text-xs text-red-500 mt-1">Invalid characters detected</p>
                      )}
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
                        disabled={isLoading}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 ${
                          loginPassword && !validateInput(loginPassword) ? "border-red-500" : "border-border"
                        }`}
                        placeholder="••••••••"
                      />
                      {loginPassword && !validateInput(loginPassword) && (
                        <p className="text-xs text-red-500 mt-1">Invalid characters detected</p>
                      )}
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading || (loginEmail && !validateInput(loginEmail)) || (loginPassword && !validateInput(loginPassword))}
                      className="w-full py-2 px-4 bg-black text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Loading..." : "Login"}
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
                        disabled={isLoading}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
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
                        disabled={isLoading}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
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
                        disabled={isLoading}
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        onFocus={() => setShowPasswordStrength(true)}
                        onBlur={() => setShowPasswordStrength(false)}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
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
                        disabled={isLoading}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 ${
                          passwordMatch === false ? "border-red-500" : "border-border"
                        } ${passwordMatch === true ? "border-green-500" : ""}`}
                        placeholder="••••••••"
                      />
                      {passwordMatch === false && (
                        <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                      )}
                      {passwordMatch === true && (
                        <p className="text-xs text-green-500 mt-1">Passwords match</p>
                      )}
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading || passwordStrength.score < 60 || passwordMatch !== true}
                      className="w-full py-2 px-4 bg-black text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Loading..." : "Register"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Password Strength Sidebar */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            showPasswordStrength && registerPassword && activeTab === "register"
              ? "w-80 opacity-100"
              : "w-0 opacity-0"
          }`}
        >
          <div className="bg-card border border-border rounded-lg shadow-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Password Requirements</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                {passwordStrength.hasMinLength ? (
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
                <span className={passwordStrength.hasMinLength ? "text-green-500" : "text-muted-foreground"}>
                  At least 8 characters
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {passwordStrength.hasUpperCase ? (
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
                <span className={passwordStrength.hasUpperCase ? "text-green-500" : "text-muted-foreground"}>
                  Uppercase letter
                </span>
              </div>

              <div className="flex items-center gap-2">
                {passwordStrength.hasLowerCase ? (
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
                <span className={passwordStrength.hasLowerCase ? "text-green-500" : "text-muted-foreground"}>
                  Lowercase letter
                </span>
              </div>

              <div className="flex items-center gap-2">
                {passwordStrength.hasNumber ? (
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
                <span className={passwordStrength.hasNumber ? "text-green-500" : "text-muted-foreground"}>
                  Number
                </span>
              </div>

              <div className="flex items-center gap-2">
                {passwordStrength.hasSpecialChar ? (
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
                <span className={passwordStrength.hasSpecialChar ? "text-green-500" : "text-muted-foreground"}>
                  Special character
                </span>
              </div>

              <div className="flex items-center gap-2">
                {passwordStrength.noForbiddenChars ? (
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
                <span className={passwordStrength.noForbiddenChars ? "text-green-500" : "text-red-500"}>
                  No forbidden characters
                </span>
              </div>

              {/* Strength Bar */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium">Password Strength:</span>
                  <span className={`text-xs font-medium ${
                    passwordStrength.score < 40 ? "text-red-500" :
                    passwordStrength.score < 60 ? "text-yellow-500" :
                    passwordStrength.score < 80 ? "text-blue-500" :
                    "text-green-500"
                  }`}>
                    {getStrengthText(passwordStrength.score)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength.score)}`}
                    style={{ width: `${passwordStrength.score}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}