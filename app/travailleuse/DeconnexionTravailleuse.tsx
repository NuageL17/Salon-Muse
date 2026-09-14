"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function DeconnexionTravailleuse() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleSignout() {
    setLoading(true);
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <button
      onClick={handleSignout}
      disabled={loading}
      className="text-sm hover:opacity-60 disabled:opacity-50"
      style={{ color: "#b91c1c" }}
    >
      {loading ? "…" : "Se déconnecter"}
    </button>
  );
}