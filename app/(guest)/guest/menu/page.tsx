"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ShoppingBag, Loader2, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/hotel/mobile-shell";
import { HotelLogo } from "@/components/hotel/hotel-logo";
import { ThemeToggle } from "@/components/hotel/theme-toggle";
import { GuestBottomNav } from "@/components/hotel/guest-bottom-nav";
import { MenuItemCard } from "@/components/hotel/menu-item-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { getGuestMenu, createRoomServiceOrder } from "@/lib/actions/guest";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import type { MenuCategory, MenuItem } from "@/types/app";

interface CartItem {
  menuItemId: string;
  quantity: number;
  price: number;
  name: string;
}

export default function GuestMenuPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    getGuestMenu().then(({ categories, items }) => {
      setCategories(categories);
      setItems(items);
      setLoading(false);
    });
  }, []);

  const handleOrder = (item: MenuItem) => {
    setCart((prev) => {
      if (prev[item.id]) {
        const { [item.id]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [item.id]: {
          menuItemId: item.id,
          quantity: 1,
          price: item.price,
          name: item.name,
        },
      };
    });
  };

  const totalItems = Object.keys(cart).length;
  const totalPrice = Object.values(cart).reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleCheckout = async () => {
    if (totalItems === 0) return;
    setOrdering(true);
    try {
      const result = await createRoomServiceOrder(Object.values(cart));
      if (result.success) {
        setCart({});
        toast.success("Заказ оформлен!", {
          description: "Блюда будут доставлены в течение 30–40 минут.",
          duration: 5000,
        });
      } else {
        toast.error("Ошибка", { description: result.error });
      }
    } finally {
      setOrdering(false);
    }
  };

  const defaultCategory = categories[0]?.id ?? "";

  if (loading) {
    return (
      <MobileShell>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <HotelLogo size="sm" />
        <ThemeToggle size="sm" />
      </div>

      {/* Title */}
      <div className="px-6 pb-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl gold-gradient shadow-sm">
            <ShoppingBag className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-medium">Меню отеля</h1>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-2 ml-14">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Доставка в номер с 07:00 до 23:00
          </span>
        </div>
      </div>

      {/* Categories & Items */}
      <div className="px-4 pb-40">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-muted-foreground">Меню временно недоступно</p>
          </div>
        ) : (
          <Tabs defaultValue={defaultCategory}>
            <div className="overflow-x-auto pb-2">
              <TabsList className="w-max">
                {categories.map((cat) => (
                  <TabsTrigger key={cat.id} value={cat.id}>
                    {cat.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {categories.map((cat) => {
              const catItems = items.filter((i) => i.category_id === cat.id);
              return (
                <TabsContent key={cat.id} value={cat.id} className="space-y-3 mt-4">
                  {catItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Нет доступных блюд
                    </div>
                  ) : (
                    catItems.map((item) => (
                      <MenuItemCard
                        key={item.id}
                        id={item.id}
                        name={item.name}
                        description={item.description}
                        price={item.price}
                        ordered={!!cart[item.id]}
                        onOrder={() => handleOrder(item)}
                      />
                    ))
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </div>

      {/* Cart bar */}
      {totalItems > 0 && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-mobile px-4 z-40"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <Button
            size="lg"
            className="w-full shadow-lg"
            onClick={handleCheckout}
            disabled={ordering}
          >
            {ordering ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" />
                Заказать {totalItems} {totalItems === 1 ? "блюдо" : "блюда"} ·{" "}
                {formatPrice(totalPrice)}
              </>
            )}
          </Button>
        </div>
      )}

      <GuestBottomNav />
    </MobileShell>
  );
}
