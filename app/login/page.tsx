"use client";

import Login from "./components/Login";

export default function LoginPage() {
  const handleSubmit = (type: "login" | "register", data: FormData) => {
    const formObject = Object.fromEntries(data.entries());
    console.log(`${type} form submitted:`, formObject);
    
    // Здесь ваша логика отправки на сервер
    if (type === "login") {
      // API call для логина
    } else {
      // API call для регистрации
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Login onSubmit={handleSubmit} />
    </div>
  );
}