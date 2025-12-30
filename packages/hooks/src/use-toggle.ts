import { useCallback, useState } from 'react';

/**
 * Toggle a boolean state
 *
 * @param initialValue - The initial value
 * @returns A tuple of [value, toggle, setValue]
 *
 * @example
 * const [isOpen, toggle, setIsOpen] = useToggle(false);
 * <button onClick={toggle}>Toggle</button>
 */
export function useToggle(
  initialValue = false
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  return [value, toggle, setValue];
}
