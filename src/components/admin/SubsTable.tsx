"use client";
import { DataTable, type DataTableColumn } from "./DataTable";

export interface SubRow {
  id: string; orgName: string; plan: string; status: string;
  period: string; periodEnd: string; trialEnd: string; usageReports: number; cancelEnd: string;
}

const COLS: DataTableColumn<SubRow>[] = [
  { key: "orgName",      label: "Organisation", sortable: true },
  { key: "plan",         label: "Plan",         sortable: true },
  { key: "status",       label: "Statut",       sortable: true,
    render: r => <span className={`rounded-full px-2 py-0.5 text-xs ${r.status === "ACTIVE" ? "bg-emerald-100 text-emerald-900" : r.status === "TRIALING" ? "bg-blue-100 text-blue-900" : r.status === "PAST_DUE" ? "bg-amber-100 text-amber-900" : "bg-stone-100 text-stone-900"}`}>{r.status}</span> },
  { key: "period",       label: "Période" },
  { key: "periodEnd",    label: "Fin période",  sortable: true },
  { key: "trialEnd",     label: "Fin trial",    sortable: true },
  { key: "usageReports", label: "PDFs / mois",  sortable: true },
  { key: "cancelEnd",    label: "Cancel",       width: "60px" },
];

export function SubsTable({ rows }: { rows: SubRow[] }) {
  return <DataTable rows={rows} columns={COLS} searchableFields={["orgName"]} />;
}
