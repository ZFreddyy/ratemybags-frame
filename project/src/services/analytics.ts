// Simple analytics service
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  // In production, replace with your analytics provider (e.g., Mixpanel, PostHog)
  if (import.meta.env.PROD) {
    try {
      // Ensure properties are serializable by removing any non-serializable values
      const serializableProps = properties ? JSON.parse(JSON.stringify(properties)) : undefined;
      console.log('Analytics Event:', eventName, serializableProps);
    } catch (e) {
      console.warn('Failed to serialize analytics properties:', e);
    }
  }
}

export function trackError(error: Error | unknown, context?: Record<string, any>) {
  // Ensure we have a proper Error object
  const errorObj = error instanceof Error ? error : new Error(String(error));

  // In production, replace with your error tracking provider (e.g., Sentry)
  if (import.meta.env.PROD) {
    try {
      // Convert error to a plain object with only serializable properties
      const serializableError = {
        name: errorObj.name,
        message: errorObj.message,
        stack: errorObj.stack,
      };
      
      // Ensure context is serializable
      const serializableContext = context ? 
        JSON.parse(JSON.stringify(context)) : 
        undefined;
      
      console.error('Error:', serializableError, serializableContext);
    } catch (e) {
      // Fallback to basic error logging if serialization fails
      console.error('Error:', errorObj.message);
    }
  } else {
    // In development, log the full error
    console.error('Development Error:', errorObj);
  }
}

// Web Vitals tracking
export function reportWebVitals(metric: any) {
  // In production, send to your analytics service
  if (import.meta.env.PROD) {
    try {
      // Ensure metric is serializable
      const serializableMetric = JSON.parse(JSON.stringify(metric));
      console.log('Web Vital:', serializableMetric);
    } catch (e) {
      console.warn('Failed to serialize web vital metric:', e);
    }
  }
}