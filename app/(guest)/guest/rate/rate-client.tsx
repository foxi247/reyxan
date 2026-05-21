"use client";

import { useState } from "react";
import { Star, Send, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Props {
  firstName: string;
  roomNumber: string;
  checkOut: string;
  hasRated: boolean;
}

export function RateClient({ firstName, roomNumber, checkOut, hasRated }: Props) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(hasRated);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!rating) { setError("Пожалуйста, выберите оценку"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/guest/submit-rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error ?? "Произошла ошибка");
      }
    } catch {
      setError("Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  const LABELS = ["", "Плохо", "Удовлетворительно", "Хорошо", "Отлично", "Превосходно"];

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <CheckCircle2 className="h-16 w-16 text-hotel-green mx-auto" />
          <div>
            <h1 className="font-serif text-2xl font-medium mb-2">Спасибо, {firstName}!</h1>
            <p className="text-muted-foreground text-sm">
              Ваш отзыв поможет нам стать лучше. Ждём вас снова в Hotel Reyhan!
            </p>
          </div>
          <a
            href="/guest"
            className="block w-full py-3 rounded-2xl bg-gold/10 text-gold font-medium text-sm hover:bg-gold/20 transition-colors"
          >
            На главную
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-sm w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-serif text-2xl font-medium">Оцените ваше пребывание</h1>
          <p className="text-muted-foreground text-sm mt-2">
            {firstName}, комната {roomNumber} · выезд{" "}
            {new Date(checkOut).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
          </p>
        </div>

        {/* Stars */}
        <div className="hotel-card p-6">
          <div className="flex justify-center gap-3 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                className="transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  className={cn(
                    "h-10 w-10 transition-colors",
                    star <= (hovered || rating)
                      ? "fill-gold text-gold"
                      : "text-muted-foreground/30"
                  )}
                />
              </button>
            ))}
          </div>
          {(hovered || rating) > 0 && (
            <p className="text-center text-sm font-medium text-gold">
              {LABELS[hovered || rating]}
            </p>
          )}
        </div>

        {/* Comment */}
        <div className="hotel-card p-4">
          <label className="text-sm font-medium text-foreground/80 mb-2 block">
            Комментарий <span className="text-muted-foreground font-normal">(необязательно)</span>
          </label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Что вам понравилось? Что можно улучшить?"
            rows={4}
            maxLength={1000}
            className="resize-none"
          />
          <div className="text-right text-xs text-muted-foreground mt-1">
            {comment.length}/1000
          </div>
        </div>

        {error && (
          <p className="text-sm text-hotel-red text-center">{error}</p>
        )}

        <Button
          onClick={handleSubmit}
          disabled={loading || !rating}
          className="w-full h-12 gold-gradient text-white border-0 rounded-2xl text-sm font-medium gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <><Send className="h-4 w-4" /> Отправить отзыв</>
          )}
        </Button>
      </div>
    </div>
  );
}
