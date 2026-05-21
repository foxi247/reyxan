"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash, Loader2, UserCheck, ChefHat, Sparkles, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createStaffMember, updateStaffMember, deleteStaffMember } from "@/lib/actions/admin";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StaffMember {
  id: string;
  name: string;
  role: "cleaner" | "kitchen";
  username: string;
  is_active: boolean;
  created_at: string;
}

const ROLE_CONFIG = {
  cleaner: { label: "Уборщица", Icon: Sparkles, color: "text-blue-500" },
  kitchen: { label: "Кухня", Icon: ChefHat, color: "text-amber-500" },
};

function StaffDialog({
  open, onClose, member, onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  member?: StaffMember | null;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(member?.name ?? "");
  const [username, setUsername] = useState(member?.username ?? "");
  const [role, setRole] = useState<"cleaner" | "kitchen">(member?.role ?? "cleaner");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) { toast.error("Заполните все поля"); return; }
    if (!member && !password) { toast.error("Введите пароль"); return; }

    setLoading(true);
    let result;
    if (member) {
      result = await updateStaffMember(member.id, { name: name.trim(), password: password || undefined });
    } else {
      result = await createStaffMember({ name: name.trim(), role, username: username.trim(), password });
    }

    if (result.success) {
      toast.success(member ? "Сотрудник обновлён" : "Аккаунт создан");
      onSuccess();
      onClose();
    } else {
      toast.error("Ошибка", { description: result.error });
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{member ? "Редактировать" : "Добавить сотрудника"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Имя *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Настя Иванова" required />
          </div>
          {!member && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Логин *</label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="nastya" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Роль *</label>
                <Select value={role} onValueChange={(v) => setRole(v as "cleaner" | "kitchen")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cleaner">Уборщица</SelectItem>
                    <SelectItem value="kitchen">Кухня</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{member ? "Новый пароль (необязательно)" : "Пароль *"}</label>
            <div className="relative">
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPass ? "text" : "password"}
                placeholder="Минимум 6 символов"
                minLength={member ? 0 : 6}
                className="pr-10"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Отмена</Button>
            <Button type="submit" disabled={loading} className="gold-gradient text-white border-0">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : member ? "Сохранить" : "Создать"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function StaffManagementClient({ staff }: { staff: StaffMember[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMember, setEditMember] = useState<StaffMember | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const refresh = () => router.refresh();

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить сотрудника?")) return;
    setDeleting(id);
    const result = await deleteStaffMember(id);
    if (result.success) { toast.success("Сотрудник удалён"); refresh(); }
    else toast.error("Ошибка", { description: result.error });
    setDeleting(null);
  };

  const handleToggle = async (id: string, current: boolean) => {
    setToggling(id);
    const result = await updateStaffMember(id, { is_active: !current });
    if (result.success) refresh();
    else toast.error("Ошибка", { description: result.error });
    setToggling(null);
  };

  const cleaners = staff.filter((s) => s.role === "cleaner");
  const kitchen = staff.filter((s) => s.role === "kitchen");

  const Section = ({ title, members, Icon }: { title: string; members: StaffMember[]; Icon: React.ElementType }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
        <Icon className="h-4 w-4" />
        {title} ({members.length})
      </div>
      {members.length === 0 ? (
        <div className="hotel-card p-6 text-center text-sm text-muted-foreground">Нет сотрудников</div>
      ) : (
        <div className="hotel-card overflow-hidden divide-y divide-border">
          {members.map((m) => {
            const cfg = ROLE_CONFIG[m.role];
            return (
              <div key={m.id} className={cn("flex items-center gap-3 px-5 py-4", !m.is_active && "opacity-50")}>
                <div className={cn("flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-secondary", cfg.color)}>
                  <UserCheck className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{m.name}</div>
                  <div className="text-xs text-muted-foreground">@{m.username}</div>
                </div>
                <div className="flex items-center gap-2">
                  {toggling === m.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Switch checked={m.is_active} onCheckedChange={() => handleToggle(m.id, m.is_active)} />
                  )}
                  <Button size="icon-sm" variant="ghost" onClick={() => { setEditMember(m); setDialogOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon-sm" variant="ghost"
                    className="text-hotel-red hover:text-hotel-red"
                    disabled={deleting === m.id}
                    onClick={() => handleDelete(m.id)}
                  >
                    {deleting === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <main className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            Сотрудники входят через{" "}
            <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">/staff/login</code>
          </p>
        </div>
        <Button
          onClick={() => { setEditMember(null); setDialogOpen(true); }}
          className="gold-gradient text-white border-0 gap-2"
        >
          <Plus className="h-4 w-4" /> Добавить
        </Button>
      </div>

      <Section title="Уборщицы" members={cleaners} Icon={Sparkles} />
      <Section title="Кухня" members={kitchen} Icon={ChefHat} />

      <StaffDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        member={editMember}
        onSuccess={refresh}
      />
    </main>
  );
}
