import { ShoppingListItem } from "../../../src/data/shopping-list";
import { MockOpenPeerPower } from "../../../src/fake_data/provide_opp";

let items: ShoppingListItem[] = [
  {
    id: 12,
    name: "Milk",
    complete: false,
  },
  {
    id: 13,
    name: "Eggs",
    complete: false,
  },
  {
    id: 14,
    name: "Oranges",
    complete: true,
  },
];

export const mockShoppingList = (opp: MockOpenPeerPower) => {
  opp.mockWS("shopping_list/items", () => items);
  opp.mockWS("shopping_list/items/add", (msg) => {
    const item: ShoppingListItem = {
      id: new Date().getTime(),
      complete: false,
      name: msg.name,
    };
    items.push(item);
    opp.mockEvent("shopping_list_updated");
    return item;
  });
  opp.mockWS("shopping_list/items/update", ({ type, item_id, ...updates }) => {
    items = items.map((item) =>
      item.id === item_id ? { ...item, ...updates } : item
    );
    opp.mockEvent("shopping_list_updated");
  });
  opp.mockWS("shopping_list/items/clear", () => {
    items = items.filter((item) => !item.complete);
    opp.mockEvent("shopping_list_updated");
  });
};
