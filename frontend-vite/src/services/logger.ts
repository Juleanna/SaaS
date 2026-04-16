const isDev = import.meta.env.DEV;

type LogFn = (...args: unknown[]) => void;

const logger: { error: LogFn; warn: LogFn; log: LogFn } = {
  error: (...args) => {
    if (isDev) console.error(...args);
  },
  warn: (...args) => {
    if (isDev) console.warn(...args);
  },
  log: (...args) => {
    if (isDev) console.log(...args);
  },
};

export default logger;
