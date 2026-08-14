export type Sex = "femenino" | "masculino" | "otro";

export type Patient = {
  id: string;
  first_name: string;
  last_name: string;
  dni: string | null;
  birth_date: string | null;
  sex: Sex | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  insurance_name: string | null;
  insurance_plan: string | null;
  insurance_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type EvolutionNote = {
  id: string;
  patient_id: string;
  note_date: string;
  body: string;
  created_at: string;
};

export type Appointment = {
  id: string;
  patient_id: string | null;
  title: string | null;
  starts_at: string;
  ends_at: string | null;
  status: "agendado" | "confirmado" | "atendido" | "cancelado" | "ausente";
  notes: string | null;
};

export type Payment = {
  id: string;
  patient_id: string | null;
  amount: number;
  method: "efectivo" | "debito" | "credito" | "transferencia" | "otro";
  concept: string | null;
  paid_at: string;
};

// Estructura de la ficha de salud / antecedentes (JSONB flexible)
export type MedicalHistoryData = {
  conditions?: Record<string, string[]>; // { "Aparato Cardiovascular": ["Hipertensión"], ... }
  medication?: string[];
  allergies?: string[];
  comments?: string;
};

// Estado de una pieza dental en el odontograma
export type ToothState = {
  status?: string; // sano | caries | obturado | ausente | corona | implante | ...
  note?: string;
};
export type Odontogram = Record<string, ToothState>;

// Resultado de la transcripción por IA
export type TranscriptionResult = {
  patient: Partial<Patient>;
  medical_history?: MedicalHistoryData;
  evolution?: { note_date: string | null; body: string }[];
};
