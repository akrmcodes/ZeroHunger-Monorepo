import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-emerald-50 px-6 py-16">
      <div className="flex max-w-xl flex-col items-center gap-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">ZeroHunger</p>
        <h1 className="text-3xl font-bold text-emerald-900">Landing Page</h1>
        <p className="text-base text-slate-700">
          Connect donors, volunteers, and recipients to reduce food waste. Login or register to get started.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-white transition hover:bg-emerald-700"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-md border border-emerald-600 px-4 py-2 text-emerald-700 transition hover:bg-emerald-50"
          >
            Register
          </Link>
        </div>
      </div>
    </main>
  );
}
