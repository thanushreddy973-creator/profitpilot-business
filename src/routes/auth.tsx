import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — ProfitPilot" },
      {
        name: "description",
        content: "Sign in or create your ProfitPilot workspace to manage stock, suppliers and cash flow.",
      },
      { property: "og:title", content: "Sign in — ProfitPilot" },
      {
        property: "og:description",
        content: "Sign in or create your ProfitPilot workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { business_name: businessName || "My business" },
          },
        });
        if (error) throw error;
        const { data: session } = await supabase.auth.getSession();
        if (session.session) {
          navigate({ to: "/dashboard", replace: true });
          return;
        }
        setMessage("Check your inbox to confirm your email, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="panel-raised w-full max-w-sm p-6">
        <div className="flex items-center gap-2.5">
          <div className="num grid size-7 place-items-center rounded-md bg-elevated text-[11px] font-semibold text-accent ring-1 ring-white/5">
            P
          </div>
          <div className="leading-none">
            <div className="text-[13px] font-semibold tracking-tight">ProfitPilot</div>
            <div className="num mt-1 text-[10px] text-faint">Operator workspace</div>
          </div>
        </div>

        <h1 className="mt-6 text-lg font-semibold tracking-tight">
          {mode === "signin" ? "Sign in" : "Create your workspace"}
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Your products, suppliers and money stay private to your account.
        </p>

        <form onSubmit={submit} className="mt-5 space-y-3">
          {mode === "signup" ? (
            <div>
              <div className="label-mono mb-1">Business name</div>
              <input
                className="field"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Corner Store"
              />
            </div>
          ) : null}
          <div>
            <div className="label-mono mb-1">Email</div>
            <input
              className="field"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <div className="label-mono mb-1">Password</div>
            <input
              className="field"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="btn w-full" disabled={busy} type="submit">
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        {message ? <p className="mt-3 text-[12px] text-warn">{message}</p> : null}

        <button
          className="mt-4 text-[12px] text-muted-foreground underline-offset-2 hover:underline"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setMessage(null);
          }}
        >
          {mode === "signin"
            ? "New here? Create an account"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
