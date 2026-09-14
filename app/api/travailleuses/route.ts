import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const prestationId = searchParams.get("prestation_id");

  if (!prestationId) {
    return NextResponse.json(
      { error: "prestation_id requis" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("travailleuses_pour_prestation", {
    p_prestation_id: prestationId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ travailleuses: data ?? [] });
}