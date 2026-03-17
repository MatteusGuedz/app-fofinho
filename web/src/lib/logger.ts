export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogEvent = {
  id: string;
  at: string;
  level: LogLevel;
  scope: string;
  message: string;
  data?: unknown;
};

const STORE_KEY = 'wedding_app_logs_v1';
const MAX = 400;

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readStore(): LogEvent[] {
  return safeJsonParse<LogEvent[]>(localStorage.getItem(STORE_KEY)) ?? [];
}

function writeStore(events: LogEvent[]) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(events.slice(-MAX)));
  } catch {
    // ignore
  }
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function log(scope: string, level: LogLevel, message: string, data?: unknown) {
  const evt: LogEvent = {
    id: makeId(),
    at: new Date().toISOString(),
    level,
    scope,
    message,
    data,
  };

  const store = readStore();
  store.push(evt);
  writeStore(store);

  // Console logs para diagnóstico (como você pediu).
  // eslint-disable-next-line no-console
  const fn =
    level === 'debug'
      ? console.debug
      : level === 'info'
        ? console.info
        : level === 'warn'
          ? console.warn
          : console.error;
  fn(`[${scope}] ${message}`, data ?? '');

  return evt;
}

export function getLogs(): LogEvent[] {
  return readStore();
}

export function clearLogs() {
  localStorage.removeItem(STORE_KEY);
}

