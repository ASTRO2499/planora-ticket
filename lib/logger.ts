type LogLevel = 'info' | 'warn' | 'error'

type LogContext = Record<string, unknown>

function log(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  }
  const line = JSON.stringify(entry)
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export function logInfo(message: string, context?: LogContext) {
  log('info', message, context)
}

export function logWarn(message: string, context?: LogContext) {
  log('warn', message, context)
}

export function logError(message: string, context?: LogContext) {
  log('error', message, context)
}
