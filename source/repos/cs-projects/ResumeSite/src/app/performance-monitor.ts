// Web Vitals and performance monitoring
export interface WebVitals {
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  FCP?: number; // First Contentful Paint
}

export class PerformanceMonitor {
  private vitals: WebVitals = {};

  init() {
    this.measureCoreWebVitals();
    this.monitorPerformance();
  }

  private measureCoreWebVitals() {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.vitals.LCP = lastEntry.renderTime || lastEntry.startTime;
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // LCP not supported
      }

      // Cumulative Layout Shift
      try {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
              this.vitals.CLS = clsValue;
            }
          }
        });
        observer.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        // CLS not supported
      }

      // First Contentful Paint
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              this.vitals.FCP = entry.startTime;
            }
          });
        });
        observer.observe({ entryTypes: ['paint'] });
      } catch (e) {
        // FCP not supported
      }
    }
  }

  private monitorPerformance() {
    // Log performance metrics to console
    window.addEventListener('load', () => {
      setTimeout(() => {
        console.group('Web Vitals');
        console.log('LCP:', this.vitals.LCP?.toFixed(2), 'ms');
        console.log('FCP:', this.vitals.FCP?.toFixed(2), 'ms');
        console.log('CLS:', this.vitals.CLS?.toFixed(4));
        console.groupEnd();
      }, 0);
    });
  }

  getVitals() {
    return this.vitals;
  }

  // Optimize images with lazy loading
  static setupLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset['src'] || '';
            img.removeAttribute('data-src');
            observer.unobserve(entry.target);
          }
        });
      });
      images.forEach((img) => observer.observe(img));
    }
  }

  // Enable CSS containment for rendering performance
  static enableCSSContainment() {
    const cards = document.querySelectorAll('.card');
    cards.forEach((card) => {
      (card as HTMLElement).style.contain = 'layout style paint';
    });
  }
}
