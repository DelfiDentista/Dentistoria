import Link from "next/link";
import PatientForm from "@/components/PatientForm";

export default function NewPatientPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/patients" className="text-sm text-slate-500 hover:underline">
          ← Volver a pacientes
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Nuevo paciente</h1>
      </div>
      <PatientForm />
    </div>
  );
}
