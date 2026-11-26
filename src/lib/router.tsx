import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ROUTE_META } from '../data/restaurant';
import { getExperienceBySlug } from '../data/experiences';

interface RouterContextValue {
  pathname: string;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterContextValue>({
  pathname: '/',
  navigate: () => {},
});

function normalizePath(path: string): string {
  if (!path) return '/';
  const cleaned = path.split('?')[0].split('#')[0];
  if (cleaned.length > 1 && cleaned.endsWith('/')) {
    return cleaned.slice(0, -1);
  }
  return cleaned || '/';
}

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [pathname, setPathname] = useState<string>(() =>
    normalizePath(typeof window !== 'undefined' ? window.location.pathname : '/')
  );

  const updateDocumentMeta = useCallback((path: string) => {
    let title = 'Page Not Found — Andaaz Restaurant, Fort Road, Lahore';
    let description =
      'The requested page could not be found. Return to Andaaz Restaurant on Fort Road, Lahore.';

    if (ROUTE_META[path]) {
      title = ROUTE_META[path].title;
      description = ROUTE_META[path].description;
    } else if (path.startsWith('/experiences/')) {
      const slug = path.replace('/experiences/', '');
      const exp = getExperienceBySlug(slug);
      if (exp) {
        title = `${exp.title} — Andaaz Restaurant, Fort Road, Lahore`;
        description = exp.shortDescription;
      }
    }

    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', description);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description);
  }, []);

  useEffect(() => {
    updateDocumentMeta(pathname);
  }, [pathname, updateDocumentMeta]);

  useEffect(() => {
    const onPopState = () => {
      setPathname(normalizePath(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback(
    (to: string) => {
      const hashIndex = to.indexOf('#');
      const hash = hashIndex >= 0 ? to.slice(hashIndex + 1) : '';
      const target = normalizePath(to);
      const nextUrl = `${target}${hash ? `#${hash}` : ''}`;

      if (target === pathname && !hash) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (target !== pathname || hash) {
        window.history.pushState({}, '', nextUrl);
        setPathname(target);
      }

      if (hash) {
        requestAnimationFrame(() => {
          setTimeout(() => {
            const el = document.getElementById(hash);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 80);
        });
      } else {
        window.scrollTo({ top: 0, behavior: 'auto' });
        requestAnimationFrame(() => {
          const main = document.getElementById('main-content');
          if (main) {
            main.focus({ preventScroll: true });
          }
        });
      }
    },
    [pathname]
  );

  return (
    <RouterContext.Provider value={{ pathname, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  return useContext(RouterContext);
}

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
}

export function Link({ to, onClick, children, ...rest }: LinkProps) {
  const { navigate } = useRouter();
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      rest.target === '_blank'
    ) {
      return;
    }
    e.preventDefault();
    navigate(to);
  };
  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
