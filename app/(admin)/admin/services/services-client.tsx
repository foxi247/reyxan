"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createService,
  updateService,
  deleteService,
  toggleService,
} from "@/lib/actions/admin";
import { serviceSchema, type ServiceInput } from "@/lib/validations/admin";
import { toast } from "sonner";

interface Service {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  action_type: string;
  action_value: string | null;
  is_active: boolean;
  sort_order: number;
  estimated_wait_minutes: number;
}

const ICONS = [
  "ConciergeBell", "Headphones", "Utensils", "BookOpen",
  "Bath", "Headset", "Wifi", "Shield", "Phone", "MessageCircle",
];

function ServiceDialog({
  open,
  onClose,
  service,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  service?: Service | null;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } =
    useForm<ServiceInput>({
      resolver: zodResolver(serviceSchema),
      defaultValues: service
        ? {
            title: service.title,
            description: service.description ?? undefined,
            icon: service.icon,
            action_type: service.action_type as ServiceInput["action_type"],
            action_value: service.action_value ?? undefined,
            is_active: service.is_active,
            sort_order: service.sort_order,
            estimated_wait_minutes: service.estimated_wait_minutes ?? 30,
          }
        : { is_active: true, sort_order: 0, action_type: "request" as const, estimated_wait_minutes: 30 },
    });

  const onSubmit = async (data: ServiceInput) => {
    setLoading(true);
    const result = service
      ? await updateService(service.id, data)
      : await createService(data);

    if (result.success) {
      toast.success(service ? "Сервис обновлён" : "Сервис создан");
      onSuccess();
      onClose();
    } else {
      toast.error("Ошибка", { description: result.error });
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{service ? "Редактировать сервис" : "Добавить сервис"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Название</Label>
            <Input placeholder="Вызвать горничную" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Описание</Label>
            <Textarea placeholder="Описание сервиса" {...register("description")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Иконка</Label>
              <Select
                defaultValue={service?.icon ?? "ConciergeBell"}
                onValueChange={(v) => setValue("icon", v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ICONS.map((icon) => (
                    <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Тип действия</Label>
              <Select
                defaultValue={service?.action_type ?? "request"}
                onValueChange={(v) => setValue("action_type", v as ServiceInput["action_type"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="request">Заявка</SelectItem>
                  <SelectItem value="chat">Чат</SelectItem>
                  <SelectItem value="page">Страница</SelectItem>
                  <SelectItem value="link">Ссылка</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>URL / Путь (если page или link)</Label>
            <Input placeholder="/guest/menu" {...register("action_value")} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Порядок</Label>
              <Input type="number" {...register("sort_order", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <Label>Ожидание (мин)</Label>
              <Input type="number" min={1} max={999} {...register("estimated_wait_minutes", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <Label>Активен</Label>
              <div className="flex items-center h-10">
                <Switch
                  defaultChecked={service?.is_active ?? true}
                  onCheckedChange={(v) => setValue("is_active", v)}
                />
              </div>
            </div>
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Сохранить"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ServicesClient({ services }: { services: Service[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить сервис?")) return;
    setDeleting(id);
    const result = await deleteService(id);
    if (result.success) {
      toast.success("Сервис удалён");
      router.refresh();
    } else {
      toast.error("Ошибка", { description: result.error });
    }
    setDeleting(null);
  };

  const handleToggle = async (id: string, current: boolean) => {
    const result = await toggleService(id, !current);
    if (result.success) {
      toast.success(current ? "Сервис отключён" : "Сервис включён");
      router.refresh();
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div />
        <Button onClick={() => { setEditService(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" />
          Добавить сервис
        </Button>
      </div>

      <div className="hotel-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Сервис", "Тип", "Статус", "Порядок", ""].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {services.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground text-sm">
                  Нет сервисов
                </td>
              </tr>
            ) : (
              services.map((svc) => (
                <tr key={svc.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-sm">{svc.title}</div>
                    {svc.description && (
                      <div className="text-xs text-muted-foreground mt-0.5">{svc.description}</div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant="cream">{svc.action_type}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Switch
                      checked={svc.is_active}
                      onCheckedChange={() => handleToggle(svc.id, svc.is_active)}
                    />
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{svc.sort_order}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => { setEditService(svc); setDialogOpen(true); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="text-hotel-red hover:text-hotel-red hover:bg-hotel-red/5"
                        disabled={deleting === svc.id}
                        onClick={() => handleDelete(svc.id)}
                      >
                        {deleting === svc.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ServiceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        service={editService}
        onSuccess={() => router.refresh()}
      />
    </main>
  );
}
