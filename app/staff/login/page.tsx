"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HotelLogo } from "@/components/hotel/hotel-logo";

export default function StaffLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.role === "cleaner") router.push("/staff/housekeeping");
        else if (data.role === "kitchen") router.push("/staff/kitchen");
        else router.push("/staff/housekeeping");
      } else {
        setError(data.error ?? "Ошибка входа");
      }
    } catch {
      setError("Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <HotelLogo size="md" className="justify-center mb-4" />
          <h1 className="font-serif text-2xl font-medium">Вход для персонала</h1>
          <p className="text-sm text-muted-foreground mt-1">Войдите в свой рабочий аккаунт</p>
        </div>

        <form onSubmit={handleSubmit} className="hotel-card p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Логин</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ваш логин"
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Пароль</label>
            <div className="relative">
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-hotel-red">{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full gold-gradient text-white border-0 gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><LogIn className="h-4 w-4" /> Войти</>}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Аккаунты создаются администратором
        </p>
      </div>
    </div>
  );
}
