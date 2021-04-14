import { Connection, getCollection } from "openpeerpower-js-websocket";
import { LocalizeFunc } from "../common/translations/localize";
import { debounce } from "../common/util/debounce";
import { OpenPeerPower } from "../types";
import { DataEntryFlowProgress, DataEntryFlowStep } from "./data_entry_flow";
import { domainToName } from "./integration";

export const DISCOVERY_SOURCES = [
  "unignore",
  "dhcp",
  "homekit",
  "ssdp",
  "zeroconf",
  "discovery",
  "mqtt",
];

export const ATTENTION_SOURCES = ["reauth"];

const HEADERS = {
  "HA-Frontend-Base": `${location.protocol}//${location.host}`,
};

export const createConfigFlow = (opp: OpenPeerPower, handler: string) =>
  opp.callApi<DataEntryFlowStep>(
    "POST",
    "config/config_entries/flow",
    {
      handler,
      show_advanced_options: Boolean(opp.userData?.showAdvanced),
    },
    HEADERS
  );

export const fetchConfigFlow = (opp: OpenPeerPower, flowId: string) =>
  opp.callApi<DataEntryFlowStep>(
    "GET",
    `config/config_entries/flow/${flowId}`,
    undefined,
    HEADERS
  );

export const handleConfigFlowStep = (
  opp: OpenPeerPower,
  flowId: string,
  data: Record<string, any>
) =>
  opp.callApi<DataEntryFlowStep>(
    "POST",
    `config/config_entries/flow/${flowId}`,
    data,
    HEADERS
  );

export const ignoreConfigFlow = (
  opp: OpenPeerPower,
  flowId: string,
  title: string
) =>
  opp.callWS({ type: "config_entries/ignore_flow", flow_id: flowId, title });

export const deleteConfigFlow = (opp: OpenPeerPower, flowId: string) =>
  opp.callApi("DELETE", `config/config_entries/flow/${flowId}`);

export const getConfigFlowHandlers = (opp: OpenPeerPower) =>
  opp.callApi<string[]>("GET", "config/config_entries/flow_handlers");

export const fetchConfigFlowInProgress = (
  conn: Connection
): Promise<DataEntryFlowProgress[]> =>
  conn.sendMessagePromise({
    type: "config_entries/flow/progress",
  });

const subscribeConfigFlowInProgressUpdates = (conn: Connection, store) =>
  conn.subscribeEvents(
    debounce(
      () =>
        fetchConfigFlowInProgress(conn).then((flows: DataEntryFlowProgress[]) =>
          store.setState(flows, true)
        ),
      500,
      true
    ),
    "config_entry_discovered"
  );

export const getConfigFlowInProgressCollection = (conn: Connection) =>
  getCollection<DataEntryFlowProgress[]>(
    conn,
    "_configFlowProgress",
    fetchConfigFlowInProgress,
    subscribeConfigFlowInProgressUpdates
  );

export const subscribeConfigFlowInProgress = (
  opp: OpenPeerPower,
  onChange: (flows: DataEntryFlowProgress[]) => void
) => getConfigFlowInProgressCollection(opp.connection).subscribe(onChange);

export const localizeConfigFlowTitle = (
  localize: LocalizeFunc,
  flow: DataEntryFlowProgress
) => {
  const placeholders = flow.context.title_placeholders || {};
  const placeholderKeys = Object.keys(placeholders);
  if (placeholderKeys.length === 0) {
    return domainToName(localize, flow.handler);
  }
  const args: string[] = [];
  placeholderKeys.forEach((key) => {
    args.push(key);
    args.push(placeholders[key]);
  });
  return localize(`component.${flow.handler}.config.flow_title`, ...args);
};
