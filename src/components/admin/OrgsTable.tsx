"use client";
import { DataTable, type DataTableColumn } from "./DataTable";

export interface OrgRow {
  id: string; name: string; clientType: string; plan: string; status: string;
  members: number; projects: number; createdAt: string;
}

const COLS: DataTableColumn<OrgRow>[] = [
  { key: "name",       label: "Nom",       sortable: true },
  { key: "clientType", label: "Type",      sortable: true,
    render: r => <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs">{r.clientType}</span> },
  { key: "plan",       label: "Plan",      sortable: true,
    render: r => <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">{r.plan}</span> },
  { key: "status",     label: "Statut",    sortable: true,
    render: r => <span className={`rounded-full px-2 py-0.5 text-xs ${r.status === "ACTIVE" ? "bg-emerald-100 text-emerald-900" : r.status === "TRIALING" ? "bg-blue-100 text-blue-900" : "bg-stone-100 text-stone-900"}`}>{r.status}</span> },
  { key: "members",    label: "Membres",   sortable: true, width: "80px" },
  { key: "projects",   label: "Projets",   sortable: true, width: "80px" },
  { key: "createdAt",  label: "Créée",     sortable: true },
];

export function OrgsTable({ rows }: { rows: OrgRow[] }) {
  return <DataTable rows={rows} columns={COLS} searchableFields={["name"]} />;
}
