"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BedDouble, Sparkles, Wrench, CheckCircle2, Clock, Loader2, AlertCircle,
  Plus, Pencil, Trash2, X, Upload, Tv2, LogIn, LogOut, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  updateRoomStatus, scheduleRoomCleaning,
  createRoom, updateRoom, deleteRoom,
} from "@/lib/actions/admin";
import { checkInRoom, checkOutRoom } from "@/lib/actions/stays";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type RoomStatus = "available" | "occupied" | "maintenance";

interface Room {
  id: string;
  number: string;
  floor: number | null;
  status: RoomStatus;
  description: string | null;
  amenities: string | null;
  photo_url: string | null;
}

interface StayInfo {
  stayId: string;
  tvState: string;
  checkOut: string;
  primaryGuest: string | null;
}

interface Props {
  rooms: Room[];
  guestMap: Record<string, { name: string; checkOut: string; guestId: string }>;
  cleaningMap: Record<string, string>;
  stayMap: Record<string, StayInfo>;
}

const ROOM_COLORS: Record<RoomStatus, string> = {
  available: "border-hotel-green/50 bg-hotel-green/5",
  occupied: "border-gold/50 bg-gold/5",
  maintenance: "border-hotel-red/30 bg-hotel-red/5",
};

const CLEAN_ICON: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3.5 w-3.5 text-amber-500" />,
  in_progress: <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />,
  done: <CheckCircle2 className="h-3.5 w-3.5 text-hotel-green" />,
  skipped: <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />,
};

const TV_STATE_LABELS: Record<string, { label: string; color: string }> = {
  welcome: { label: "Приветствие", color: "text-amber-400" },
  intro_video: { label: "Видео", color: "text-blue-400" },
  guest_panel: { label: "Панель гостя", color: "text-hotel-green" },
  checkout_message: { label: "Выселение", color: "text-orange-400" },
  session_closing: { label: "Завершение", color: "text-muted-foreground" },
  idle: { label: "Ожидание", color: "text-muted-foreground" },
};

const STATUS_OPTIONS: { value: RoomStatus; label: string }[] = [
  { value: "available", label: "Свободен" },
  { value: "occupied", label: "Занят" },
  { value: "maintenance", label: "Обслуживание" },
];

const emptyForm = {
  number: "",
  floor: "",
  description: "",
  amenities: "",
  photo_url: "",
};

const emptyGuest = { firstName: "", lastName: "", phone: "" };

