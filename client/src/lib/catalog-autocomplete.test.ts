import { describe, expect, it } from "vitest";
import { getCatalogSelectionLabel, hasCatalogSelection, searchCatalogItems } from "./catalog-autocomplete";

const catalog = [
  { id: 1, code: "UBA01596X", name: "RÉGUA POTENCIOMÉTRICA LTM-150S HAITIANS", stock: 4, unit: "un" },
  { id: 2, code: "UBC00247X", name: "ADAPTADOR TERMOPAR BP ROSCA M12X1,5X32", stock: 17, unit: "un" },
  { id: 3, code: "UBC00250X", name: "TERMOPAR TIPO K BAIONETA CABO 5M", stock: 12, unit: "un" },
];

describe("catalog autocomplete", () => {
  it("encontra sugestões por part number e por descrição sem diferenciar maiúsculas", () => {
    expect(searchCatalogItems(catalog, "uba01596x").map((item) => item.code)).toEqual(["UBA01596X"]);
    expect(searchCatalogItems(catalog, "termopar").map((item) => item.code)).toEqual(["UBC00247X", "UBC00250X"]);
  });

  it("limita a quantidade de sugestões e não sugere itens com busca vazia", () => {
    expect(searchCatalogItems(catalog, "", 2)).toEqual([]);
    expect(searchCatalogItems(catalog, "termopar", 1)).toHaveLength(1);
  });

  it("não considera válido o formulário enquanto nenhum item foi selecionado", () => {
    expect(hasCatalogSelection("")).toBe(false);
    expect(hasCatalogSelection("   ")).toBe(false);
    expect(hasCatalogSelection("2")).toBe(true);
  });

  it("gera o texto usado no campo após a seleção do item", () => {
    expect(getCatalogSelectionLabel(catalog[1]!)).toBe("UBC00247X — ADAPTADOR TERMOPAR BP ROSCA M12X1,5X32");
  });
});
