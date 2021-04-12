import { OpenPeerPower } from "../types";
import { DataEntryFlowStep } from "./data_entry_flow";

export const createOptionsFlow = (opp: OpenPeerPower, handler: string) =>
  opp.callApi<DataEntryFlowStep>(
    "POST",
    "config/config_entries/options/flow",
    {
      handler,
      show_advanced_options: Boolean(opp.userData?.showAdvanced),
    }
  );

export const fetchOptionsFlow = (opp: OpenPeerPower, flowId: string) =>
  opp.callApi<DataEntryFlowStep>(
    "GET",
    `config/config_entries/options/flow/${flowId}`
  );

export const handleOptionsFlowStep = (
  opp: OpenPeerPower,
  flowId: string,
  data: Record<string, any>
) =>
  opp.callApi<DataEntryFlowStep>(
    "POST",
    `config/config_entries/options/flow/${flowId}`,
    data
  );

export const deleteOptionsFlow = (opp: OpenPeerPower, flowId: string) =>
  opp.callApi("DELETE", `config/config_entries/options/flow/${flowId}`);
