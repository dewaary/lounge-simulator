// Stand-in for next/dynamic so the same components bundle into one static preview page.
import { ComponentType, ReactNode, Suspense, lazy } from "react";
export default function dynamic<P extends object>(loader: () => Promise<{ default: ComponentType<P> }>, opts?: { loading?: () => ReactNode }) {
  const C = lazy(loader);
  return function Dyn(props: P) {
    return <Suspense fallback={opts?.loading?.() ?? null}><C {...props} /></Suspense>;
  };
}
