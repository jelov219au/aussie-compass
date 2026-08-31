// Public URL migrations also apply to device-local reading history. Keep this
// module small: client-side history must not import the full article library.
export const articleRedirects = [
  {
    source: "/resources/australia-public-holiday-pay-guide",
    destination: "/resources/australia-public-holiday-work-pay-guide",
    permanent: true,
  },
  {
    source: "/resources/australia-public-holiday-pay-guide/opengraph-image",
    destination: "/resources/australia-public-holiday-work-pay-guide/opengraph-image",
    permanent: true,
  },
];

/** @param {string} href */
export function canonicalArticleHref(href) {
  return articleRedirects.find((redirect) => redirect.source === href)?.destination ?? href;
}
