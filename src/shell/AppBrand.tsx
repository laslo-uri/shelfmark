import { cn } from "@/lib/utils";
import { AppLogo } from "@/shell/AppLogo";

export function AppBrand({
  logoSize = "md",
  showTagline = true,
  tagline = "Your personal bookshelf",
  className = "",
  as = "div",
}: {
  logoSize?: "sm" | "md" | "lg" | "hero";
  showTagline?: boolean;
  tagline?: string;
  className?: string;
  as?: "div" | "span";
}) {
  const Tag = as;

  return (
    <Tag className={cn("flex items-center gap-3", className)}>
      <AppLogo size={logoSize} alt="" />
      <div className="flex flex-col">
        <span className="font-display text-lg font-semibold tracking-tight">Shelfmark</span>
        {showTagline ? <span className="text-sm text-muted-foreground">{tagline}</span> : null}
      </div>
    </Tag>
  );
}
