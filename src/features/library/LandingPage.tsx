import type { RefObject } from "react";
import { ScanBarcodeIcon, BookOpenIcon, LibraryIcon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppBrand } from "@/shell/AppBrand";

const FEATURES = [
  {
    title: "Scan barcodes",
    body: "Point your camera at an ISBN barcode — we decode it and look up the book.",
    icon: ScanBarcodeIcon,
  },
  {
    title: "ISBN lookup",
    body: "Open Library and Google Books fill in title, author, and cover art.",
    icon: BookOpenIcon,
  },
  {
    title: "Private & offline",
    body: "Your shelf lives on this device. Browse and search without an account.",
    icon: LibraryIcon,
  },
  {
    title: "Export & import",
    body: "Back up your catalog as JSON anytime, or move it to another device.",
    icon: UploadIcon,
  },
];

export function LandingPage({
  onAddBook,
  addButtonRef,
}: {
  onAddBook: () => void;
  addButtonRef?: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-8 sm:py-12">
      <div className="flex flex-col items-start gap-4">
        <AppBrand as="div" logoSize="hero" showTagline={false} />
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Catalog the books you actually own
        </h1>
        <p className="max-w-xl text-base text-muted-foreground">
          Shelfmark is your personal bookshelf — scanned from real life, stored on your device.
        </p>
        <Button ref={addButtonRef} type="button" size="lg" onClick={onAddBook}>
          Add your first book
        </Button>
        <p className="text-sm text-muted-foreground">Scan a barcode or type an ISBN to get started.</p>
      </div>
      <section aria-labelledby="landing-features-heading" className="grid gap-3 sm:grid-cols-2">
        <h2 id="landing-features-heading" className="sr-only">
          How it works
        </h2>
        {FEATURES.map((item) => (
          <Card key={item.title} className="border bg-card p-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <item.icon className="size-4 text-primary" />
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.body}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
