import { useEffect, useState } from 'react';
import { getPlatform, installHintForPlatform } from '../utils/platform.js';

const DISMISS_KEY = 'shelfmark-install-hint-dismissed';

export default function InstallHint() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const platform = getPlatform();
    const hint = installHintForPlatform(platform);
    if (!hint) return;

    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') return;
    } catch {
      /* private mode */
    }

    setMessage(hint);
    setVisible(true);
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  }

  if (!visible) return null;

  return (
    <div className="install-hint" role="status">
      <p>{message}</p>
      <button type="button" className="install-hint__dismiss" onClick={dismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
