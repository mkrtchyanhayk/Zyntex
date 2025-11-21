import { useEffect, useState } from 'react';
import api from '../api';

export default function useMe(enabled) {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/api/users/me');
        if (!cancelled) setMe(data);
      } catch (e) {
        if (!cancelled) setError('Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [enabled]);

  return { me, loading, error };
}

