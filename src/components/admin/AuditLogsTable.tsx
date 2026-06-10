"use client";
import { DataTable, type DataTableColumn } from "./DataTable";

export interface AuditLogRow {
  id: string; createdAt: string; action: string;
  actor: string; org: string; resource: string; ip: string; hmac: string;
}

const COLS: DataTableColumn<AuditLogRow>[] = [
  { key: "createdAt", label: "Quand",  sortable: true, width: "180px",
    render: r => <span className="font-mono text-xs">{r.createdAt}</span> },
  { key: "action",    label: "Action", sortable: true,
    render: r => <span className="font-mono text-xs">{r.action}</span> },
  { key: "actor",     label: "Acteur", width: "120px",
    render: r => <span className="font-mono text-xs">{r.actor}</span> },
  { key: "org",       label: "Org",    width: "120px",
    render: r => <span className="font-mono text-xs">{r.org}</span> },
  { key: "resource",  label: "Ressource",
    render: r => <span className="font-mono text-xs">{r.resource}</span> },
  { key: "ip",        label: "IP",     width: "120px",
    render: r => <span className="font-mono text-xs">{r.ip}</span> },
  { key: "hmac",      label: "HMAC",   width: "120px",
    render: r => <span className="font-mono text-[10px] text-stone-400">{r.hmac}</span> },
];

export function AuditLogsTable({ rows }: { rows: AuditLogRow[] }) {
  return <DataTable rows={rows} columns={COLS} searchableFields={["action","actor","org"]} pageSize={100} />;
}
