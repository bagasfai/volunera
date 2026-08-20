import { listLookups } from "@/lib/admin/lookup-dal";
import { GRADE_CATEGORIES } from "@/lib/validation/lookup";
import { LookupPanel } from "./lookup-panel";

export default async function AdminLookupsPage() {
  const { gradeLevels, subjects } = await listLookups();

  return (
    <>
      <div className="page-head">
        <div className="page-head__row">
          <div>
            <p className="eyebrow">Admin</p>
            <h1>Grade levels and subjects</h1>
            <p className="page-head__lede">
              Add options here rather than asking a developer to change the site.
              Deactivating hides an option everywhere without touching history.
            </p>
          </div>
        </div>
      </div>

      <LookupPanel
        title="Grade levels"
        table="grade_levels"
        rows={gradeLevels}
        categories={GRADE_CATEGORIES}
      />

      <LookupPanel
        title="Subjects"
        table="subjects"
        rows={subjects}
        categories={null}
      />
    </>
  );
}
