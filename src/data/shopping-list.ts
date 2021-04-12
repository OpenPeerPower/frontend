import { OpenPeerPower } from "../types";

export interface ShoppingListItem {
  id: number;
  name: string;
  complete: boolean;
}

export const fetchItems = (opp: OpenPeerPower): Promise<ShoppingListItem[]> =>
  opp.callWS({
    type: "shopping_list/items",
  });

export const updateItem = (
  opp: OpenPeerPower,
  itemId: number,
  item: {
    name?: string;
    complete?: boolean;
  }
): Promise<ShoppingListItem> =>
  opp.callWS({
    type: "shopping_list/items/update",
    item_id: itemId,
    ...item,
  });

export const clearItems = (opp: OpenPeerPower): Promise<void> =>
  opp.callWS({
    type: "shopping_list/items/clear",
  });

export const addItem = (
  opp: OpenPeerPower,
  name: string
): Promise<ShoppingListItem> =>
  opp.callWS({
    type: "shopping_list/items/add",
    name,
  });

export const reorderItems = (
  opp: OpenPeerPower,
  itemIds: [string]
): Promise<ShoppingListItem> =>
  opp.callWS({
    type: "shopping_list/items/reorder",
    item_ids: itemIds,
  });
