import AppLogo from './AppLogo.jsx';

export default function AppBrand({
  logoSize = 'md',
  showTagline = true,
  tagline = 'Your personal bookshelf',
  className = '',
  as = 'div',
}) {
  const Tag = as;

  return (
    <Tag className={['app-brand', className].filter(Boolean).join(' ')}>
      <AppLogo size={logoSize} alt="" />
      <div className="app-brand__text">
        <span className="app-brand__name">Shelfmark</span>
        {showTagline ? <span className="app-brand__tagline">{tagline}</span> : null}
      </div>
    </Tag>
  );
}
