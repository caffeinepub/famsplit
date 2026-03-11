import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-background">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-primary/6 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-fab overflow-hidden">
            <img
              src="/assets/generated/famsplit-logo-transparent.dim_120x120.png"
              alt="FamSplit"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center">
            <h1 className="font-display text-4xl font-bold text-foreground tracking-tight">
              FamSplit
            </h1>
            <p className="mt-2 text-muted-foreground text-sm leading-relaxed max-w-xs text-center">
              Split expenses with your family, track budgets, and settle up —
              all in one place.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="w-full grid grid-cols-3 gap-3">
          {[
            { emoji: "👨‍👩‍👧", label: "Family Groups" },
            { emoji: "💸", label: "Split Costs" },
            { emoji: "📊", label: "Track Budgets" },
          ].map((f) => (
            <div
              key={f.label}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border"
            >
              <span className="text-2xl">{f.emoji}</span>
              <span className="text-xs font-medium text-muted-foreground text-center leading-tight">
                {f.label}
              </span>
            </div>
          ))}
        </div>

        {/* Login button */}
        <Button
          size="lg"
          className="w-full h-13 text-base font-semibold rounded-xl shadow-fab"
          onClick={login}
          disabled={isLoggingIn}
          data-ocid="login.primary_button"
        >
          {isLoggingIn ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in to get started"
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Secure login via Internet Identity
        </p>
      </div>
    </div>
  );
}
