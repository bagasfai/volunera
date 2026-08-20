import { requireProfile } from "@/lib/auth/dal";
import {
  listUsers,
  USER_ROLES,
  ACCOUNT_STATUSES,
} from "@/lib/admin/user-dal";
import { AccountStatusForm } from "./account-status-form";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; status?: string }>;
}) {
  const admin = await requireProfile();
  const filters = await searchParams;
  const users = await listUsers(filters);

  return (
    <>
      <div className="page-head">
        <div className="page-head__row">
          <div>
            <p className="eyebrow">Admin</p>
            <h1>Users</h1>
            <p className="page-head__lede">
              Suspending a tutor removes them from public discovery immediately
              and cancels their upcoming sessions. Suspension does not yet block
              sign-in for other roles.
            </p>
          </div>
          <p className="panel__note">{users.length} shown</p>
        </div>
      </div>

      <section className="panel">
        <form className="filter-bar">
          <label className="field">
            <span>Role</span>
            <select name="role" defaultValue={filters.role ?? ""} className="control">
              <option value="">Any</option>
              {USER_ROLES.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select name="status" defaultValue={filters.status ?? ""} className="control">
              <option value="">Any</option>
              {ACCOUNT_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
          <div className="filter-bar__actions">
            <button type="submit" className="btn btn--primary btn--sm">
              Apply
            </button>
          </div>
        </form>

        <ul className="record-rows">
          {users.map((user) => (
            <li key={user.id} className="record-row">
              <div>
                <p className="record-row__name">
                  {user.first_name} {user.last_name}
                </p>
                <p className="record-row__meta">{user.email}</p>
              </div>
              <div className="record-row__tags">
                <span className="tag">{user.role}</span>
                <span className="tag tag--outline">{user.status}</span>
                {user.application_status && (
                  <span className="tag tag--outline">
                    application: {user.application_status}
                  </span>
                )}
              </div>
              <AccountStatusForm
                key={`${user.id}-${user.status}`}
                profileId={user.id}
                currentStatus={user.status}
                isSelf={user.id === admin.id}
              />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
