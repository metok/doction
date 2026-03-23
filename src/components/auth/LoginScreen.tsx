import { useAuth } from "@/lib/hooks/use-auth";

export function LoginScreen() {
  const { login, isLoading } = useAuth();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090f]">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.07] blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 h-[400px] w-[400px] rounded-full bg-purple-500/[0.05] blur-[100px]" />
      </div>

      {/* Card */}
      <div className="relative z-10 flex w-full max-w-[380px] flex-col items-center rounded-2xl border border-white/[0.06] bg-white/[0.03] px-10 py-14 backdrop-blur-xl">
        {/* Gradient border glow */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent opacity-50" style={{ maskImage: "linear-gradient(to bottom, black, transparent 50%)", WebkitMaskImage: "linear-gradient(to bottom, black, transparent 50%)" }} />

        {/* Logo */}
        <div className="relative mb-8">
          <div className="absolute -inset-4 rounded-3xl bg-accent/20 blur-xl" />
          <img
            src="/icons/icon.png"
            alt="Doction"
            className="relative h-20 w-20 rounded-2xl shadow-2xl shadow-accent/20"
          />
        </div>

        {/* Text */}
        <h1 className="mb-1 text-2xl font-bold tracking-tight text-white">Doction</h1>
        <p className="mb-10 text-sm text-white/40">
          Your Google Drive, reimagined.
        </p>

        {/* Sign in button */}
        <button
          onClick={login}
          disabled={isLoading}
          className="group flex w-full items-center justify-center gap-3 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-gray-900 shadow-lg shadow-white/10 transition-all hover:shadow-xl hover:shadow-white/20 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg
            viewBox="0 0 48 48"
            className="h-5 w-5 shrink-0"
          >
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          {isLoading ? "Connecting..." : "Continue with Google"}
        </button>

        {/* Divider */}
        <div className="my-8 flex w-full items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.06]" />
          <span className="text-[11px] uppercase tracking-widest text-white/20">or</span>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>

        {/* Features hint */}
        <div className="flex w-full flex-col gap-3">
          {[
            { emoji: "📄", text: "Google Docs rendered beautifully" },
            { emoji: "⌘", text: "Cmd+K to find anything" },
            { emoji: "🌙", text: "Dark mode, obviously" },
          ].map(({ emoji, text }) => (
            <div key={text} className="flex items-center gap-3 text-[13px] text-white/30">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] text-sm">{emoji}</span>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="absolute bottom-6 text-[11px] text-white/15">
        Open source · MIT License · Your data stays in Google Drive
      </p>
    </div>
  );
}
