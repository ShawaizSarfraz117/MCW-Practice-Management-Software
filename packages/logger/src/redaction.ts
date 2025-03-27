import pino from 'pino';
import { config } from './config';


export const serializers = {
  err: pino.stdSerializers.err,
  
  // Custom serializer for SQL queries
  query: (query: string): string => {
    if (typeof query !== 'string') return query;
    
    // Get sensitive fields from config
    const sensitiveFields = config.redactFields;
    
    // Initialize redacted query
    let redactedQuery = query;
    
    // Apply redaction for each sensitive field
    sensitiveFields.forEach(field => {
      // Pattern: field = 'value' or field = "value"
      const pattern = new RegExp(`(${field}\\s*=\\s*['"])[^'"]+(['"])`, 'gi');
      redactedQuery = redactedQuery.replace(pattern, '$1[REDACTED]$2');
      
      // Pattern: field:'value' or field:"value" (JSON)
      const jsonPattern = new RegExp(`(["']${field}["']\\s*:\\s*["'])[^'"]+(['"])`, 'gi');
      redactedQuery = redactedQuery.replace(jsonPattern, '$1[REDACTED]$2');
    });
    
    return redactedQuery;
  },
  
  req: (req: any): object => {
    const serialized = pino.stdSerializers.req(req);
    return serialized;
  },
  
  res: (res: any): object => {
    return pino.stdSerializers.res(res);
  }
};

/**
 * Get redaction configuration for Pino
 */
export function getRedactionConfig() {
  return {
    paths: config.getRedactionPaths(),
    censor: '[REDACTED]',
    remove: false
  };
}

/**
 * Get redaction paths for Pino
 * @returns Array of paths for redaction
 */
export function getRedactionPaths(): string[] {
  return config.getRedactionPaths();
}