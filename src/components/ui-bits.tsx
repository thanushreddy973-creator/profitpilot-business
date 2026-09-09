import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "default",
  wide = false,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "ok" | "warn" | "danger" | "accent";
  wide?: boolean;
}) {
  const toneClass =
    tone === "ok"
      ? "text-ok"
      : tone === "warn"
        ? "text-warn"
        : tone === "danger"
          ? "text-danger"
          : tone === "accent"
            ? "text-accent"
            : "text-foreground";
  return (
    <div className={cn(wide ? "panel-raised col-span-2 p-4" : "panel p-3", "min-w-0")}>
      <div className="label-mono">{label}</div>
      <div
        className={cn(
          "num mt-1.5 truncate font-semibold",
          wide ? "text-[26px]" : "text-[17px]",
          toneClass,
        )}
      >
        {value}
      </div>
      {hint ? <div className="num mt-1 text-[10px] text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

export function Chip({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "ok" | "warn" | "danger" | "accent";
}) {
  const tones: Record<string, string> = {
    muted: "bg-elevated text-muted-foreground",
    ok: "bg-ok/12 text-ok",
    warn: "bg-warn/12 text-warn",
    danger: "bg-danger/12 text-danger",
    accent: "bg-accent/12 text-accent",
  };
  return (
    <span
      className={cn(
        "num inline-flex shrink-0 items-center rounded-md px-2 py-1 text-[10px] font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel flex flex-col items-center gap-2 px-6 py-12 text-center">
      <p className="text-[15px] font-semibold">{title}</p>
      <p className="max-w-md text-[13px] text-muted-foreground">{body}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
