export type RequisitionDraft = {
  requesterName: string;
  area: string;
  itemId: string;
  quantity: string;
  justification: string;
};

export type RequisitionPayload = {
  requesterName: string;
  area: string;
  itemId: number;
  quantity: number;
  justification: string;
};

export function prepareRequisitionPayload(draft: RequisitionDraft): RequisitionPayload | null {
  const itemId = Number(draft.itemId);
  const quantity = Number(draft.quantity);
  if (!draft.itemId.trim() || !Number.isInteger(itemId) || itemId <= 0) return null;
  if (!Number.isInteger(quantity) || quantity < 1) return null;

  return {
    requesterName: draft.requesterName.trim(),
    area: draft.area,
    itemId,
    quantity,
    justification: draft.justification.trim(),
  };
}
