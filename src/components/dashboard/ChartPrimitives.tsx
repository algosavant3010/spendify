import { formatCurrency } from "@/utils/currency";

/** Refined recharts tooltip — glassy card, tabular numerals, soft shadow */
export const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-sm border border-border/70 bg-popover/95 backdrop-blur-md shadow-lg px-3 py-2 text-xs animate-in fade-in-0 zoom-in-95 duration-150"
      style={{ boxShadow: "var(--shadow-lg)" }}
    >
      {label !== undefined && (
        <div className="eyebrow mb-1.5 !text-[10px]">{label}</div>
      )}
      <div className="space-y-1">
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full ring-2 ring-background"
                style={{ backgroundColor: p.color || p.payload?.color || "hsl(var(--primary))" }}
              />
              <span className="text-muted-foreground capitalize">{p.name}</span>
            </div>
            <span className="font-medium tabular text-foreground">
              {typeof p.value === "number" ? formatCurrency(p.value) : p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/** Cursor highlight for bar/area charts on hover */
export const chartCursor = {
  fill: "hsl(var(--primary) / 0.06)",
  stroke: "hsl(var(--primary) / 0.25)",
  strokeWidth: 1,
  strokeDasharray: "3 3",
};

/** Animated skeleton block that mimics a chart canvas */
export const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <div
    className="relative w-full overflow-hidden rounded-sm bg-muted/40 isolate"
    style={{ height }}
  >
    {/* faux axis lines */}
    <div className="absolute inset-0 grid grid-rows-4 opacity-40">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="border-t border-dashed border-border/60" />
      ))}
    </div>
    {/* faux bars */}
    <div className="absolute inset-x-6 bottom-6 top-6 flex items-end gap-3">
      {[55, 32, 78, 44, 66, 28, 82].map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm bg-gradient-to-t from-primary/30 to-primary/5"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
    {/* shimmer */}
    <div
      className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-foreground/10 to-transparent motion-reduce:hidden"
      style={{ animation: "shimmer 1.8s ease-in-out infinite" }}
    />
  </div>
);
