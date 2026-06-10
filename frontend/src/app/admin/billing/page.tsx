import { createClient } from "@/utils/supabase/server";
import BillingAppClient from "./BillingAppClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminBillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();

  const defaultUser = {
    name: profile?.name || user.email || "Admin",
    role: profile?.role || "admin",
    email: user.email || "",
  };

  return <BillingAppClient defaultUser={defaultUser} />;
}
