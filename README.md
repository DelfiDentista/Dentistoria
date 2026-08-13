# Historia Clínica Odontológica

App web para digitalizar y gestionar historias clínicas de un consultorio odontológico:
pacientes, antecedentes (ficha de salud), evolución fechada, odontograma, turnos y caja.
Incluye **transcripción por IA**: subís la foto de una ficha en papel y se autocompletan los datos.

**Stack:** Next.js 14 (App Router) · Supabase (Postgres + Auth + Storage) · Tailwind CSS · Anthropic Claude (visión).

> App de un solo usuario para arrancar. La seguridad a nivel de fila (RLS) ya está activa;
> el modo multiusuario con roles se puede sumar más adelante.

---

## 1. Requisitos

- Node.js 18 o superior
- Una cuenta gratuita en [Supabase](https://supabase.com), [Vercel](https://vercel.com) y [GitHub](https://github.com)
- (Opcional pero recomendado) una API key de [Anthropic](https://console.anthropic.com) para la transcripción por IA

---

## 2. Configurar Supabase (base de datos)

1. Entrá a Supabase → **New project**. Elegí nombre y contraseña de la base.
2. Cuando esté listo, andá a **SQL Editor → New query**, pegá **todo** el contenido de
   [`supabase/schema.sql`](./supabase/schema.sql) y presioná **Run**. Esto crea las tablas,
   las políticas de seguridad y el bucket de storage `fichas`.
3. Creá tu usuario: **Authentication → Users → Add user** (email + contraseña).
   Con ese usuario vas a iniciar sesión en la app.
4. Copiá tus claves desde **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 3. Probar localmente (opcional)

```bash
npm install
cp .env.example .env.local     # y completá tus claves
npm run dev
```

Abrí http://localhost:3000 e iniciá sesión con el usuario que creaste.

---

## 4. Subir a GitHub

```bash
git init
git add .
git commit -m "Historia clínica odontológica - versión inicial"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/historia-clinica.git
git push -u origin main
```

> El `.gitignore` ya excluye `node_modules` y los archivos `.env`, así que tus claves
> **no** se suben al repositorio.

---

## 5. Deploy en Vercel

1. Entrá a Vercel → **Add New → Project → Import Git Repository** y elegí tu repo.
2. Framework: **Next.js** (se detecta solo). No cambies el build command.
3. En **Environment Variables**, cargá:

   | Variable | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | tu Project URL de Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | tu anon key |
   | `ANTHROPIC_API_KEY` | tu API key de Anthropic (opcional) |
   | `ANTHROPIC_MODEL` | `claude-3-5-sonnet-latest` (opcional) |

4. **Deploy**. En 1-2 minutos tenés tu URL pública.

Cada `git push` a `main` vuelve a deployar automáticamente.

---

## 6. Cómo se usa

- **Pacientes:** listado con buscador por nombre/DNI y alta de paciente.
- **Nuevo paciente:** cargás los datos a mano, **o** subís la foto de la ficha en papel y la
  IA completa nombre, DNI, fecha de nacimiento, domicilio, obra social, antecedentes y las
  entradas de evolución. Revisás y guardás.
- **Ficha del paciente** (pestañas):
  - *Información:* datos personales y obra social.
  - *Antecedentes:* casilleros por sistema, medicación, alergias y comentarios.
  - *Evolución:* línea de tiempo de visitas, cada una con su fecha.
  - *Odontograma:* piezas dentales clickeables con estados (caries, obturado, corona, etc.).
- **Turnos:** agenda de próximos turnos con estados.
- **Caja:** registro de pagos con totales del mes.

---

## 7. Notas importantes

- **Datos sensibles:** son datos de salud. La app usa autenticación y RLS. Al ser un
  proyecto propio, sos responsable del tratamiento de los datos según la
  **Ley 25.326** (protección de datos personales, Argentina). Recomendado: mantené el
  acceso restringido y hacé backups desde Supabase.
- **Costo de la IA:** la transcripción consume la API de Anthropic (se paga por uso). Si no
  cargás `ANTHROPIC_API_KEY`, la app funciona igual pero sin el botón de transcripción
  (carga manual).
- **Escalar a multiusuario:** cuando quieras varios profesionales con login propio, se agrega
  una tabla de perfiles/roles y se refinan las políticas RLS. La base ya guarda `created_by`
  en cada registro para facilitarlo.

---

## 8. Estructura del proyecto

```
src/
  app/
    login/                  # pantalla de login
    (app)/                  # área autenticada (con barra lateral)
      patients/             # lista, alta y ficha con pestañas
      appointments/         # turnos
      cash/                 # caja
    api/transcribe/         # endpoint de transcripción por IA
  components/               # formularios y pestañas (UI)
  lib/
    supabase/               # clientes browser/server + middleware de sesión
    catalog.ts              # catálogo de antecedentes, medicación, piezas
    types.ts, format.ts     # tipos y helpers
supabase/schema.sql         # esquema de base de datos + RLS + storage
```
