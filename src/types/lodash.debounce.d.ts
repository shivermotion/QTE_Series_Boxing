declare module 'lodash.debounce' {
  export type DebouncedFunction<F extends (...args: any[]) => any> = {
    (...args: Parameters<F>): void;
    cancel: () => void;
    flush: () => void;
  };

  export default function debounce<F extends (...args: any[]) => any>(
    func: F,
    wait?: number,
    options?: { leading?: boolean; trailing?: boolean; maxWait?: number }
  ): DebouncedFunction<F>;
}


