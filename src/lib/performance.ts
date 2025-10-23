// src/lib/performance.ts
// Performance monitoring utilities

export class PerformanceMonitor {
  private static measurements: Map<string, number> = new Map();

  static start(label: string): void {
    this.measurements.set(label, performance.now());
  }

  static end(label: string): number {
    const startTime = this.measurements.get(label);
    if (!startTime) {
      console.warn(`Performance measurement "${label}" was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.measurements.delete(label);
    
    // Log slow operations (> 1 second)
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${label} took ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  static measure<T>(label: string, fn: () => T): T {
    this.start(label);
    const result = fn();
    const duration = this.end(label);
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`${label}: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }

  static async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label);
    const result = await fn();
    const duration = this.end(label);
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`${label}: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }
}

// React hook for measuring component render time
export function usePerformanceMonitor(componentName: string) {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    PerformanceMonitor.start(`${componentName}_render`);
    
    return () => {
      PerformanceMonitor.end(`${componentName}_render`);
    };
  }
  
  return () => {};
}
