import { requireGerante } from "@/lib/auth";
import { Sidebar } from "@/components/admin/Sidebar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireGerante();

  return (
    <div className="min-h-screen flex bg-white">
      <Sidebar />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}