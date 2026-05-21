import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import type { Profile } from "@/types/app";

export async function getAdminUser(): Promise<Profile | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profileRaw } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const profile = profileRaw as Profile | null;

    if (!profile || profile.role !== "admin") return null;

    return profile;
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<Profile> {
  const admin = await getAdminUser();
  if (!admin) {
    redirect(ROUTES.admin.login);
  }
  return admin;
}
