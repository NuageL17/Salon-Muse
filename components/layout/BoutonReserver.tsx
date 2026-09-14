"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PopupConnexion } from "./PopupConnexion";

type Props = {
  estConnectee: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

export function BoutonReserver({
  estConnectee,
  className,
  style,
  children,
}: Props) {
  const [popupOpen, setPopupOpen] = useState(false);
  const router = useRouter();

  function handleClick() {
    if (estConnectee) {
      router.push("/reservation");
    } else {
      setPopupOpen(true);
    }
  }

  return (
    <>
      <button onClick={handleClick} className={className} style={style}>
        {children ?? "Prendre RDV"}
      </button>

      <PopupConnexion
        open={popupOpen}
        onClose={() => setPopupOpen(false)}
      />
    </>
  );
}