import { useState, useEffect, useCallback } from "react";

const BASE = import.meta.env.VITE_API_URL || "";

export function useApi<T>(path: string, refreshMs = 0) {
  const [data, setData]     = useState<T | null>(null);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoad(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}${path}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoad(false);
    }
  }, [path]);

  useEffect(() => {
    fetch_();
    if (refreshMs > 0) {
      const t = setInterval(fetch_, refreshMs);
      return () => clearInterval(t);
    }
  }, [fetch_, refreshMs]);

  return { data, loading, error, refetch: fetch_ };
}
