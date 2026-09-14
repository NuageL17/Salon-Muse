"use client";

import { useEffect, useState } from "react";

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

export function PopupNotifications() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [dejaAbonne, setDejaAbonne] = useState(false);

  useEffect(() => {
    async function check() {
      // Déjà fermée dans les dernières 24h ?
      const snooze = localStorage.getItem("popup-notif-snooze");
      if (snooze) {
        const snoozeDate = new Date(parseInt(snooze));
        const hoursSince = (Date.now() - snoozeDate.getTime()) / 1000 / 3600;
        if (hoursSince < 24) return;
      }

      // Navigateur supporte ?
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return;
      }

      // Permission déjà refusée ?
      if (Notification.permission === "denied") return;

      // Déjà abonné ? (via SW)
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const existing = await registration.pushManager.getSubscription();
        if (existing) {
          setDejaAbonne(true);
          return;
        }
      } catch {
        // ignore
      }

      // Afficher la popup après un petit délai
      setTimeout(() => setVisible(true), 800);
    }

    check();
  }, []);

  async function activer() {
    setLoading(true);
    setErreur(null);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        localStorage.setItem("popup-notif-snooze", Date.now().toString());
        setVisible(false);
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("Configuration manquante");

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

      // Succès
      localStorage.removeItem("popup-notif-snooze");
      setDejaAbonne(true);
      setTimeout(() => setVisible(false), 1200);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
      setLoading(false);
    }
  }

  function plusTard() {
    localStorage.setItem("popup-notif-snooze", Date.now().toString());
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={plusTard}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <div
            className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl mb-4"
            style={{ background: "var(--accent)", opacity: 0.15 }}
          />
          <div
            className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl -mt-20 mb-4"
          >
            🔔
          </div>
        </div>

        <h2 className="text-2xl font-light text-center mb-2">
          Ne manquez rien !
        </h2>
        <p
          className="text-sm text-center mb-6"
          style={{ color: "var(--muted)" }}
        >
          Recevez nos promotions et rappels de rendez-vous directement sur votre
          téléphone.
        </p>

        {dejaAbonne ? (
          <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-center">
            <p className="text-sm text-green-700 font-medium">
              ✅ Notifications activées
            </p>
          </div>
        ) : (
          <>
            {erreur && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 text-center">
                {erreur}
              </div>
            )}

            <button
              onClick={activer}
              disabled={loading}
              className="w-full py-4 rounded-full text-white text-base transition hover:opacity-90 disabled:opacity-50 mb-3"
              style={{ background: "var(--accent)" }}
            >
              {loading ? "Activation…" : "Activer les notifications"}
            </button>

            <button
              onClick={plusTard}
              disabled={loading}
              className="w-full py-3 rounded-full text-sm transition hover:opacity-60 disabled:opacity-50"
              style={{ color: "var(--muted)" }}
            >
              Plus tard
            </button>
          </>
        )}
      </div>
    </div>
  );
}