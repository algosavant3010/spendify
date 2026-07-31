import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted/70 isolate",
        "before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-foreground/10 before:to-transparent before:animate-[shimmer_1.6s_ease-in-out_infinite] motion-reduce:before:hidden motion-reduce:animate-pulse",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
