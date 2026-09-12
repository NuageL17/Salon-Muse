"use client";

import { useEffect, useState } from "react";

type Etat =
  | "inconnu"
  | "supported"
  | "not_supported"
  | "denied"
  | "granted"
  | "loading";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function ActiverPush() {
  const [etat, setEtat] = useState<Etat>("inconnu");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setEtat("not_supported");
        return;
      }

      const permission = Notification.permission;
      if (permission === "denied") {
        setEtat("denied");
        return;
      }

      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const existing = await registration.pushManager.getSubscription();

        if (existing) {
          setEtat("granted");
        } else {
          setEtat("supported");
        }
      } catch {
        setEtat("supported");
      }
    }

    check();
  }, []);

  async function activer() {
    setEtat("loading");
    setMessage(null);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setEtat("denied");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error("Clé VAPID manquante");
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error);
      }

      setEtat("granted");
      setMessage("Notifications activées ✅");
    } catch (e) {
      setEtat("supported");
      setMessage(e instanceof Error ? e.message : "Erreur");
    }
  }

  async function desactiver() {
    setEtat("loading");
    setMessage(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        await subscription.unsubscribe();
      }

      setEtat("supported");
      setMessage("Notifications désactivées");
    } catch (e) {
      setEtat("granted");
      setMessage(e instanceof Error ? e.message : "Erreur");
    }
  }

  if (etat === "inconnu") {
    return null;
  }

  if (etat === "not_supported") {
    return (
      <div className="p-5 rounded-2xl border border-neutral-200 bg-white">
        <p
          className="text-xs uppercase tracking-wide mb-2"
          style={{ color: "var(--muted)" }}
        >
          Notifications
        </p>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Votre navigateur ne supporte pas les notifications. Installez la PWA
          depuis le menu du navigateur pour les activer.
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl border border-neutral-200 bg-white">
      <p
        className="text-xs uppercase tracking-wide mb-2"
        style={{ color: "var(--muted)" }}
      >
        Notifications
      </p>
      <p className="text-sm mb-3">
        {etat === "granted"
          ? "Vous recevrez les promos et rappels du salon."
          : "Activez les notifications pour ne rien manquer."}
      </p>

      {etat === "granted" ? (
        <button
          onClick={desactiver}
          className="text-xs px-4 py-2 rounded-full"
          style={{ background: "#fee2e2", color: "#b91c1c" }}
        >
          Désactiver
        </button>
      ) : (
        <button
          onClick={activer}
          disabled={etat === "loading" || etat === "denied"}
          className="text-xs px-4 py-2 rounded-full text-white disabled:opacity-50"
          style={{ background: "var(--accent)" }}
        >
          {etat === "loading" ? "…" : "Activer les notifications"}
        </button>
      )}

      {etat === "denied" && (
        <p className="text-xs mt-2" style={{ color: "#b91c1c" }}>
          Notifications refusées. Autorisez-les dans les paramètres du
          navigateur.
        </p>
      )}

      {message && (
        <p className="text-xs mt-2" style={{ color: "var(--accent-dark)" }}>
          {message}
        </p>
      )}
    </div>
  );
}