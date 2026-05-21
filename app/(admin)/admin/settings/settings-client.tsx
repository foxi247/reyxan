"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Loader2, QrCode, Copy, Check, AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateHotelSettings,
  resetGuestRequests,
  fullSystemReset,
} from "@/lib/actions/admin";
import { hotelSettingsSchema, type HotelSettingsInput } from "@/lib/validations/admin";
import { toast } from "sonner";
import { HotelLogo } from "@/components/hotel/hotel-logo";
import { useRouter } from "next/navigation";

interface SettingsClientProps {
  settings: HotelSettingsInput | null;
  siteUrl: string;
}

function DangerAction({
  label,
  description,
  confirmWord,
  confirmPlaceholder,
  onConfirm,
  buttonLabel,
}: {
  label: string;
  description: string;
  confirmWord: string;
  confirmPlaceholder: string;
  onConfirm: () => Promise<void>;
  buttonLabel: string;
}) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (value !== confirmWord) return;
    setLoading(true);
    await onConfirm();
    setValue("");
    setLoading(false);
  };

  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-destructive">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        <p className="text-xs text-muted-foreground mt-2">
          Введите <span className="font-mono font-medium text-foreground">{confirmWord}</span> для подтверждения:
        </p>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={confirmPlaceholder}
          className="mt-1.5 max-w-[200px] font-mono text-sm"
        />
      </div>
      <Button
        variant="destructive"
        size="sm"
        disabled={value !== confirmWord || loading}
        onClick={handleClick}
        className="mt-6 flex-shrink-0"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        {buttonLabel}
      </Button>
    </div>
  );
}

export function SettingsClient({ settings, siteUrl }: SettingsClientProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const registerUrl = `${siteUrl || "http://localhost:3000"}/guest/register`;

  const { register, handleSubmit, formState: { errors } } = useForm<HotelSettingsInput>({
    resolver: zodResolver(hotelSettingsSchema),
    defaultValues: settings ?? {
      hotel_name: "Отель Рейхан",
      food_delivery_hours: "07:00–23:00",
    },
  });

  const onSubmit = async (data: HotelSettingsInput) => {
    setLoading(true);
    const result = await updateHotelSettings(data);
    if (result.success) {
      toast.success("Настройки сохранены");
    } else {
      toast.error("Ошибка", { description: result.error });
    }
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(registerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Ссылка скопирована");
  };

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl space-y-6">
        {/* Hotel settings */}
        <div className="hotel-card p-6">
          <h2 className="font-serif text-lg font-medium mb-5">Основные настройки</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Название отеля</Label>
              <Input {...register("hotel_name")} />
              {errors.hotel_name && <p className="text-xs text-destructive">{errors.hotel_name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Телефон ресепшена</Label>
                <Input placeholder="+7 (800) 123-45-67" {...register("reception_phone")} />
              </div>
              <div className="space-y-1.5">
                <Label>Email администратора</Label>
                <Input type="email" placeholder="admin@reyhan.ru" {...register("admin_email")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Wi-Fi сеть</Label>
                <Input placeholder="Reyxan_Hotel" {...register("wifi_name")} />
              </div>
              <div className="space-y-1.5">
                <Label>Wi-Fi пароль</Label>
                <Input placeholder="••••••••" {...register("wifi_password")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Часы доставки еды</Label>
              <Input placeholder="07:00–23:00" {...register("food_delivery_hours")} />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Сохранить настройки
            </Button>
          </form>
        </div>

        {/* QR Code */}
        <div className="hotel-card p-6">
          <h2 className="font-serif text-lg font-medium mb-1">QR-код для регистрации</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Распечатайте QR-код и разместите на ресепшене для регистрации гостей.
          </p>

          <div className="flex items-start gap-6">
            <div className="flex h-40 w-40 flex-shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-background">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <QrCode className="h-12 w-12 opacity-30" />
                <span className="text-xs text-center px-2">QR-код генерируется на сервере</span>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <Label>Ссылка для гостей</Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <Input value={registerUrl} readOnly className="text-xs font-mono" />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={handleCopy}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-hotel-green" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Для генерации QR-кода используйте любой онлайн-генератор или подключите библиотеку qrcode.react.
              </p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="hotel-card p-6 border border-destructive/30">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h2 className="font-serif text-lg font-medium text-destructive">Опасная зона</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            Эти действия необратимы. Введите слово-подтверждение перед выполнением.
          </p>

          <DangerAction
            label="Удалить все заявки на заселение"
            description="Удаляет все записи из журнала заявок (guest_access_requests). Гости и данные не затрагиваются."
            confirmWord="reset"
            confirmPlaceholder="Введите reset"
            buttonLabel="Сбросить заявки"
            onConfirm={async () => {
              const result = await resetGuestRequests();
              if (result.success) {
                toast.success("Журнал заявок очищен");
                router.refresh();
              } else {
                toast.error("Ошибка", { description: result.error });
              }
            }}
          />

          <DangerAction
            label="Полный сброс системы"
            description="Удаляет всех гостей, заявки, заказы, чаты и историю. Меню и сервисы сохраняются."
            confirmWord="FULL RESET"
            confirmPlaceholder="Введите FULL RESET"
            buttonLabel="Полный сброс"
            onConfirm={async () => {
              const result = await fullSystemReset();
              if (result.success) {
                toast.success("Система сброшена", { description: "Все данные гостей удалены" });
                router.refresh();
              } else {
                toast.error("Ошибка", { description: result.error });
              }
            }}
          />
        </div>
      </div>
    </main>
  );
}
