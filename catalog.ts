// Catálogo de antecedentes médicos (ficha de salud) y medicación.
// Estándar del rubro odontológico; editable a gusto.

export const ANTECEDENTES: { group: string; items: string[] }[] = [
  {
    group: "Aparato Cardiovascular",
    items: ["Arritmia", "Cardiopatía isquémica", "Hipertensión", "Hipotensión", "Insuficiencia cardíaca", "Endocarditis"],
  },
  { group: "Aparato Respiratorio", items: ["Asma", "Bronquitis", "Disnea", "EPOC"] },
  { group: "Aparato Urinario", items: ["Diálisis", "Insuficiencia renal", "Trasplante renal"] },
  {
    group: "Aparato Digestivo y Hepático",
    items: ["Gastritis", "Hepatitis", "Cirrosis", "Úlceras", "Reflujo"],
  },
  { group: "Sistema Osteoarticular", items: ["Artritis", "Artrosis", "Osteoporosis"] },
  {
    group: "Sistema Hematopoyético",
    items: ["Anemia", "Coagulopatías", "Hemorragias", "Transfusiones"],
  },
  {
    group: "Sistema Endocrino y Metabólico",
    items: ["Diabetes", "Hipertiroidismo", "Hipotiroidismo"],
  },
  {
    group: "Sistema Nervioso",
    items: ["Convulsiones", "Epilepsia", "Desmayos", "Alteraciones emocionales"],
  },
  {
    group: "Enfermedades Infectocontagiosas",
    items: ["HIV", "Hepatitis", "Sífilis", "Tuberculosis"],
  },
  { group: "Estilo de Vida", items: ["Tabaco", "Alcohol", "Drogas"] },
  { group: "Mujeres", items: ["Embarazo", "Anticonceptivos orales", "Lactancia"] },
];

export const ALERGIAS = ["Analgésicos", "Anestesias", "Antibióticos", "Antiinflamatorios", "Látex", "Otros"];

export const MEDICACION = [
  "Ansiolíticos",
  "Antiagregantes",
  "Antibióticos",
  "Anticoagulantes",
  "Antidepresivos",
  "Antihipertensivos",
  "Antiinflamatorios",
  "Hipoglucemiantes",
  "Levotiroxina (T4)",
];

// Piezas dentales (sistema FDI) para el odontograma
export const TEETH_UPPER = [
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
];
export const TEETH_LOWER = [
  48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
];

export const TOOTH_STATUSES: { value: string; label: string; color: string }[] = [
  { value: "sano", label: "Sano", color: "#e2e8f0" },
  { value: "caries", label: "Caries", color: "#ef4444" },
  { value: "obturado", label: "Obturado", color: "#3b82f6" },
  { value: "corona", label: "Corona", color: "#f59e0b" },
  { value: "ausente", label: "Ausente", color: "#94a3b8" },
  { value: "implante", label: "Implante", color: "#10b981" },
  { value: "endodoncia", label: "Endodoncia", color: "#8b5cf6" },
];
