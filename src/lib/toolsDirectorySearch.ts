type SearchableDirectoryTool = {
  title: string;
  description: string;
  features: readonly string[];
  eyebrow: string;
  categories: readonly string[];
};

// Match the whole trimmed query as a literal substring in any one field.
// Case is ignored; internal whitespace/punctuation are not changed or tokenized.
// Filtering keeps the original objects and order without mutating the catalogue.
export function filterDirectoryTools<T extends SearchableDirectoryTool>(
  tools: readonly T[],
  category: string,
  query: string,
): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  return tools.filter((tool) => {
    if (category !== "all" && !tool.categories.includes(category)) return false;
    if (!normalizedQuery) return true;
    return [tool.title, tool.description, ...tool.features, tool.eyebrow].some(
      (field) => field.toLowerCase().includes(normalizedQuery),
    );
  });
}
