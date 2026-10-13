import { cn } from "@/lib/utils";

const SIZES = {
  sm: 28,
  md: 36,
  lg: 48,
  hero: 96,
} as const;

type LogoSize = keyof typeof SIZES;

/** App mark — same artwork as favicon / desktop icon. */
export function AppLogo({
  size = "md",
  className = "",
  alt = "",
}: {
  size?: LogoSize;
  className?: string;
  alt?: string;
}) {
  const px = SIZES[size] ?? SIZES.md;

  return (
    <img
      src="/logo.svg"
      alt={alt}
      width={px}
      height={px}
      className={cn("app-logo", className)}
      draggable={false}
      decoding="async"
    />
  );
}
