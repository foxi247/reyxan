"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash, Loader2, ChevronDown, ChevronRight, Tag } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import {
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItem,
} from "@/lib/actions/admin";
import {
  menuCategorySchema,
  menuItemSchema,
  type MenuCategoryInput,
  type MenuItemInput,
} from "@/lib/validations/admin";
import { toast } from "sonner";

type Category = { id: string; name: string; sort_order: number; is_active: boolean };
type MenuItem = {
  id: string; category_id: string; name: string; description: string | null;
  price: number; image_url: string | null; is_available: boolean;
};

// ── Category Dialog ──────────────────────────────────────────────

function CategoryDialog({
  open, onClose, category, onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  category?: Category | null;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<MenuCategoryInput>({
    resolver: zodResolver(menuCategorySchema),
    defaultValues: category
      ? { name: category.name, sort_order: category.sort_order, is_active: category.is_active }
      : { sort_order: 0, is_active: true },
  });

  const onSubmit = async (data: MenuCategoryInput) => {
    setLoading(true);
    const result = category
      ? await updateMenuCategory(category.id, data)
      : await createMenuCategory(data);
    if (result.success) {
      toast.success(category ? "Категория обновлена" : "Категория создана");
      onSuccess();
      onClose();
    } else {
      toast.error("Ошибка", { description: result.error });
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{category ? "Редактировать категорию" : "Добавить категорию"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Название</Label>
            <Input placeholder="Горячие блюда" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Порядок отображения</Label>
            <Input type="number" {...register("sort_order", { valueAsNumber: true })} />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Сохранить"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Menu Item Dialog ─────────────────────────────────────────────

function MenuItemDialog({
  open, onClose, item, categories, defaultCategoryId, onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  item?: MenuItem | null;
  categories: Category[];
  defaultCategoryId?: string;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<MenuItemInput>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: item
      ? {
          category_id: item.category_id,
          name: item.name,
          description: item.description ?? undefined,
          price: item.price,
          image_url: item.image_url ?? undefined,
          is_available: item.is_available,
        }
      : {
          category_id: defaultCategoryId ?? categories[0]?.id ?? "",
          is_available: true,
          price: 0,
        },
  });

  const onSubmit = async (data: MenuItemInput) => {
    setLoading(true);
    const result = item
      ? await updateMenuItem(item.id, data)
      : await createMenuItem(data);
    if (result.success) {
      toast.success(item ? "Блюдо обновлено" : "Блюдо добавлено");
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
          <DialogTitle>{item ? "Редактировать блюдо" : "Добавить блюдо"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Категория</Label>
            <Select
              defaultValue={item?.category_id ?? defaultCategoryId ?? categories[0]?.id}
              onValueChange={(v) => setValue("category_id", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category_id && <p className="text-xs text-destructive">{errors.category_id.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Название блюда</Label>
            <Input placeholder="Борщ со сметаной" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Описание</Label>
            <Textarea placeholder="Краткое описание блюда…" rows={2} {...register("description")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Цена (₽)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="350"
                {...register("price", { valueAsNumber: true })}
              />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Доступно</Label>
              <div className="flex items-center h-10">
                <Switch
                  defaultChecked={item?.is_available ?? true}
                  onCheckedChange={(v) => setValue("is_available", v)}
                />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>URL изображения (необязательно)</Label>
            <Input placeholder="https://…" {...register("image_url")} />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Сохранить"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ────────────────────────────────────────────────

export function MenuClient({
  categories: initialCategories,
  items: initialItems,
}: {
  categories: Category[];
  items: MenuItem[];
}) {
  const router = useRouter();
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [defaultCatId, setDefaultCatId] = useState<string | undefined>();
  const [expandedCats, setExpandedCats] = useState<Set<string>>(
    new Set(initialCategories.map((c) => c.id))
  );
  const [deleting, setDeleting] = useState<string | null>(null);

  const refresh = () => router.refresh();

  const toggleExpand = (id: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteCat = async (id: string) => {
    if (!confirm("Удалить категорию и все её блюда?")) return;
    setDeleting(id);
    const result = await deleteMenuCategory(id);
    if (result.success) { toast.success("Категория удалена"); refresh(); }
    else toast.error("Ошибка", { description: result.error });
    setDeleting(null);
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Удалить блюдо?")) return;
    setDeleting(id);
    const result = await deleteMenuItem(id);
    if (result.success) { toast.success("Блюдо удалено"); refresh(); }
    else toast.error("Ошибка", { description: result.error });
    setDeleting(null);
  };

  const handleToggleItem = async (id: string, current: boolean) => {
    const result = await toggleMenuItem(id, !current);
    if (result.success) { toast.success(current ? "Блюдо скрыто" : "Блюдо доступно"); refresh(); }
  };

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div />
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => { setEditCat(null); setCatDialogOpen(true); }}
          >
            <Tag className="h-4 w-4" />
            Добавить категорию
          </Button>
          <Button onClick={() => { setEditItem(null); setDefaultCatId(undefined); setItemDialogOpen(true); }}>
            <Plus className="h-4 w-4" />
            Добавить блюдо
          </Button>
        </div>
      </div>

      {initialCategories.length === 0 ? (
        <div className="hotel-card p-12 text-center text-muted-foreground">
          <Tag className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Нет категорий. Добавьте первую категорию меню.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {initialCategories.map((cat) => {
            const catItems = initialItems.filter((i) => i.category_id === cat.id);
            const expanded = expandedCats.has(cat.id);

            return (
              <div key={cat.id} className="hotel-card overflow-hidden">
                {/* Category header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <button
                    onClick={() => toggleExpand(cat.id)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    {expanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-medium">{cat.name}</span>
                    <Badge variant="cream" className="ml-1">{catItems.length} позиций</Badge>
                  </button>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => {
                        setDefaultCatId(cat.id);
                        setEditItem(null);
                        setItemDialogOpen(true);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => { setEditCat(cat); setCatDialogOpen(true); }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-hotel-red hover:text-hotel-red hover:bg-hotel-red/5"
                      disabled={deleting === cat.id}
                      onClick={() => handleDeleteCat(cat.id)}
                    >
                      {deleting === cat.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Items table */}
                {expanded && (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-accent/30">
                        {["Блюдо", "Цена", "Статус", ""].map((h) => (
                          <th
                            key={h}
                            className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {catItems.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-5 py-6 text-center text-sm text-muted-foreground">
                            Нет блюд в этой категории
                          </td>
                        </tr>
                      ) : (
                        catItems.map((item) => (
                          <tr key={item.id} className="hover:bg-accent/20 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="font-medium text-sm">{item.name}</div>
                              {item.description && (
                                <div className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">
                                  {item.description}
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-sm font-medium text-gold">
                              {item.price.toLocaleString("ru-RU")} ₽
                            </td>
                            <td className="px-5 py-3.5">
                              <Switch
                                checked={item.is_available}
                                onCheckedChange={() => handleToggleItem(item.id, item.is_available)}
                              />
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex gap-1.5">
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  onClick={() => { setEditItem(item); setItemDialogOpen(true); }}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  className="text-hotel-red hover:text-hotel-red hover:bg-hotel-red/5"
                                  disabled={deleting === item.id}
                                  onClick={() => handleDeleteItem(item.id)}
                                >
                                  {deleting === item.id ? (
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
                )}
              </div>
            );
          })}
        </div>
      )}

      <CategoryDialog
        open={catDialogOpen}
        onClose={() => setCatDialogOpen(false)}
        category={editCat}
        onSuccess={refresh}
      />
      <MenuItemDialog
        open={itemDialogOpen}
        onClose={() => setItemDialogOpen(false)}
        item={editItem}
        categories={initialCategories}
        defaultCategoryId={defaultCatId}
        onSuccess={refresh}
      />
    </main>
  );
}
