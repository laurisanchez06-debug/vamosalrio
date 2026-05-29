"use client";

import { useEffect, useState } from "react";
import Toast from "./Toast";

type Props = {
  mensaje: string;
  tipo?: "info" | "error";
  duracionMs?: number;
};

export default function AutoToast({
  mensaje,
  tipo = "info",
  duracionMs = 3000,
}: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), duracionMs);
    return () => clearTimeout(t);
  }, [duracionMs]);

  if (!visible) return null;
  return <Toast mensaje={mensaje} tipo={tipo} />;
}
