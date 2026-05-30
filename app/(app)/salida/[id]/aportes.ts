"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: true } | { error: string };
type DB = ReturnType<typeof createClient>;

const CATEGORIAS = ["host", "repartir", "cada_uno"];

async function esHost(supabase: DB, salidaId: string, userId: string) {
  const { data } = await supabase
    .from("salidas")
    .select("host_id")
    .eq("id", salidaId)
    .maybeSingle();
  return !!data && data.host_id === userId;
}

async function esMiembro(supabase: DB, salidaId: string, userId: string) {
  if (await esHost(supabase, salidaId, userId)) return true;
  const { data } = await supabase
    .from("participaciones")
    .select("estado")
    .eq("salida_id", salidaId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.estado === "aceptado";
}

export async function agregarAporte(
  salidaId: string,
  nombre: string,
  categoria: string,
): Promise<Result> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Necesitás iniciar sesión." };

  const n = nombre.trim().slice(0, 120);
  if (!n) return { error: "Escribí qué se aporta." };
  if (!CATEGORIAS.includes(categoria)) return { error: "Categoría inválida." };
  if (!(await esHost(supabase, salidaId, user.id))) {
    return { error: "Solo el host agrega aportes." };
  }

  const { error } = await supabase
    .from("aportes")
    .insert({ salida_id: salidaId, nombre: n, categoria });
  if (error) return { error: error.message };

  revalidatePath(`/salida/${salidaId}`);
  return { ok: true };
}

export async function borrarAporte(
  id: string,
  salidaId: string,
): Promise<Result> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Necesitás iniciar sesión." };
  if (!(await esHost(supabase, salidaId, user.id))) {
    return { error: "Solo el host borra aportes." };
  }

  const { error } = await supabase
    .from("aportes")
    .delete()
    .eq("id", id)
    .eq("salida_id", salidaId);
  if (error) return { error: error.message };

  revalidatePath(`/salida/${salidaId}`);
  return { ok: true };
}

export async function reclamarAporte(
  id: string,
  salidaId: string,
): Promise<Result> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Necesitás iniciar sesión." };
  if (!(await esMiembro(supabase, salidaId, user.id))) {
    return { error: "Solo la tripulación confirmada puede reclamar." };
  }

  // Solo si sigue sin reclamar (evita pisar a otro).
  const { error } = await supabase
    .from("aportes")
    .update({ asignado_a: user.id })
    .eq("id", id)
    .eq("salida_id", salidaId)
    .is("asignado_a", null);
  if (error) return { error: error.message };

  revalidatePath(`/salida/${salidaId}`);
  return { ok: true };
}

export async function soltarAporte(
  id: string,
  salidaId: string,
): Promise<Result> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Necesitás iniciar sesión." };

  // Solo si era tuyo.
  const { error } = await supabase
    .from("aportes")
    .update({ asignado_a: null })
    .eq("id", id)
    .eq("salida_id", salidaId)
    .eq("asignado_a", user.id);
  if (error) return { error: error.message };

  revalidatePath(`/salida/${salidaId}`);
  return { ok: true };
}
