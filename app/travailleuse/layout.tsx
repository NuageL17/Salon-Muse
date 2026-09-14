import { requireTravailleuse } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TravailleuseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireTravailleuse();

  return <div className="min-h-screen bg-white">{children}</div>;
}