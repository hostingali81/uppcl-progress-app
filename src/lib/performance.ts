// src/lib/performance.ts

type Measurement = {
  startTime: number;
  label: string;
};

export class PerformanceMonitor {
  private static measurements = new Map<string, Measurement>();

  static start(label: string): void {
    this.measurements.set(label, {
      startTime: performance.now(),
      label
    });
  }

  static end(label: string): number {
    const measurement = this.measurements.get(label);
    if (!measurement) return 0;

    const duration = performance.now() - measurement.startTime;
    this.measurements.delete(label);
    
    if (duration > 1000 && process.env.NODE_ENV === 'development') {
      // Only log in development for slow operations
      const warning = `Slow operation detected: ${label} took ${duration.toFixed(2)}ms`;
      console.warn(warning);
    }
    
    return duration;
  }

  static measure<T>(label: string, fn: () => T): T {
    this.start(label);
    try {
      return fn();
    } finally {
      this.end(label);
    }
  }

  static async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label);
    try {
      return await fn();
    } finally {
      this.end(label);
    }
  }
}

// React hook for measuring component render time
export function usePerformanceMonitor(componentName: string): () => void {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return () => void 0;
  }

  const label = `${componentName}_render`;
  PerformanceMonitor.start(label);
  
  return () => {
    PerformanceMonitor.end(label);
  };
}
