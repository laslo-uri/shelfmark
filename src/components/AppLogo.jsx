const SIZES = {
  sm: 28,
  md: 36,
  lg: 48,
  hero: 96,
};

/** App mark — same artwork as favicon / desktop icon. */
export default function AppLogo({ size = 'md', className = '', alt = '' }) {
  const px = SIZES[size] ?? SIZES.md;

  return (
    <img
      src="/logo.svg"
      alt={alt}
      width={px}
      height={px}
      className={['app-logo', `app-logo--${size}`, className].filter(Boolean).join(' ')}
      draggable={false}
      decoding="async"
    />
  );
}
