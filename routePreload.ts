type RouteImporter = () => Promise<unknown>;

export const routeImporters: Record<string, RouteImporter> = {
  '/fleet': () => import('./pages/Fleet'),
  '/services': () => import('./pages/Services'),
  '/about': () => import('./pages/About'),
  '/contact': () => import('./pages/Contact'),
  '/book-a-trip': () => import('./pages/BookATrip'),
};

const preloadedRoutes = new Set<string>();

export const preloadRoute = (path: string) => {
  const importer = routeImporters[path];
  if (!importer || preloadedRoutes.has(path)) return;

  preloadedRoutes.add(path);
  void importer().catch(() => {
    // The normal lazy import remains the fallback if a speculative request fails.
    preloadedRoutes.delete(path);
  });
};
