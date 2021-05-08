import winston, { createLogger, format, transports } from "winston";

const loggerFormat: winston.Logform.Format = format.combine(
  format.colorize(),
  format.simple(),
);

const fmt = format.printf(({ level, message, timestamp, ...meta }) => {
  const {kind, program, ...fields} = meta;
  if (Object.keys(fields).length > 0) {
    return `${timestamp} ${level} [${kind}] [${program}]: ${message} ${JSON.stringify(fields)}`;
  }
  return `${timestamp} ${level} [${kind}] [${program}]: ${message}`;
});

const loggerOpts: winston.LoggerOptions = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp(),
    format.colorize(),
    fmt,
  ),
  transports: [
    new transports.Console(),
  ]
};

const rootLogger = createLogger(loggerOpts);

export function createYesBotLogger(kind: string, program: string): winston.Logger {
  return rootLogger.child({
    kind,
    program,
  });
}

