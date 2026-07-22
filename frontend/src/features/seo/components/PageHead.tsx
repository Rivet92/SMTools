import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface PageHeadProps {
  title: string;
  description?: string;
  noIndex?: boolean;
  canonicalPath?: string;
}

const APP_NAME = 'SMTools';

function getOrCreateMeta(name: string): HTMLMetaElement {
  let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = name;
    document.head.appendChild(meta);
  }
  return meta;
}

function getOrCreatePropertyMeta(property: string): HTMLMetaElement {
  let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('property', property);
    document.head.appendChild(meta);
  }
  return meta;
}

function getCanonicalLink(): HTMLLinkElement {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  return link;
}

export function PageHead({ title, description, noIndex = false, canonicalPath }: PageHeadProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;

    const metaDescription = getOrCreateMeta('description');
    const previousDescription = metaDescription.content;
    if (description) {
      metaDescription.content = description;
    }

    const robots = getOrCreateMeta('robots');
    const previousRobots = robots.content;
    robots.content = noIndex ? 'noindex, nofollow' : 'index, follow';

    const baseUrl = window.location.origin;
    const canonical = getCanonicalLink();
    const previousCanonical = canonical.href;
    canonical.href = canonicalPath
      ? `${baseUrl}${canonicalPath}`
      : `${baseUrl}${window.location.pathname}`;

    getOrCreatePropertyMeta('og:title').content = document.title;
    if (description) {
      getOrCreatePropertyMeta('og:description').content = description;
    }

    return () => {
      document.title = previousTitle;
      metaDescription.content = previousDescription;
      robots.content = previousRobots;
      canonical.href = previousCanonical;
    };
  }, [title, description, noIndex, canonicalPath, t]);

  return null;
}
