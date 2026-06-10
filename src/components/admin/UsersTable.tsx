"use client";
// components/admin/UsersTable.tsx — Wrapper client pour DataTable utilisateurs.
import Link from "next/link";
import { useTranslations } from "next-intl";
import { DataTable, type DataTableColumn } from "./DataTable";

export interface UserRow {
  id: string;
  email: string;
  fullName: string;
  clientType: string;
  orgName: string;
  role: string;
  locale: string;
  createdAt: string;
  lastLoginAt: string;
  verified: string;
}

export function UsersTable({ rows }: { rows: UserRow[] }) {
  const t = useTranslations("usersTable");
  const COLS: DataTableColumn<UserRow>[] = [
    { key: "email",       label: t("thEmail"),    sortable: true,
      render: r => <Link href={`/admin/users/${r.id}`} className="font-medium text-teal-700 hover:underline">{r.email}</Link> },
    { key: "fullName",    label: t("thName"),     sortable: true },
    { key: "clientType",  label: t("thType"),     sortable: true,
      render: r => <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs">{r.clientType}</span> },
    { key: "orgName",     label: t("thOrg"),      sortable: true },
    { key: "role",        label: t("thRole"),     sortable: true },
    { key: "locale",      label: t("thLocale"),   width: "60px" },
    { key: "createdAt",   label: t("thCreated"),  sortable: true },
    { key: "lastLoginAt", label: t("thLastConn"), sortable: true },
    { key: "verified",    label: "✓",             width: "40px" },
  ];
  return <DataTable rows={rows} columns={COLS} searchableFields={["email","fullName","orgName"]} />;
}
