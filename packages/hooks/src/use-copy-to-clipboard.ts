import { useCallback, useState } from 'react';

interface UseCopyToClipboardResult {
  copiedText: string | null;
  copy: (text: string) => Promise<boolean>;
  reset: () => void;
}

/**
 * Copy text to clipboard
 *
 * @returns Object with copiedText, copy function, and reset function
 *
 * @example
 * const { copiedText, copy } = useCopyToClipboard();
 *
 * <button onClick={() => copy('Hello, World!')}>
 *   {copiedText ? 'Copied!' : 'Copy'}
 * </button>
 */
export function useCopyToClipboard(): UseCopyToClipboardResult {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copy = useCallback(async (text: string): Promise<boolean> => {
    if (!navigator?.clipboard) {
      console.warn('Clipboard not supported');
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      return true;
    } catch (error) {
      console.warn('Copy failed', error);
      setCopiedText(null);
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setCopiedText(null);
  }, []);

  return { copiedText, copy, reset };
}
