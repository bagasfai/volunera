import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type TutorApplicationStatus =
  Database["public"]["Enums"]["tutor_application_status"];

export type AdminUserRow = Profile & {
  application_status: TutorApplicationStatus | null;
};

export type AdminUserFilters = { role?: string; status?: string };

export { USER_ROLES, ACCOUNT_STATUSES } from "./user-constants";
import { USER_ROLES, ACCOUNT_STATUSES } from "./user-constants";

export async function listUsers(
  filters: AdminUserFilters = {},
): Promise<AdminUserRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("*, tutor_profiles!tutor_profiles_profile_id_fkey(application_status)")
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(200);

  if (filters.role && (USER_ROLES as readonly string[]).includes(filters.role)) {
    query = query.eq(
      "role",
      filters.role as Database["public"]["Enums"]["user_role"],
    );
  }
  if (
    filters.status &&
    (ACCOUNT_STATUSES as readonly string[]).includes(filters.status)
  ) {
    query = query.eq(
      "status",
      filters.status as Database["public"]["Enums"]["account_status"],
    );
  }

  const { data } = await query;

  return (data ?? []).map((row) => {
    const { tutor_profiles, ...profile } = row as Profile & {
      tutor_profiles: { application_status: TutorApplicationStatus } | null;
    };
    return {
      ...profile,
      application_status: tutor_profiles?.application_status ?? null,
    };
  });
}
