import { formatIsbn } from '../utils/isbn.js';

export default function BookCard({ book, onClick }) {
  const authorText = book.authors?.length ? book.authors.join(', ') : 'Unknown author';
  const label = `${book.title || 'Untitled'}, ${authorText}`;

  return (
    <button
      type="button"
      className="book-card"
      onClick={() => onClick(book)}
      aria-label={label}
    >
      <div className="book-card__cover">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt=""
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.add('visible');
            }}
          />
        ) : null}
        <div className={`book-card__placeholder ${book.coverUrl ? '' : 'visible'}`}>
          <span>{book.title?.charAt(0) || '?'}</span>
        </div>
      </div>
      <div className="book-card__info">
        <h3 className="book-card__title">{book.title || 'Untitled'}</h3>
        <p className="book-card__author">{authorText}</p>
      </div>
    </button>
  );
}

export function BookCover({ book, size = 'md' }) {
  return (
    <div className={`book-cover book-cover--${size}`}>
      {book.coverUrl ? (
        <img
          src={book.coverUrl}
          alt=""
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.add('visible');
          }}
        />
      ) : null}
      <div className={`book-cover__placeholder ${book.coverUrl ? '' : 'visible'}`}>
        <span>{book.title?.charAt(0) || '?'}</span>
      </div>
    </div>
  );
}

export function BookMeta({ book }) {
  return (
    <dl className="book-meta">
      <div>
        <dt>ISBN</dt>
        <dd>{formatIsbn(book.isbn)}</dd>
      </div>
      {book.authors?.length > 0 && (
        <div>
          <dt>Author{book.authors.length > 1 ? 's' : ''}</dt>
          <dd>{book.authors.join(', ')}</dd>
        </div>
      )}
      {book.publisher && (
        <div>
          <dt>Publisher</dt>
          <dd>{book.publisher}</dd>
        </div>
      )}
      {book.publishDate && (
        <div>
          <dt>Published</dt>
          <dd>{book.publishDate}</dd>
        </div>
      )}
    </dl>
  );
}
