import AppBrand from './AppBrand.jsx';
import ExportImport from './ExportImport.jsx';

const FEATURES = [
  {
    title: 'Scan barcodes',
    body: 'Point your camera at an ISBN barcode — we decode it and look up the book.',
  },
  {
    title: 'ISBN lookup',
    body: 'Open Library and Google Books fill in title, author, and cover art.',
  },
  {
    title: 'Private & offline',
    body: 'Your shelf lives on this device. Browse and search without an account.',
  },
  {
    title: 'Export & import',
    body: 'Back up your catalog as JSON anytime, or move it to another device.',
  },
];

export default function LandingPage({ onAddBook, onExport, onImport, addButtonRef }) {
  return (
    <div className="landing">
      <header className="landing__top">
        <ExportImport onExport={onExport} onImport={onImport} />
      </header>

      <div className="landing__hero">
        <AppBrand
          as="div"
          logoSize="hero"
          showTagline={false}
          className="landing__brand"
        />

        <h1 className="landing__title">Catalog the books you actually own</h1>
        <p className="landing__subtitle">
          Shelfmark is your personal bookshelf — scanned from real life, stored on your device.
        </p>

        <button
          type="button"
          className="btn btn--primary btn--lg landing__cta"
          ref={addButtonRef}
          onClick={onAddBook}
        >
          Add your first book
        </button>
        <p className="landing__hint">Scan a barcode or type an ISBN to get started.</p>
      </div>

      <section className="landing__features" aria-labelledby="landing-features-heading">
        <h2 id="landing-features-heading" className="landing__features-title">
          How it works
        </h2>
        <ul className="landing__feature-list">
          {FEATURES.map((item) => (
            <li key={item.title} className="landing__feature">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
