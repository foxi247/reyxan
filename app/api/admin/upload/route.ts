import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/admin";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "general";

    if (!file) return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
    if (file.size > MAX_SIZE_BYTES) return NextResponse.json({ error: "Файл слишком большой (макс 5MB)" }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Только изображения (JPEG, PNG, WebP)" }, { status: 400 });

    const ext = file.name.split(".").pop() ?? "jpg";
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from("hotel-media")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return NextResponse.json({ error: "Ошибка загрузки файла" }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage.from("hotel-media").getPublicUrl(data.path);

    return NextResponse.json({ success: true, url: publicUrl });
  } catch {
    return NextResponse.json({ error: "Произошла ошибка" }, { status: 500 });
  }
}
