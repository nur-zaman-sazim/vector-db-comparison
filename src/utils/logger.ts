import { trace, context } from "@opentelemetry/api";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import * as winston from "winston";
import "winston-daily-rotate-file";

function createLogDirectory() {
  const logDir = join(process.cwd(), "logs");
  if (!existsSync(logDir)) {
    mkdirSync(logDir);
  }
  return logDir;
}

const addTraceId = winston.format((info) => {
  const spanContext = trace.getSpan(context.active())?.spanContext();
  info.traceId = spanContext?.traceId;
  return info;
});

function getErrorMessage(error: unknown): string {
  if (!error) {
    return "";
  }

  if (error instanceof Error) {
    return error.stack?.toString() ?? error.message;
  }

  if (typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return `${error}`;
}

function getFormattedError(error: unknown): string {
  if (!error) {
    return "";
  }

  if (Array.isArray(error)) {
    return error.reduce((acc, e) => {
      acc += getErrorMessage(e);
      return acc;
    }, "");
  }

  if (error instanceof Error) {
    return error.stack?.toString() ?? error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return `${error}`;
}

function getLogFormat() {
  const logFormat = winston.format.printf((info) => {
    const { timestamp, level, message, context, traceId, stack: error } = info;

    const formattedTimestamp = new Date(timestamp).toLocaleString();
    const formattedLevel = `[${level}]`;
    const formattedTraceId = traceId ? `[Trace: ${traceId}]` : "";
    const formattedContext = typeof context === "string" ? `[${context}]` : "";
    const formattedMessage = typeof message === "object" ? JSON.stringify(message) : message;
    const formattedContextObject = typeof context === "object" ? JSON.stringify(context) : "";
    const formattedError = getFormattedError(error);

    return `${formattedTimestamp} ${formattedLevel} ${formattedTraceId} ${formattedContext} ${formattedMessage} ${formattedContextObject} ${formattedError}`;
  });
  return logFormat;
}

export default function getWinstonLoggerTransports() {
  const maxLogFiles = 7;
  const logDir = createLogDirectory();
  const logFormat = getLogFormat();

  const format = winston.format.combine(
    addTraceId(),
    winston.format.errors({ stack: true }),
    winston.format.timestamp(),
    winston.format.splat(),
    winston.format.colorize({ all: true }),
    logFormat,
  );

  return [
    new winston.transports.DailyRotateFile({
      format,
      level: "debug",
      datePattern: "YYYY-MM-DD",
      dirname: logDir + "/debug",
      filename: `%DATE%.log`,
      maxFiles: maxLogFiles,
      json: false,
      zippedArchive: true,
    }),

    new winston.transports.DailyRotateFile({
      format,
      level: "error",
      datePattern: "YYYY-MM-DD",
      dirname: logDir + "/error",
      filename: `%DATE%.log`,
      maxFiles: maxLogFiles,
      handleExceptions: true,
      json: false,
      zippedArchive: true,
    }),

    new winston.transports.Console({
      format,
      level: "debug",
      handleExceptions: true,
    }),
  ];
}
