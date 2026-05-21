"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HotelLogo } from "@/components/hotel/hotel-logo";
import { approveGuestSchema, type ApproveGuestInput } from "@/lib/validations/admin";
import { approveGuestRequest } from "@/lib/actions/admin";
import { toast } from "sonner";

interface ApprovalDialogProps {
  requestId: string;
  phone: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ApprovalDialog({
  requestId,
  phone,
  open,
  onClose,
  onSuccess,
}: ApprovalDialogProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ApproveGuestInput>({
    resolver: zodResolver(approveGuestSchema),
    defaultValues: {
      requestId,
      checkIn: new Date().toISOString().split("T")[0],
    },
  });

  const onSubmit = async (data: ApproveGuestInput) => {
    setLoading(true);
    try {
      const result = await approveGuestRequest(requestId, {
        firstName: data.firstName,
        lastName: data.lastName,
        roomNumber: data.roomNumber,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
      });

      if (result.success) {
        toast.success("Гость подтверждён", {
          description: `${data.firstName} ${data.lastName} получил доступ к комнате ${data.roomNumber}`,
        });
        reset();
        onClose();
        onSuccess?.();
      } else {
        toast.error("Ошибка", { description: result.error });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader className="items-center text-center pb-2">
          <div className="mb-2">
            <HotelLogo size="sm" />
          </div>
          <DialogTitle>Подтверждение гостя</DialogTitle>
          <DialogDescription>
            Телефон: <span className="font-medium text-foreground">{phone}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("requestId")} value={requestId} />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">Имя</Label>
              <Input
                id="firstName"
                placeholder="Фархад"
                {...register("firstName")}
              />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Фамилия</Label>
              <Input
                id="lastName"
                placeholder="Ахмедов"
                {...register("lastName")}
              />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="roomNumber">Номер комнаты</Label>
            <Input
              id="roomNumber"
              placeholder="204"
              {...register("roomNumber")}
            />
            {errors.roomNumber && (
              <p className="text-xs text-destructive">{errors.roomNumber.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="checkIn">Дата заезда</Label>
              <Input
                id="checkIn"
                type="date"
                {...register("checkIn")}
              />
              {errors.checkIn && (
                <p className="text-xs text-destructive">{errors.checkIn.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="checkOut">Дата выезда</Label>
              <Input
                id="checkOut"
                type="date"
                {...register("checkOut")}
              />
              {errors.checkOut && (
                <p className="text-xs text-destructive">{errors.checkOut.message}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            {loading ? "Подтверждение..." : "Подтвердить гостя"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
