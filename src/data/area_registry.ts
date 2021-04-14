import { Connection, createCollection } from "openpeerpower-js-websocket";
import { Store } from "openpeerpower-js-websocket/dist/store";
import { compare } from "../common/string/compare";
import { debounce } from "../common/util/debounce";
import { OpenPeerPower } from "../types";

export interface AreaRegistryEntry {
  area_id: string;
  name: string;
}

export interface AreaRegistryEntryMutableParams {
  name: string;
}

export const createAreaRegistryEntry = (
  opp: OpenPeerPower,
  values: AreaRegistryEntryMutableParams
) =>
  opp.callWS<AreaRegistryEntry>({
    type: "config/area_registry/create",
    ...values,
  });

export const updateAreaRegistryEntry = (
  opp: OpenPeerPower,
  areaId: string,
  updates: Partial<AreaRegistryEntryMutableParams>
) =>
  opp.callWS<AreaRegistryEntry>({
    type: "config/area_registry/update",
    area_id: areaId,
    ...updates,
  });

export const deleteAreaRegistryEntry = (opp: OpenPeerPower, areaId: string) =>
  opp.callWS({
    type: "config/area_registry/delete",
    area_id: areaId,
  });

const fetchAreaRegistry = (conn: Connection) =>
  conn
    .sendMessagePromise({
      type: "config/area_registry/list",
    })
    .then((areas) =>
      (areas as AreaRegistryEntry[]).sort((ent1, ent2) =>
        compare(ent1.name, ent2.name)
      )
    );

const subscribeAreaRegistryUpdates = (
  conn: Connection,
  store: Store<AreaRegistryEntry[]>
) =>
  conn.subscribeEvents(
    debounce(
      () =>
        fetchAreaRegistry(conn).then((areas: AreaRegistryEntry[]) =>
          store.setState(areas, true)
        ),
      500,
      true
    ),
    "area_registry_updated"
  );

export const subscribeAreaRegistry = (
  conn: Connection,
  onChange: (areas: AreaRegistryEntry[]) => void
) =>
  createCollection<AreaRegistryEntry[]>(
    "_areaRegistry",
    fetchAreaRegistry,
    subscribeAreaRegistryUpdates,
    conn,
    onChange
  );
