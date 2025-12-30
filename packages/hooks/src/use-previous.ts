import { useEffect, useRef } from 'react';

/**
 * Get the previous value of a state or prop
 *
 * @param value - The current value
 * @returns The previous value
 *
 * @example
 * const [count, setCount] = useState(0);
 * const previousCount = usePrevious(count);
 *
 * // previousCount will be the value of count from the previous render
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
