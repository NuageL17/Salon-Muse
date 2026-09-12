import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { titre, corps, url } = body as {
    titre?: string;
    corps?: string;
    url?: string;
  };

  if (!titre || !corps) {
    return NextResponse.json(
      { error: "Titre et corps requis" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "gerante") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:contact@salon-muse.com";

  if (!publicKey || !privateKey) {
    return NextResponse.json(
      { error: "Clés VAPID manquantes côté serveur" },
      { status: 500 }
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, cliente_id, endpoint, p256dh, auth");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({
      ok: true,
      envoyes: 0,
      message: "Aucune souscription active",
    });
  }

  const payload = JSON.stringify({
    title: titre,
    body: corps,
    url: url || "/mon-compte",
  });

  let envoyes = 0;
  const aSupprimer: string[] = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
        envoyes++;

        await supabase.from("notifications_envoyees").insert({
          cliente_id: sub.cliente_id,
          type: "push",
          titre,
          corps,
        });
      } catch (err: unknown) {
        const e = err as { statusCode?: number };
        if (e.statusCode === 404 || e.statusCode === 410) {
          aSupprimer.push(sub.id);
        }
      }
    })
  );

  if (aSupprimer.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", aSupprimer);
  }

  return NextResponse.json({ ok: true, envoyes });
}