export function StatusFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="flex h-7 shrink-0 items-center justify-between gap-3 border-t border-border bg-background px-3 text-[11px] text-muted-foreground">
      <span>Shelfmark</span>
      <span className="truncate text-right">
        Made by{" "}
        <a href="https://laslouri.com" className="text-foreground hover:underline" target="_blank" rel="noopener noreferrer">
          laslouri.com
        </a>
        {" · "}© {year}
      </span>
    </footer>
  );
}
