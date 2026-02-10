import { useState, useEffect } from "react";

/**
 * Returns true only after `delay` ms of continuous loading.
 * Prevents skeleton flash when data loads fast (e.g., local SQLite).
 */
export function useDeferredLoading(loading: boolean, delay = 150): boolean {
  const [show, setShow] = useState(false);

  // Reset synchronously during render when loading stops (React "adjust state during render" pattern)
  const [prevLoading, setPrevLoading] = useState(loading);
  if (loading !== prevLoading) {
    setPrevLoading(loading);
    if (!loading) setShow(false);
  }

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [loading, delay]);

  return loading && show;
}
