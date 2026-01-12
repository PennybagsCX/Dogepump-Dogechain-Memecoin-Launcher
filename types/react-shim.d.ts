// Minimal React/JSX shims to satisfy TS in this project.
// For full typing coverage, install @types/react and @types/react-dom instead.
declare module 'react' {
  export type FC<P = {}> = (props: P & { children?: ReactNode }) => JSX.Element | null;
  export type ReactNode = any;
  export type ReactElement = any;
  export type JSXElementConstructor<P> = any;
  export function createElement(...args: any[]): any;
  export function createContext<T = any>(defaultValue: T): any;
  export function useContext<T = any>(context: any): T;
  export function useState<S = any>(initialState: S | (() => S)): [S, (value: S | ((prev: S) => S)) => void];
  export function useEffect(effect: (...args: any[]) => any, deps?: any[]): void;
  export function useRef<T = any>(init: T): { current: T };
  export function useRef<T = any>(init: T | null): { current: T | null };
  export function useMemo<T = any>(factory: () => T, deps: any[]): T;
  export function useCallback<T extends (...args: any[]) => any>(cb: T, deps: any[]): T;
  export function lazy<T extends ReactElement = any>(factory: () => Promise<{ default: T }>): any;
  export const Suspense: any;
  export const Fragment: any;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
