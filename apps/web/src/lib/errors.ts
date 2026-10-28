import axios from 'axios';

/** Turns an API error into a sentence the person can act on. */
export function errorText(e: unknown, fallback = 'Something went wrong. Try again.'): string {
  if (axios.isAxiosError(e)) {
    const msg = e.response?.data?.message;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg) && msg.length > 0) return msg.join(', ');
    if (!e.response) return 'Could not reach the server. Is the API running?';
  }
  return fallback;
}

export const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200';