// ---------------------------------------------------------------------------
// RoomCard
// ---------------------------------------------------------------------------
function RoomCard({
  room, guest, cleanStatus, stay,
  onEdit, onDelete, onCheckIn, onCheckOut,
}: {
  room: Room;
  guest?: { name: string; checkOut: string };
  cleanStatus?: string;
  stay?: StayInfo;
  onEdit: (room: Room) => void;
  onDelete: (room: Room) => void;
  onCheckIn: (room: Room) => void;
  onCheckOut: (stayId: string, roomNumber: string) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (status: RoomStatus) => {
    setLoading(true);
    const result = await updateRoomStatus(room.id, status);
    if (result.success) router.refresh();
    else toast.error("Ошибка", { description: result.error });
    setLoading(false);
  };

  const handleScheduleCleaning = async () => {
    setLoading(true);
    const result = await scheduleRoomCleaning(room.id);
    if (result.success) { toast.success("Уборка запланирована"); router.refresh(); }
    else toast.error("Ошибка", { description: result.error });
    setLoading(false);
  };

  const tvStateInfo = stay ? TV_STATE_LABELS[stay.tvState] : null;

  return (
    <div className={cn("rounded-2xl border-2 flex flex-col gap-3 transition-colors overflow-hidden", ROOM_COLORS[room.status])}>
      {/* Photo */}
      {room.photo_url && (
        <div
          className="h-28 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${room.photo_url})` }}
        >
          <div className="absolute inset-0 bg-black/25" />
        </div>
      )}

      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BedDouble className="h-4 w-4 text-muted-foreground" />
              <span className="font-serif text-2xl font-medium">{room.number}</span>
            </div>
            {room.floor && (
              <span className="text-xs text-muted-foreground">{room.floor} этаж</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {cleanStatus && CLEAN_ICON[cleanStatus]}
            {room.status === "available" && <Badge variant="success" className="text-[10px]">Свободен</Badge>}
            {room.status === "occupied" && <Badge variant="gold" className="text-[10px]">Занят</Badge>}
            {room.status === "maintenance" && <Badge variant="destructive" className="text-[10px]">Сервис</Badge>}
            <button
              onClick={() => onEdit(room)}
              className="ml-1 p-1 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Редактировать"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(room)}
              className="p-1 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Удалить"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {room.amenities && (
          <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
            {room.amenities}
          </p>
        )}

        {/* Stay info */}
        {stay && (
          <div className="text-xs bg-background/60 rounded-xl px-3 py-2 space-y-1">
            {stay.primaryGuest && (
              <div className="font-medium text-foreground/80">{stay.primaryGuest}</div>
            )}
            <div className="text-muted-foreground">
              Выезд: {new Date(stay.checkOut).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
            </div>
            {tvStateInfo && (
              <div className={cn("flex items-center gap-1.5 text-[10px] font-medium", tvStateInfo.color)}>
                <Tv2 className="h-3 w-3" />
                ТВ: {tvStateInfo.label}
              </div>
            )}
          </div>
        )}

        {/* Legacy guest info (when no stay but guest exists) */}
        {!stay && guest && (
          <div className="text-xs font-medium text-foreground/80 bg-background/60 rounded-xl px-3 py-2">
            <div>{guest.name}</div>
            <div className="text-muted-foreground mt-0.5">
              Выезд: {new Date(guest.checkOut).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
            </div>
          </div>
        )}

        {/* Status + action buttons */}
        <div className="flex gap-2 mt-auto flex-wrap">
          <Select
            value={room.status}
            onValueChange={(v) => handleStatusChange(v as RoomStatus)}
            disabled={loading}
          >
            <SelectTrigger className="h-7 text-xs rounded-xl flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!cleanStatus && room.status !== "available" && (
            <Button
              size="icon-sm"
              variant="outline"
              className="h-7 w-7 rounded-xl flex-shrink-0"
              disabled={loading}
              onClick={handleScheduleCleaning}
              title="Запланировать уборку"
            >
              <Sparkles className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* TV action buttons */}
        <div className="flex gap-2 flex-wrap">
          {!stay && room.status === "occupied" && (
            <Button
              size="sm"
              variant="cream"
              className="h-7 text-xs gap-1 flex-1"
              onClick={() => onCheckIn(room)}
            >
              <LogIn className="h-3 w-3" />
              Заселить
            </Button>
          )}
          {!stay && room.status === "available" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 flex-1"
              onClick={() => onCheckIn(room)}
            >
              <LogIn className="h-3 w-3" />
              Заселить
            </Button>
          )}
          {stay && stay.tvState !== "checkout_message" && stay.tvState !== "session_closing" && (
            <>
              <a
                href={`/tv/room/${room.number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 h-7 px-2.5 text-xs rounded-xl border border-border bg-background hover:bg-secondary transition-colors"
              >
                <Tv2 className="h-3 w-3" />
                TV
              </a>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 text-xs gap-1 flex-1"
                onClick={() => onCheckOut(stay.stayId, room.number)}
              >
                <LogOut className="h-3 w-3" />
                Выселить
              </Button>
            </>
          )}
          {stay && (stay.tvState === "checkout_message" || stay.tvState === "session_closing") && (
            <div className="text-xs text-muted-foreground bg-secondary rounded-xl px-3 py-1.5 w-full text-center">
              Выселение в процессе…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CheckIn Dialog
// ---------------------------------------------------------------------------
function CheckInDialog({
  room,
  open,
  onClose,
  onSuccess,
}: {
  room: Room | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [guests, setGuests] = useState([{ ...emptyGuest }]);
  const [checkOut, setCheckOut] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const addGuest = () => {
    if (guests.length < 4) setGuests((g) => [...g, { ...emptyGuest }]);
  };
  const removeGuest = (i: number) => setGuests((g) => g.filter((_, idx) => idx !== i));
  const updateGuest = (i: number, field: keyof typeof emptyGuest, val: string) => {
    setGuests((g) => g.map((gst, idx) => idx === i ? { ...gst, [field]: val } : gst));
  };

  const handleSave = async () => {
    if (!room) return;
    if (!checkOut) { setError("Укажите дату выезда"); return; }
    if (!guests[0].firstName || !guests[0].lastName) {
      setError("Укажите имя и фамилию основного гостя");
      return;
    }
    setSaving(true);
    setError(null);

    const result = await checkInRoom({
      roomId: room.id,
      checkOutDate: checkOut,
      guests: guests
        .filter((g) => g.firstName || g.lastName)
        .map((g, i) => ({
          firstName: g.firstName,
          lastName: g.lastName,
          phone: g.phone || undefined,
          isPrimary: i === 0,
        })),
    });

    if (result.success) {
      toast.success("Гость заселён");
      onSuccess();
      onClose();
    } else {
      setError(result.error ?? "Ошибка заселения");
    }
    setSaving(false);
  };

  const handleClose = () => {
    setGuests([{ ...emptyGuest }]);
    setCheckOut("");
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogIn className="h-4 w-4" />
            Заселение · Номер {room?.number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Check-out date */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Дата выезда <span className="text-red-500">*</span></label>
            <Input
              type="date"
              min={today}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>

          {/* Guests */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Гости</label>
              {guests.length < 4 && (
                <button
                  type="button"
                  onClick={addGuest}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Добавить гостя
                </button>
              )}
            </div>
            {guests.map((g, i) => (
              <div key={i} className="bg-secondary/50 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {i === 0 ? "Основной гость" : `Гость ${i + 1}`}
                  </div>
                  {i > 0 && (
                    <button onClick={() => removeGuest(i)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Имя *"
                    value={g.firstName}
                    onChange={(e) => updateGuest(i, "firstName", e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Фамилия *"
                    value={g.lastName}
                    onChange={(e) => updateGuest(i, "lastName", e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <Input
                  placeholder="Телефон (необязательно)"
                  value={g.phone}
                  onChange={(e) => updateGuest(i, "phone", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            ))}
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={saving}>Отмена</Button>
          <Button onClick={handleSave} disabled={saving} className="gold-gradient text-white border-0">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><LogIn className="h-4 w-4" /> Заселить</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// RoomsClient
// ---------------------------------------------------------------------------
export function RoomsClient({ rooms: initialRooms, guestMap, cleaningMap, stayMap }: Props) {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>(initialRooms);

  // ---- Add / Edit dialog ----
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ---- Delete dialog ----
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ---- Check-in dialog ----
  const [checkInRoom_, setCheckInRoom] = useState<Room | null>(null);

  // ---- Stats ----
  const stats = {
    available: rooms.filter((r) => r.status === "available").length,
    occupied: rooms.filter((r) => r.status === "occupied").length,
    maintenance: rooms.filter((r) => r.status === "maintenance").length,
    cleaning: Object.values(cleaningMap).filter((s) => s !== "done").length,
  };

  const byFloor = rooms.reduce<Record<string, Room[]>>((acc, r) => {
    const key = r.floor ? `${r.floor} этаж` : "Без этажа";
    (acc[key] ??= []).push(r);
    return acc;
  }, {});

  // ---- Open Add ----
  const openAddDialog = () => {
    setEditingRoom(null);
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  };

  // ---- Open Edit ----
  const openEditDialog = (room: Room) => {
    setEditingRoom(room);
    setForm({
      number: room.number,
      floor: room.floor !== null ? String(room.floor) : "",
      description: room.description ?? "",
      amenities: room.amenities ?? "",
      photo_url: room.photo_url ?? "",
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingRoom(null);
    setForm(emptyForm);
    setFormError(null);
  };

  // ---- File upload ----
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setFormError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "rooms");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Ошибка загрузки файла");
      const data = await res.json();
      setForm((prev) => ({ ...prev, photo_url: data.url }));
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Ошибка загрузки файла");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // ---- Save (create / update) ----
  const handleSave = async () => {
    if (!form.number.trim()) {
      setFormError("Номер комнаты обязателен");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        number: form.number.trim(),
        floor: form.floor !== "" ? Number(form.floor) : null,
        description: form.description.trim() || undefined,
        amenities: form.amenities.trim() || undefined,
        photo_url: form.photo_url.trim() || undefined,
      };

      if (editingRoom) {
        const result = await updateRoom(editingRoom.id, payload);
        if (!result.success) { setFormError(result.error ?? "Ошибка"); return; }
        setRooms((prev) =>
          prev.map((r) =>
            r.id === editingRoom.id
              ? {
                  ...r,
                  number: payload.number,
                  floor: payload.floor,
                  description: payload.description ?? null,
                  amenities: payload.amenities ?? null,
                  photo_url: payload.photo_url ?? null,
                }
              : r
          )
        );
        toast.success("Номер обновлён");
      } else {
        const result = await createRoom(payload);
        if (!result.success) { setFormError(result.error ?? "Ошибка"); return; }
        closeDialog();
        window.location.reload();
        return;
      }
      closeDialog();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setSaving(false);
    }
  };

  // ---- Open / confirm delete ----
  const openDeleteDialog = (room: Room) => {
    setDeletingRoom(room);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletingRoom(null);
  };

  const handleDelete = async () => {
    if (!deletingRoom) return;
    setDeleting(true);
    try {
      await deleteRoom(deletingRoom.id);
      setRooms((prev) => prev.filter((r) => r.id !== deletingRoom.id));
      toast.success("Номер удалён");
      closeDeleteDialog();
    } catch (err: unknown) {
      toast.error("Ошибка", { description: err instanceof Error ? err.message : "Не удалось удалить" });
    } finally {
      setDeleting(false);
    }
  };

  // ---- Check-out ----
  const handleCheckOut = async (stayId: string, roomNumber: string) => {
    const result = await checkOutRoom(stayId);
    if (result.success) {
      toast.success(`Выселение номера ${roomNumber} начато`);
      router.refresh();
    } else {
      toast.error("Ошибка", { description: result.error });
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="hotel-card px-4 py-3 flex items-center gap-2.5">
            <div className="h-3 w-3 rounded-full bg-hotel-green" />
            <span className="text-sm font-medium">{stats.available} свободных</span>
          </div>
          <div className="hotel-card px-4 py-3 flex items-center gap-2.5">
            <div className="h-3 w-3 rounded-full bg-gold" />
            <span className="text-sm font-medium">{stats.occupied} занятых</span>
          </div>
          <div className="hotel-card px-4 py-3 flex items-center gap-2.5">
            <div className="h-3 w-3 rounded-full bg-hotel-red" />
            <span className="text-sm font-medium">{stats.maintenance} на обслуживании</span>
          </div>
          <div className="hotel-card px-4 py-3 flex items-center gap-2.5">
            <Clock className="h-3 w-3 text-amber-500" />
            <span className="text-sm font-medium">{stats.cleaning} требуют уборки</span>
          </div>
        </div>
        <Button onClick={openAddDialog} className="flex items-center gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Добавить номер
        </Button>
      </div>

      {/* Room grid by floor */}
      {Object.entries(byFloor)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([floor, floorRooms]) => (
          <div key={floor} className="mb-8">
            <h2 className="font-serif text-base font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Wrench className="h-3.5 w-3.5 opacity-50" />
              {floor}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {floorRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  guest={guestMap[room.id]}
                  cleanStatus={cleaningMap[room.id]}
                  stay={stayMap[room.id]}
                  onEdit={openEditDialog}
                  onDelete={openDeleteDialog}
                  onCheckIn={setCheckInRoom}
                  onCheckOut={handleCheckOut}
                />
              ))}
            </div>
          </div>
        ))}

      {/* ---------------------------------------------------------------------- */}
      {/* Check-in dialog                                                          */}
      {/* ---------------------------------------------------------------------- */}
      <CheckInDialog
        room={checkInRoom_}
        open={!!checkInRoom_}
        onClose={() => setCheckInRoom(null)}
        onSuccess={() => router.refresh()}
      />

      {/* ---------------------------------------------------------------------- */}
      {/* Add / Edit Dialog                                                        */}
      {/* ---------------------------------------------------------------------- */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-6">
              {editingRoom ? "Редактировать номер" : "Добавить номер"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Номер комнаты <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                placeholder="101"
                value={form.number}
                onChange={(e) => setForm((p) => ({ ...p, number: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Этаж</label>
              <Input
                type="number"
                placeholder="1"
                value={form.floor}
                onChange={(e) => setForm((p) => ({ ...p, floor: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Описание</label>
              <Textarea
                placeholder="Описание номера..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Удобства</label>
              <Textarea
                placeholder="Wi-Fi, кондиционер, сейф..."
                rows={2}
                value={form.amenities}
                onChange={(e) => setForm((p) => ({ ...p, amenities: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Фото</label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer px-3 py-2 border border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploading ? "Загрузка..." : "Загрузить файл"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={handleFileUpload}
                  />
                </label>
                <span className="text-xs text-muted-foreground">или введите URL</span>
              </div>
              <Input
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={form.photo_url}
                onChange={(e) => setForm((p) => ({ ...p, photo_url: e.target.value }))}
              />
              {form.photo_url && (
                <div className="relative mt-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.photo_url}
                    alt="Предпросмотр"
                    className="w-full h-40 object-cover rounded-xl border border-border"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, photo_url: "" }))}
                    className="absolute top-2 right-2 bg-background/80 hover:bg-background rounded-full p-0.5 text-muted-foreground hover:text-destructive transition-colors shadow"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            {formError && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2">
                {formError}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDialog} disabled={saving}>Отмена</Button>
            <Button onClick={handleSave} disabled={saving || uploading}>
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Сохранение...</>
              ) : editingRoom ? "Сохранить изменения" : "Добавить номер"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------------------------------------------------------------- */}
      {/* Delete confirmation dialog                                               */}
      {/* ---------------------------------------------------------------------- */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => !open && closeDeleteDialog()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Удалить номер?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Вы уверены, что хотите удалить{" "}
            <span className="font-semibold text-foreground">номер {deletingRoom?.number}</span>?{" "}
            Это действие невозможно отменить.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDeleteDialog} disabled={deleting}>Отмена</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Удаление...</>
              ) : (
                <><Trash2 className="h-4 w-4 mr-2" />Удалить</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
