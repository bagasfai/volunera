"use client";

import { useActionState } from "react";
import {
  setAccountStatus,
  type AccountStatusState,
} from "@/lib/admin/user-actions";
import { ACCOUNT_STATUSES } from "@/lib/admin/user-constants";

const INITIAL: AccountStatusState = {};

export function AccountStatusForm({
  profileId,
  currentStatus,
  isSelf,
}: {
  profileId: string;
  currentStatus: string;
  isSelf: boolean;
}) {
  const [state, formAction, pending] = useActionState(setAccountStatus, INITIAL);

  if (isSelf) {
    return <p className="field__hint">This is you.</p>;
  }

  return (
    <form action={formAction} className="inline-form">
      <input type="hidden" name="profileId" value={profileId} />
      <select
        name="status"
        defaultValue={currentStatus}
        className="control"
        aria-label="Account status"
      >
        {ACCOUNT_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status[0].toUpperCase() + status.slice(1)}
          </option>
        ))}
      </select>
      <button type="submit" className="btn btn--quiet btn--sm" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </button>
      {state.error && (
        <p className="field__error" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
