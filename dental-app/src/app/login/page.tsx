import { signIn } from "@/app/auth-actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Historia Clínica
          </h1>
          <p className="text-sm text-slate-500">Consultorio odontológico</p>
        </div>

        <form action={signIn} className="card space-y-4">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="input"
              placeholder="vos@consultorio.com"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="input"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Ingresar
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-400">
          El usuario se crea desde Supabase → Authentication → Users.
        </p>
      </div>
    </main>
  );
}
