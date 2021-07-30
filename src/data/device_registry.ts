import { Connection, createCollection } from "openpeerpower-js-websocket";
import { computeStateName } from "../common/entity/compute_state_name";
import { debounce } from "../common/util/debounce";
import { OpenPeerPower } from "../types";
import { EntityRegistryEntry } from "./entity_registry";

export interface DeviceRegistryEntry {
  id: string;
  config_entries: string[];
  connections: Array<[string, string]>;
  identifiers: Array<[string, string]>;
  manufacturer: string | null;
  model: string | null;
  name: string | null;
  sw_version: string | null;
  via_device_id: string | null;
  area_id: string | null;
  name_by_user: string | null;
  entry_type: "service" | null;
  disabled_by: string | null;
}

export interface DeviceEntityLookup {
  [deviceId: string]: EntityRegistryEntry[];
}

export interface DeviceRegistryEntryMutableParams {
  area_id?: string | null;
  name_by_user?: string | null;
  disabled_by?: string | null;
}

export const fallbackDeviceName = (
  opp: OpenPeerPower,
  entities: EntityRegistryEntry[] | string[]
) => {
  for (const entity of entities || []) {
    const entityId = typeof entity === "string" ? entity : entity.entity_id;
    const stateObj = opp.states[entityId];
    if (stateObj) {
      return computeStateName(stateObj);
    }
  }
  return undefined;
};

export const computeDeviceName = (
  device: DeviceRegistryEntry,
  opp: OpenPeerPower,
  entities?: EntityRegistryEntry[] | string[]
) =>
  device.name_by_user ||
  device.name ||
  (entities && fallbackDeviceName(opp, entities)) ||
  opp.localize("ui.panel.config.devices.unnamed_device");

export const devicesInArea = (devices: DeviceRegistryEntry[], areaId: string) =>
  devices.filter((device) => device.area_id === areaId);

export const updateDeviceRegistryEntry = (
  opp: OpenPeerPower,
  deviceId: string,
  updates: Partial<DeviceRegistryEntryMutableParams>
) =>
  opp.callWS<DeviceRegistryEntry>({
    type: "config/device_registry/update",
    device_id: deviceId,
    ...updates,
  });

export const fetchDeviceRegistry = (conn) =>
  conn.sendMessagePromise({
    type: "config/device_registry/list",
  });

const subscribeDeviceRegistryUpdates = (conn, store) =>
  conn.subscribeEvents(
    debounce(
      () =>
        fetchDeviceRegistry(conn).then((devices) =>
          store.setState(devices, true)
        ),
      500,
      true
    ),
    "device_registry_updated"
  );

export const subscribeDeviceRegistry = (
  conn: Connection,
  onChange: (devices: DeviceRegistryEntry[]) => void
) =>
  createCollection<DeviceRegistryEntry[]>(
    "_dr",
    fetchDeviceRegistry,
    subscribeDeviceRegistryUpdates,
    conn,
    onChange
  );
