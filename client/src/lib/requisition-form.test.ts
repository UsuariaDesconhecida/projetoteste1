import { describe, expect, it } from "vitest";
import { prepareRequisitionPayload } from "./requisition-form";

describe("requisition form submission", () => {
  it("bloqueia o submit quando o usuário apenas digitou texto no autocomplete", () => {
    const payload = prepareRequisitionPayload({
      requesterName: "Maria Souza",
      area: "Logística",
      itemId: "",
      quantity: "1",
      justification: "Reposição de material",
    });

    expect(payload).toBeNull();
  });

  it("gera o payload somente depois que um item válido foi selecionado", () => {
    const payload = prepareRequisitionPayload({
      requesterName: " Maria Souza ",
      area: "Logística",
      itemId: "42",
      quantity: "2",
      justification: " Reposição de material ",
    });

    expect(payload).toEqual({
      requesterName: "Maria Souza",
      area: "Logística",
      itemId: 42,
      quantity: 2,
      justification: "Reposição de material",
    });
  });
});
