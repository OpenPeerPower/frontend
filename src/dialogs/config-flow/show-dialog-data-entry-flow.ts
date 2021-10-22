import { TemplateResult } from "lit";
import { fireEvent } from "../../common/dom/fire_event";
import { HaFormSchema } from "../../components/op-form/op-form";
import {
  DataEntryFlowStep,
  DataEntryFlowStepAbort,
  DataEntryFlowStepCreateEntry,
  DataEntryFlowStepExternal,
  DataEntryFlowStepForm,
  DataEntryFlowStepProgress,
} from "../../data/data_entry_flow";
import { OpenPeerPower } from "../../types";

export interface FlowConfig {
  loadDevicesAndAreas: boolean;

  getFlowHandlers?: (opp: OpenPeerPower) => Promise<string[]>;

  createFlow(opp: OpenPeerPower, handler: string): Promise<DataEntryFlowStep>;

  fetchFlow(opp: OpenPeerPower, flowId: string): Promise<DataEntryFlowStep>;

  handleFlowStep(
    opp: OpenPeerPower,
    flowId: string,
    data: Record<string, any>
  ): Promise<DataEntryFlowStep>;

  deleteFlow(opp: OpenPeerPower, flowId: string): Promise<unknown>;

  renderAbortDescription(
    opp: OpenPeerPower,
    step: DataEntryFlowStepAbort
  ): TemplateResult | "";

  renderShowFormStepHeader(
    opp: OpenPeerPower,
    step: DataEntryFlowStepForm
  ): string;

  renderShowFormStepDescription(
    opp: OpenPeerPower,
    step: DataEntryFlowStepForm
  ): TemplateResult | "";

  renderShowFormStepFieldLabel(
    opp: OpenPeerPower,
    step: DataEntryFlowStepForm,
    field: HaFormSchema
  ): string;

  renderShowFormStepFieldError(
    opp: OpenPeerPower,
    step: DataEntryFlowStepForm,
    error: string
  ): string;

  renderExternalStepHeader(
    opp: OpenPeerPower,
    step: DataEntryFlowStepExternal
  ): string;

  renderExternalStepDescription(
    opp: OpenPeerPower,
    step: DataEntryFlowStepExternal
  ): TemplateResult | "";

  renderCreateEntryDescription(
    opp: OpenPeerPower,
    step: DataEntryFlowStepCreateEntry
  ): TemplateResult | "";

  renderShowFormProgressHeader(
    opp: OpenPeerPower,
    step: DataEntryFlowStepProgress
  ): string;

  renderShowFormProgressDescription(
    opp: OpenPeerPower,
    step: DataEntryFlowStepProgress
  ): TemplateResult | "";

  renderLoadingDescription(
    opp: OpenPeerPower,
    loadingReason: LoadingReason,
    handler?: string,
    step?: DataEntryFlowStep | null
  ): string;
}

export type LoadingReason =
  | "loading_handlers"
  | "loading_flow"
  | "loading_step"
  | "loading_devices_areas";

export interface DataEntryFlowDialogParams {
  startFlowHandler?: string;
  continueFlowId?: string;
  dialogClosedCallback?: (params: { flowFinished: boolean }) => void;
  flowConfig: FlowConfig;
  showAdvanced?: boolean;
}

export const loadDataEntryFlowDialog = () => import("./dialog-data-entry-flow");

export const showFlowDialog = (
  element: HTMLElement,
  dialogParams: Omit<DataEntryFlowDialogParams, "flowConfig">,
  flowConfig: FlowConfig
): void => {
  fireEvent(element, "show-dialog", {
    dialogTag: "dialog-data-entry-flow",
    dialogImport: loadDataEntryFlowDialog,
    dialogParams: {
      ...dialogParams,
      flowConfig,
    },
  });
};
