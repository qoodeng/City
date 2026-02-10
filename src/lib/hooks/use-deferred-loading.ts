import { useState, useEffect } from "react";

/**
 * Returns true only after `delay` ms of continuous loading.
 * Prevents skeleton flash when data loads fast (e.g., local SQLite).
 */
export function useDeferredLoading(loading: boolean, delay = 150): boolean {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!loading) {
      setShow(false);
      return;
    }
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [loading, delay]);

  return loading && show;
}
