import { useEffect, useState, type RefObject } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

interface IntersectionResult {
  isIntersecting: boolean;
  entry?: IntersectionObserverEntry;
}

/**
 * Observe when an element intersects with the viewport
 *
 * @param ref - The ref of the element to observe
 * @param options - The IntersectionObserver options
 * @returns The intersection state and entry
 *
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * const { isIntersecting } = useIntersectionObserver(ref, { threshold: 0.5 });
 *
 * return (
 *   <div ref={ref} className={isIntersecting ? 'visible' : 'hidden'}>
 *     Content
 *   </div>
 * );
 */
export function useIntersectionObserver<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  options: UseIntersectionObserverOptions = {}
): IntersectionResult {
  const { threshold = 0, root = null, rootMargin = '0px', freezeOnceVisible = false } = options;

  const [result, setResult] = useState<IntersectionResult>({
    isIntersecting: false,
    entry: undefined,
  });

  const frozen = result.isIntersecting && freezeOnceVisible;

  useEffect(() => {
    const element = ref.current;

    if (!element || frozen) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setResult({
            isIntersecting: entry.isIntersecting,
            entry,
          });
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, threshold, root, rootMargin, frozen]);

  return result;
}
