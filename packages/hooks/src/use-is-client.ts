import { useEffect, useState } from 'react';

/**
 * Check if code is running on the client side
 * Useful for SSR-safe code
 *
 * @returns Whether the code is running on the client
 *
 * @example
 * const isClient = useIsClient();
 *
 * if (!isClient) {
 *   return <LoadingSkeleton />;
 * }
 *
 * return <ClientOnlyComponent />;
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}
