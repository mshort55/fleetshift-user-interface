import { ComponentType, lazy, Suspense, useRef } from "react";
export type LazyLoader<C extends ComponentType> = () => Promise<C>;

const sameLoader = (a?: any, b?: any) =>
  a?.name === b?.name && (a || "a").toString() === (b || "b").toString();

export const AsyncComponent = <C extends ComponentType>({
  loader,
  LoadingComponent = "Loading...",
  // Typically import loader strings are of the form "() => import('./path/to/Component').then(c => c.Component)"
  // So we extract "Component" from the end of the string for easier identification.
  blame = String(loader).split(".")?.pop()?.replaceAll(")", "") ??
    "AsyncComponent",
  ...props
}: Record<string, any> & { loader: LazyLoader<C> }) => {
  /**
   * Use refs to make the loader referentially stable. Only rerender
   * when the loader actually changes according to {@link sameLoader}.
   *
   * This prevents infinite rerenders when inline loader functions are used.
   */
  const loaderRef = useRef<LazyLoader<C> | null>(null);
  const lazyComponentRef = useRef<ReturnType<typeof lazy> | null>(null);

  if (!sameLoader(loaderRef.current, loader)) {
    loaderRef.current = loader;
    lazyComponentRef.current = lazy(() =>
      loader().then((module) => ({ default: module })),
    );
  }

  const LazyComponent = lazyComponentRef.current!;

  /*
   * It's a bit tricky to get TypeScript to understand that props is compatible, while
   * retaining type checking for the rest of AsyncComponentProps.
   *
   * Thus, we keep full type checking for AsyncComponentProps at the cost of this any cast.
   */
  return (
    <Suspense fallback={<LoadingComponent blame={blame} />}>
      <LazyComponent {...(props as any)} />
    </Suspense>
  );
};
