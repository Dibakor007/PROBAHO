import { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';

const rawApiUrl = (import.meta.env.VITE_API_URL || 'https://probaho-backend-vdxy.onrender.com').replace(/\/+$/, '');
const API_BASE = rawApiUrl.endsWith('/ai') ? rawApiUrl.slice(0, -3) : rawApiUrl;

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export function useHealthCheck() {
  const [status, setStatus] = useState('checking'); // 'checking' | 'healthy' | 'waking' | 'demo'
  const intervalRef = useRef(null);

  const check = useCallback(async () => {
    try {
      const res = await api.get('/ai/health', { timeout: 3000 });
      if (res.data?.status === 'healthy' || res.status === 200) {
        setStatus('healthy');
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        setStatus('demo');
      }
    } catch {
      setStatus('demo');
    }
  }, []);

  useEffect(() => {
    check();
    intervalRef.current = setInterval(check, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [check]);

  return { status, retry: check };
}

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const get = useCallback(async (url, config = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(url, config);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Request failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const post = useCallback(async (url, data = {}, config = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(url, data, config);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Request failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { get, post, loading, error };
}

export { api, API_BASE };
export default useApi;
