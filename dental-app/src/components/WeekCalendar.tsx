"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createAppointment } from "@/app/(app)/appointments/actions";
import PatientPicker from "@/components/PatientPicker";
import type { Appointment } from "@/lib/types";

// Rango horario visible y tamaño de bloque
const START_HOUR = 8;
const END_HOUR = 21;
const SLOT_PX = 44; // alto de cada bloque de 30 min
const SLOTS = (END_HOUR - START_HOUR) * 2;
const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const STATUS_COLORS: Record<string, string> = {
  agendado: "bg-slate-200 text-slate-700 border-slate-300",
  confirmado: "bg-blue-100 text-blue-800 border-blue-300",
  atendido: "bg-emerald-100 text-emerald-800 border-emerald-300",
  cancelado: "bg-red-100 text-red-800 border-red-300",
  ausente: "bg-amber-100 text-amber-800 border-amber-300",
};

function mondayOf(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const off = (x.getDay() + 6) % 7; // 0 = lunes
  x.setDate(x.getDate() - off);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toLocalInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}
function hhmm(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
// Suma minutos a un "HH:MM" (para proponer una hora de fin por defecto).
function addMinutesToHHMM(hhmmStr: string, minutes: number) {
  const [h, m] = hhmmStr.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor((total % (24 * 60)) / 60);
  const mm = total % 60;
  return `${pad(hh)}:${pad(mm)}`;
}

export
