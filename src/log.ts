import winston, { createLogger, format, transports } from "winston";

const USE_COLORS = process.stdout.isTTY;
const SHOW_TIMESTAMP = process.stdout.isTTY;

const fmt = format.printf(({ level, message, timestamp, ...meta }) => {
  const { kind, program, ...fields } = meta;

  let out = "";
  if (SHOW_TIMESTAMP) {
    out += `${timestamp} `;
  }

  // Add a json-kinda dict with metadata if present
  if (Object.keys(fields).length > 0) {
    return `${out}${level} [${kind}] [${program}]: ${message} ${JSON.stringify(
      fields
    )}`;
  }
  return `${out}${level} [${kind}] [${program}]: ${message}`;
});

let formatters: winston.Logform.Format[] = [];

// If this is a TTY, enable colors
if (USE_COLORS) {
  formatters.push(format.colorize());
}

// And some simple timestamps
if (SHOW_TIMESTAMP) {
  formatters.push(
    format.timestamp({
      format: "HH:mm:ss.SSS",
    })
  );
}

// Lastly, add our own formatter.
formatters.push(fmt);

const loggerOpts: winston.LoggerOptions = {
  level: process.env.LOG_LEVEL ?? "debug",
  format: format.combine(...formatters),
  transports: [new transports.Console()],
};

const rootLogger = createLogger(loggerOpts);

export function createYesBotLogger(
  kind: string,
  program: string
): winston.Logger {
  return rootLogger.child({
    kind,
    program,
  });
}
