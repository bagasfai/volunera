"use client";

import { useActionState, useState } from "react";
import {
  createGradeLevel,
  createSubject,
  deleteLookup,
  setLookupActive,
  type LookupState,
} from "@/lib/admin/lookup-actions";
import type { GradeLevel, Subject } from "@/lib/admin/lookup-dal";

const INITIAL: LookupState = {};

type LookupTable = "grade_levels" | "subjects";
type LookupRowData = GradeLevel | Subject;

function titleCase(value: string) {
  return value[0].toUpperCase() + value.slice(1);
}

function singular(title: string) {
  return title.toLowerCase().replace(/s$/, "");
}

export function LookupPanel({
  title,
  table,
  rows,
  categories,
}: {
  title: string;
  table: LookupTable;
  rows: LookupRowData[];
  categories: readonly string[] | null;
}) {
  const createAction = table === "grade_levels" ? createGradeLevel : createSubject;
  const [createState, createFormAction, createPending] = useActionState(
    createAction,
    INITIAL,
  );

  return (
    <section className="panel">
      <div className="panel__head">
        <h2>{title}</h2>
        <p className="panel__note">{rows.length} total</p>
      </div>

      <form action={createFormAction} className="form">
        <label className="field">
          <span>Label</span>
          <input
            type="text"
            name="label"
            required
            maxLength={80}
            className="control"
            aria-invalid={Boolean(createState.fieldErrors?.label)}
          />
          {createState.fieldErrors?.label && (
            <span className="field__error">{createState.fieldErrors.label}</span>
          )}
        </label>

        <label className="field">
          <span>Category</span>
          {categories ? (
            <select
              name="category"
              defaultValue={categories[0]}
              className="control"
              aria-invalid={Boolean(createState.fieldErrors?.category)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {titleCase(category)}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              name="category"
              maxLength={80}
              className="control"
              placeholder="Optional"
              aria-invalid={Boolean(createState.fieldErrors?.category)}
            />
          )}
          {createState.fieldErrors?.category && (
            <span className="field__error">{createState.fieldErrors.category}</span>
          )}
          <span className="field__hint">
            {categories ? "" : "Leave blank if this subject has no grouping."}
          </span>
        </label>

        <label className="field">
          <span>Sort order</span>
          <input
            type="number"
            name="sortOrder"
            step="1"
            min={0}
            max={10000}
            defaultValue={0}
            required
            className="control"
            aria-invalid={Boolean(createState.fieldErrors?.sortOrder)}
          />
          {createState.fieldErrors?.sortOrder && (
            <span className="field__error">{createState.fieldErrors.sortOrder}</span>
          )}
        </label>

        <div className="form__actions">
          <button type="submit" className="btn btn--primary" disabled={createPending}>
            {createPending ? "Adding…" : `Add ${singular(title)}`}
          </button>
        </div>

        {createState.error && (
          <p className="alert alert--error" role="alert">
            {createState.error}
          </p>
        )}
      </form>

      <ul className="record-rows">
        {rows.map((row) => (
          <LookupRowItem key={row.id} table={table} row={row} />
        ))}
      </ul>
    </section>
  );
}

function LookupRowItem({
  table,
  row,
}: {
  table: LookupTable;
  row: LookupRowData;
}) {
  const [toggleState, toggleAction, togglePending] = useActionState(
    setLookupActive,
    INITIAL,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteLookup,
    INITIAL,
  );
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <li className="record-row">
      <div>
        <p className="record-row__name">{row.label}</p>
        <p className="record-row__meta">
          {row.category ?? "No category"} · sort {row.sort_order}
        </p>
      </div>

      <div className="record-row__tags">
        <span className={row.is_active ? "tag" : "tag tag--outline"}>
          {row.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      <form action={toggleAction} className="inline-form">
        <input type="hidden" name="table" value={table} />
        <input type="hidden" name="id" value={row.id} />
        <input type="hidden" name="isActive" value={String(!row.is_active)} />
        <button
          type="submit"
          className="btn btn--quiet btn--sm"
          disabled={togglePending}
        >
          {togglePending ? "Saving…" : row.is_active ? "Deactivate" : "Activate"}
        </button>
      </form>

      {confirmingDelete ? (
        <form action={deleteAction} className="inline-form">
          <input type="hidden" name="table" value={table} />
          <input type="hidden" name="id" value={row.id} />
          <span className="field__hint">Delete “{row.label}” permanently?</span>
          <button
            type="submit"
            className="btn btn--danger btn--sm"
            disabled={deletePending}
          >
            {deletePending ? "Deleting…" : "Confirm delete"}
          </button>
          <button
            type="button"
            className="btn btn--text btn--sm"
            disabled={deletePending}
            onClick={() => setConfirmingDelete(false)}
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          type="button"
          className="btn btn--outline btn--sm"
          onClick={() => setConfirmingDelete(true)}
        >
          Delete
        </button>
      )}

      {(toggleState.error || deleteState.error) && (
        <p className="field__error" role="alert">
          {toggleState.error ?? deleteState.error}
        </p>
      )}
    </li>
  );
}
