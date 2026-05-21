"use client";

import { useState } from "react";
import {
  CalendarCheck, CalendarX, User, Phone, Mail, BedDouble, Send, Loader2, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface FormData {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  check_in: string;
  check_out: string;
  room_preference: string;
  notes: string;
}

const EMPTY: FormData = {
  first_name: "", last_name: "", phone: "", email: "",
  check_in: "", check_out: "", room_preference: "", notes: "",
};

export default function BookingPage() {
  const [form, setForm] = useState<FormData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.first_name || !form.last_name || !form.phone || !form.check_in || !form.check_out) {
      setError("Пожалуйста, заполните все обязательные поля");
      return;
    }
    if (new Date(form.check_out) <= new Date(form.check_in)) {
      setError("Дата выезда должна быть позже даты заезда");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/public/pre-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error ?? "Произошла ошибка");
      }
    } catch {
      setError("Произошла ошибка при отправке");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <CheckCircle2 className="h-16 w-16 text-hotel-green mx-auto" />
          <div>
            <h1 className="font-serif text-2xl font-medium mb-2">Заявка принята!</h1>
            <p className="text-muted-foreground text-sm">
              Спасибо, {form.first_name}! Мы свяжемся с вами по номеру {form.phone} для подтверждения бронирования.
            </p>
          </div>
          <a
            href="/"
            className="block w-full py-3 rounded-2xl bg-gold/10 text-gold font-medium text-sm hover:bg-gold/20 transition-colors"
          >
            На главную
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="font-serif text-xl font-medium">Hotel Reyhan</h1>
          <p className="text-xs text-muted-foreground">Онлайн-бронирование</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-6 space-y-4">
        <div className="hotel-card p-5 space-y-4">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
            Личные данные
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Имя <span className="text-hotel-red">*</span></label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={form.first_name}
                  onChange={set("first_name")}
                  placeholder="Иван"
                  className="pl-9 h-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Фамилия <span className="text-hotel-red">*</span></label>
              <Input
                value={form.last_name}
                onChange={set("last_name")}
                placeholder="Иванов"
                className="h-10"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Телефон <span className="text-hotel-red">*</span></label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={form.phone}
                onChange={set("phone")}
                placeholder="+7 (999) 000-00-00"
                type="tel"
                className="pl-9 h-10"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Email <span className="text-muted-foreground font-normal">(необязательно)</span></label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={form.email}
                onChange={set("email")}
                placeholder="ivan@example.com"
                type="email"
                className="pl-9 h-10"
              />
            </div>
          </div>
        </div>

        <div className="hotel-card p-5 space-y-4">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
            Даты пребывания
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium flex items-center gap-1.5">
                <CalendarCheck className="h-3.5 w-3.5" /> Заезд <span className="text-hotel-red">*</span>
              </label>
              <Input
                value={form.check_in}
                onChange={set("check_in")}
                type="date"
                className="h-10"
                min={new Date().toISOString().slice(0, 10)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium flex items-center gap-1.5">
                <CalendarX className="h-3.5 w-3.5" /> Выезд <span className="text-hotel-red">*</span>
              </label>
              <Input
                value={form.check_out}
                onChange={set("check_out")}
                type="date"
                className="h-10"
                min={form.check_in || new Date().toISOString().slice(0, 10)}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium flex items-center gap-1.5">
              <BedDouble className="h-3.5 w-3.5" /> Пожелания по номеру
            </label>
            <Input
              value={form.room_preference}
              onChange={set("room_preference")}
              placeholder="Двухместный, тихий, вид на горы…"
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Дополнительные пожелания</label>
            <Textarea
              value={form.notes}
              onChange={set("notes")}
              placeholder="Поздний заезд, детская кроватка, аллергия…"
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-hotel-red text-center">{error}</p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 gold-gradient text-white border-0 rounded-2xl text-sm font-medium gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <><Send className="h-4 w-4" /> Отправить заявку</>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          После отправки мы свяжемся с вами для подтверждения
        </p>
      </form>
    </div>
  );
}
