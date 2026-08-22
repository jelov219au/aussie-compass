import { siteName, siteUrl } from "@/lib/site";
import { getPublicSellerDetails } from "@/lib/publicSeller";
import { serializeJsonLd } from "@/lib/jsonLd";

type BreadcrumbItem = {
  name: string;
  path: `/${string}` | "/";
};

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd(data),
      }}
    />
  );
}

export function SiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: siteName,
        url: siteUrl,
        publisher: { "@id": `${siteUrl}/#organization` },
        inLanguage: "ko",
        description: "호주 급여, 세금, Super 계산기와 한국어 생활 가이드를 제공하는 실용 정보 사이트입니다.",
      }}
    />
  );
}

export function OrganizationJsonLd() {
  const { email } = getPublicSellerDetails();

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: siteName,
        url: siteUrl,
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/app-icon-512`,
          width: 512,
          height: 512,
        },
        contactPoint: email ? {
          "@type": "ContactPoint",
          contactType: "customer support",
          email,
          availableLanguage: ["Korean", "English"],
        } : undefined,
      }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: `${siteUrl}${item.path === "/" ? "" : item.path}`,
        })),
      }}
    />
  );
}

type ArticleJsonLdProps = {
  title: string;
  description: string;
  path: `/${string}`;
  category: string;
  publishedAt: string;
  updatedAt?: string;
  sources?: Array<{ href: string }>;
};

export function ArticleJsonLd({ title, description, path, category, publishedAt, updatedAt, sources }: ArticleJsonLdProps) {
  const url = `${siteUrl}${path}`;

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        "@id": `${url}#article`,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        headline: title,
        description,
        url,
        datePublished: publishedAt,
        dateModified: updatedAt ?? publishedAt,
        articleSection: category,
        inLanguage: "ko",
        isAccessibleForFree: true,
        author: { "@type": "Organization", name: siteName, url: siteUrl },
        publisher: { "@id": `${siteUrl}/#organization` },
        citation: sources?.map((source) => source.href),
      }}
    />
  );
}

type ProductJsonLdProps = {
  name: string;
  description: string;
  path: `/${string}`;
  currency: string;
  priceCents: number;
  available: boolean;
};

export function ProductJsonLd({ name, description, path, currency, priceCents, available }: ProductJsonLdProps) {
  const url = `${siteUrl}${path}`;

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Product",
        "@id": `${url}#product`,
        name,
        description,
        url,
        brand: { "@type": "Brand", name: siteName },
        offers: {
          "@type": "Offer",
          url,
          priceCurrency: currency.toUpperCase(),
          price: (priceCents / 100).toFixed(2),
          availability: available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          seller: { "@id": `${siteUrl}/#organization` },
        },
      }}
    />
  );
}

type CollectionItem = { name: string; path: `/${string}` };

export function CollectionJsonLd({ name, description, path, items }: { name: string; description: string; path: `/${string}`; items: CollectionItem[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "@id": `${siteUrl}${path}#collection`,
        name,
        description,
        url: `${siteUrl}${path}`,
        inLanguage: "ko",
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: items.length,
          itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            url: `${siteUrl}${item.path}`,
          })),
        },
      }}
    />
  );
}
