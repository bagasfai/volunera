"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";
import { ACCOUNT_STATUSES } from "@/lib/admin/user-constants";

type AccountStatus = Database["public"]["Enums"]["account_status"];

export type AccountStatusState = { error?: string };

export async function setAccountStatus(
  _prev: AccountStatusState,
  formData: FormData,
): Promise<AccountStatusState> {
  await requireRole("admin");

  const profileId = String(formData.get("profileId") ?? "");
  const status = String(formData.get("status") ?? "") as AccountStatus;

  if (
    !profileId ||
    !(ACCOUNT_STATUSES as readonly string[]).includes(status)
  ) {
    return { error: "Pick a valid account status." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_account_status", {
    p_profile_id: profileId,
    p_status: status,
  });

  if (error) {
    // P0001 is the RPC refusing an admin's attempt to change their own status.
    if (error.code === "P0001") {
      return { error: "You cannot change your own account status." };
    }
    return { error: "Could not update this account. Try again." };
  }

  revalidatePath("/dashboard/admin/users");
  return {};
}
