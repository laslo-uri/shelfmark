import { useEffect, useState } from "react";

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

export function useMaxWidth(width: number): boolean {
  return useMediaQuery(`(max-width: ${width - 1}px)`);
}

export function useMinWidth(width: number): boolean {
  return useMediaQuery(`(min-width: ${width}px)`);
}
