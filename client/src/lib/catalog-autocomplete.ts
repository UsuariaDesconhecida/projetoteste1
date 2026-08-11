export type CatalogAutocompleteItem = {
  id: number;
  code: string;
  name: string;
  stock: number;
  unit: string;
};

export function searchCatalogItems<T extends CatalogAutocompleteItem>(
  items: T[],
  query: string,
  limit = 150,
): T[] {
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  if (!normalizedQuery) return [];

  return items
    .filter((item) => `${item.code} ${item.name}`.toLocaleLowerCase("pt-BR").includes(normalizedQuery))
    .slice(0, limit);
}

export function getCatalogSelectionLabel(item: CatalogAutocompleteItem): string {
  return `${item.code} — ${item.name}`;
}

export function hasCatalogSelection(selectedItemId: string): boolean {
  return selectedItemId.trim().length > 0;
}
