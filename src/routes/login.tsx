import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { GROK_PROVIDERS, signIn } from "@/lib/auth/client";
import { supabase } from "@/lib/supabase";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isPending && user) void navigate({ to: "/" });
  }, [isPending, user?.id, navigate]);

  if (!isPending && user) {
    return <LoginFrame><p className="text-sm text-muted">Opening your wardrobe…</p></LoginFrame>;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = mode === "signup"
        ? await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim() }, emailRedirectTo: new URL("/", window.location.origin).toString() } })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) throw result.error;
      if (mode === "signup" && !result.data.session) {
        setError("Account created. Check your email to confirm your address, then log in.");
        setMode("signin");
        return;
      }
      await navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <LoginFrame>
      <div className="mb-8">
        <img src="/brand/logo-lockup.webp" alt="Wearly — Your personal style companion" className="brand-logo h-20 w-auto max-w-[230px] object-contain object-left" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Your wardrobe, wherever you go</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">{mode === "signin" ? "Welcome back." : "Make it yours."}</h1>
      <p className="mt-2 text-sm leading-6 text-muted">{mode === "signin" ? "Sign in to pick up right where your last outfit left off." : "Create your free account and build a wardrobe that travels with you."}</p>

      <div className="mt-7 grid grid-cols-2 rounded-full border border-line bg-tile p-1">
        <button type="button" onClick={() => { setMode("signin"); setError(""); }} className={`min-h-10 rounded-full text-sm font-semibold ${mode === "signin" ? "bg-surface shadow-sm" : "text-muted"}`}>Log in</button>
        <button type="button" onClick={() => { setMode("signup"); setError(""); }} className={`min-h-10 rounded-full text-sm font-semibold ${mode === "signup" ? "bg-surface shadow-sm" : "text-muted"}`}>Create account</button>
      </div>

      <form onSubmit={submit} className="mt-5 space-y-3">
        {mode === "signup" && <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Your name</span>
          <input required minLength={2} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="How should we call you?" className="min-h-12 w-full rounded-xl border border-line bg-surface px-4 outline-none focus-visible:ring-2 focus-visible:ring-brand" />
        </label>}
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Email address</span>
          <span className="relative block"><Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" /><input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="min-h-12 w-full rounded-xl border border-line bg-surface pl-11 pr-4 outline-none focus-visible:ring-2 focus-visible:ring-brand" /></span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Password</span>
          <span className="relative block"><LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" /><input required minLength={8} type={showPassword ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="min-h-12 w-full rounded-xl border border-line bg-surface pl-11 pr-12 outline-none focus-visible:ring-2 focus-visible:ring-brand" /><button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center text-muted">{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></span>
        </label>
        {error && <p role="alert" className="rounded-lg bg-tile p-3 text-sm text-ink">{error}</p>}
        <button disabled={busy} type="submit" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-on-brand transition-opacity hover:opacity-90 disabled:opacity-60">{busy ? "Please wait…" : mode === "signin" ? "Log in to Wearly" : "Create my account"} <ArrowRight size={16}/></button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line"/><span>OR CONTINUE WITH</span><span className="h-px flex-1 bg-line"/></div>
      <div className="grid grid-cols-2 gap-2">
        {GROK_PROVIDERS.map((provider) => <button key={provider.providerId} type="button" onClick={() => void signIn(provider.providerId, { callbackURL: "/" }).catch((err) => setError(err instanceof Error ? err.message : "Sign-in failed"))} className="min-h-11 rounded-full border border-line bg-surface text-sm font-medium hover:bg-tile">Continue with {provider.label}</button>)}
      </div>
      <p className="mt-6 text-center text-xs leading-5 text-muted">Your wardrobe and style profile are private to your account. By continuing, you agree to use Wearly respectfully.</p>
    </LoginFrame>
  );
}

function LoginFrame({ children }: { children: ReactNode }) {
  return <main className="grid min-h-dvh bg-bg text-ink lg:grid-cols-[1fr_0.9fr]">
    <aside className="relative hidden overflow-hidden bg-tile p-12 lg:flex lg:flex-col lg:justify-between">
      <img src="/brand/logo-lockup.webp" alt="Wearly" className="w-44 object-contain object-left"/>
      <div className="max-w-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">A better relationship with your wardrobe</p>
        <h2 className="mt-4 font-display text-5xl font-semibold leading-[1.08]">Wear what you own. Discover what works.</h2>
        <p className="mt-5 max-w-sm text-muted">A calmer way to plan outfits, understand your colours and make every piece count.</p>
      </div>
      <p className="text-xs text-muted">Wearly · Your personal style companion</p>
    </aside>
    <section className="mx-auto flex w-full max-w-md flex-col justify-center px-6 py-10">{children}</section>
  </main>;
}
