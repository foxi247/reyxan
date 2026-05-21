"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { HotelLogo } from "@/components/hotel/hotel-logo";
import { ThemeToggle } from "@/components/hotel/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ROUTES } from "@/lib/constants";

const loginSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error("Ошибка входа", {
          description: "Проверьте данные и попробуйте снова",
        });
        return;
      }

      // Verify admin role
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!profile || (profile as { role?: string }).role !== "admin") {
          await supabase.auth.signOut();
          toast.error("Нет доступа", { description: "Вы не являетесь администратором" });
          return;
        }
      }

      router.push(ROUTES.admin.home);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background hotel-bg-pattern flex items-center justify-center p-4">
      {/* Theme toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Card */}
      <div className="w-full max-w-md">
        <div className="hotel-card p-8">
          {/* Logo */}
          <div className="flex flex-col items-center gap-6 mb-8">
            <HotelLogo size="lg" />
            <div className="text-center">
              <h1 className="font-serif text-2xl font-medium">Вход в систему</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Панель управления отелем
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@reyhan.ru"
                  className="pl-11"
                  autoComplete="email"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-11 pr-11"
                  autoComplete="current-password"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Войти"
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Только для сотрудников отеля «Рейхан»
          </p>
        </div>
      </div>
    </div>
  );
}
