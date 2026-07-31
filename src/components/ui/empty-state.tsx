import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** compact = sidebar tiles, default = main column, chart = tall canvas replacement */
  size?: "compact" | "default" | "chart";
  className?: string;
}

/**
 * Editorial empty state — hairline frame, ruled illustration, serif headline.
 * Used wherever a chart, list or metric has no data yet.
 */
export const EmptyState = ({
  icon: Icon,
  eyebrow,
  title,
  description,
  action,
  size = "default",
  className,
}: EmptyStateProps) => {
  const pad =
    size === "compact" ? "py-8" : size === "chart" ? "py-16 sm:py-20" : "py-12 sm:py-14";

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center text-center px-6",
        "rounded-sm border border-dashed border-border/70 bg-muted/20",
        pad,
        className
      )}
    >
      {/* ruled paper backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-sm opacity-[0.35]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(180deg, transparent 0px, transparent 23px, hsl(var(--border)) 23px, hsl(var(--border)) 24px)",
          maskImage: "radial-gradient(ellipse at center, black 10%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 10%, transparent 72%)",
        }}
      />

      <div className="relative flex flex-col items-center">
        <div
          className={cn(
            "grid place-items-center rounded-sm border border-border/70 bg-card text-primary",
            size === "compact" ? "h-9 w-9" : "h-12 w-12"
          )}
          style={{ boxShadow: "var(--shadow-sm)" }}
        >
          <Icon className={size === "compact" ? "h-4 w-4" : "h-5 w-5"} strokeWidth={1.5} />
        </div>

        {eyebrow && <div className="eyebrow mt-5">{eyebrow}</div>}

        <h3
          className={cn(
            "font-display tracking-tight mt-2.5",
            size === "compact" ? "text-xl" : "text-2xl sm:text-3xl"
          )}
        >
          {title}
        </h3>

        {description && (
          <p
            className={cn(
              "text-muted-foreground leading-relaxed mt-2 text-balance",
              size === "compact" ? "text-xs max-w-[26ch]" : "text-sm max-w-[42ch]"
            )}
          >
            {description}
          </p>
        )}

        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  );
};

export default EmptyState;
