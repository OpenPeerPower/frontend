import "@material/mwc-button";
import "@polymer/paper-dialog-scrollable/paper-dialog-scrollable";
import type { UnsubscribeFunc } from "openpeerpower-js-websocket";
import {
  css,
  CSSResultGroup,
  html,
  LitElement,
  PropertyValues,
  TemplateResult,
} from "lit";
import { customElement, state } from "lit/decorators";
import { fireEvent, OPPDomEvent } from "../../common/dom/fire_event";
import { computeRTL } from "../../common/util/compute_rtl";
import "../../components/op-circular-progress";
import "../../components/op-dialog";
import "../../components/op-form/op-form";
import "../../components/op-icon-button";
import "../../components/op-markdown";
import {
  AreaRegistryEntry,
  subscribeAreaRegistry,
} from "../../data/area_registry";
import { fetchConfigFlowInProgress } from "../../data/config_flow";
import {
  DataEntryFlowProgress,
  DataEntryFlowStep,
  subscribeDataEntryFlowProgressed,
} from "../../data/data_entry_flow";
import {
  DeviceRegistryEntry,
  subscribeDeviceRegistry,
} from "../../data/device_registry";
import { haStyleDialog } from "../../resources/styles";
import type { OpenPeerPower } from "../../types";
import { showAlertDialog } from "../generic/show-dialog-box";
import {
  DataEntryFlowDialogParams,
  LoadingReason,
} from "./show-dialog-data-entry-flow";
import "./step-flow-abort";
import "./step-flow-create-entry";
import "./step-flow-external";
import "./step-flow-form";
import "./step-flow-loading";
import "./step-flow-pick-flow";
import "./step-flow-pick-handler";
import "./step-flow-progress";

let instance = 0;

interface FlowUpdateEvent {
  step?: DataEntryFlowStep;
  stepPromise?: Promise<DataEntryFlowStep>;
}

declare global {
  // for fire event
  interface OPPDomEvents {
    "flow-update": FlowUpdateEvent;
  }
  // for add event listener
  interface HTMLElementEventMap {
    "flow-update": OPPDomEvent<FlowUpdateEvent>;
  }
}

@customElement("dialog-data-entry-flow")
class DataEntryFlowDialog extends LitElement {
  public opp!: OpenPeerPower;

  @state() private _params?: DataEntryFlowDialogParams;

  @state() private _loading?: LoadingReason;

  private _instance = instance;

  @state() private _step:
    | DataEntryFlowStep
    | undefined
    // Null means we need to pick a config flow
    | null;

  @state() private _devices?: DeviceRegistryEntry[];

  @state() private _areas?: AreaRegistryEntry[];

  @state() private _handlers?: string[];

  @state() private _handler?: string;

  @state() private _flowsInProgress?: DataEntryFlowProgress[];

  private _unsubAreas?: UnsubscribeFunc;

  private _unsubDevices?: UnsubscribeFunc;

  private _unsubDataEntryFlowProgressed?: Promise<UnsubscribeFunc>;

  public async showDialog(params: DataEntryFlowDialogParams): Promise<void> {
    this._params = params;
    this._instance = instance++;

    if (params.startFlowHandler) {
      this._checkFlowsInProgress(params.startFlowHandler);
      return;
    }

    if (params.continueFlowId) {
      this._loading = "loading_flow";
      const curInstance = this._instance;
      let step: DataEntryFlowStep;
      try {
        step = await params.flowConfig.fetchFlow(
          this.opp,
          params.continueFlowId
        );
      } catch (err) {
        this._step = undefined;
        this._params = undefined;
        showAlertDialog(this, {
          title: this.opp.localize(
            "ui.panel.config.integrations.config_flow.error"
          ),
          text: this.opp.localize(
            "ui.panel.config.integrations.config_flow.could_not_load"
          ),
        });
        return;
      }

      // Happens if second showDialog called
      if (curInstance !== this._instance) {
        return;
      }

      this._processStep(step);
      this._loading = undefined;
      return;
    }

    // Create a new config flow. Show picker
    if (!params.flowConfig.getFlowHandlers) {
      throw new Error("No getFlowHandlers defined in flow config");
    }
    this._step = null;

    // We only load the handlers once
    if (this._handlers === undefined) {
      this._loading = "loading_handlers";
      try {
        this._handlers = await params.flowConfig.getFlowHandlers(this.opp);
      } finally {
        this._loading = undefined;
      }
    }
  }

  public closeDialog() {
    if (!this._params) {
      return;
    }
    const flowFinished = Boolean(
      this._step && ["create_entry", "abort"].includes(this._step.type)
    );

    // If we created this flow, delete it now.
    if (this._step && !flowFinished && !this._params.continueFlowId) {
      this._params.flowConfig.deleteFlow(this.opp, this._step.flow_id);
    }

    if (this._step !== null && this._params.dialogClosedCallback) {
      this._params.dialogClosedCallback({
        flowFinished,
      });
    }

    this._step = undefined;
    this._params = undefined;
    this._devices = undefined;
    this._flowsInProgress = undefined;
    this._handler = undefined;
    if (this._unsubAreas) {
      this._unsubAreas();
      this._unsubAreas = undefined;
    }
    if (this._unsubDevices) {
      this._unsubDevices();
      this._unsubDevices = undefined;
    }
    if (this._unsubDataEntryFlowProgressed) {
      this._unsubDataEntryFlowProgressed.then((unsub) => {
        unsub();
      });
      this._unsubDataEntryFlowProgressed = undefined;
    }
    fireEvent(this, "dialog-closed", { dialog: this.localName });
  }

  protected render(): TemplateResult {
    if (!this._params) {
      return html``;
    }

    return html`
      <op-dialog
        open
        @closed=${this.closeDialog}
        scrimClickAction
        escapeKeyAction
        hideActions
      >
        <div>
          ${this._loading ||
          (this._step === null &&
            this._handlers === undefined &&
            this._handler === undefined)
            ? html`
                <step-flow-loading
                  .flowConfig=${this._params.flowConfig}
                  .opp=${this.opp}
                  .loadingReason=${this._loading || "loading_handlers"}
                  .handler=${this._handler}
                  .step=${this._step}
                ></step-flow-loading>
              `
            : this._step === undefined
            ? // When we are going to next step, we render 1 round of empty
              // to reset the element.
              ""
            : html`
                <op-icon-button
                  aria-label=${this.opp.localize(
                    "ui.panel.config.integrations.config_flow.dismiss"
                  )}
                  icon="opp:close"
                  dialogAction="close"
                  ?rtl=${computeRTL(this.opp)}
                ></op-icon-button>
                ${this._step === null
                  ? this._handler
                    ? html`<step-flow-pick-flow
                        .flowConfig=${this._params.flowConfig}
                        .opp=${this.opp}
                        .handler=${this._handler}
                        .flowsInProgress=${this._flowsInProgress}
                      ></step-flow-pick-flow>`
                    : // Show handler picker
                      html`
                        <step-flow-pick-handler
                          .opp=${this.opp}
                          .handlers=${this._handlers}
                          @handler-picked=${this._handlerPicked}
                        ></step-flow-pick-handler>
                      `
                  : this._step.type === "form"
                  ? html`
                      <step-flow-form
                        .flowConfig=${this._params.flowConfig}
                        .step=${this._step}
                        .opp=${this.opp}
                      ></step-flow-form>
                    `
                  : this._step.type === "external"
                  ? html`
                      <step-flow-external
                        .flowConfig=${this._params.flowConfig}
                        .step=${this._step}
                        .opp=${this.opp}
                      ></step-flow-external>
                    `
                  : this._step.type === "abort"
                  ? html`
                      <step-flow-abort
                        .flowConfig=${this._params.flowConfig}
                        .step=${this._step}
                        .opp=${this.opp}
                      ></step-flow-abort>
                    `
                  : this._step.type === "progress"
                  ? html`
                      <step-flow-progress
                        .flowConfig=${this._params.flowConfig}
                        .step=${this._step}
                        .opp=${this.opp}
                      ></step-flow-progress>
                    `
                  : this._devices === undefined || this._areas === undefined
                  ? // When it's a create entry result, we will fetch device & area registry
                    html`
                      <step-flow-loading
                        .flowConfig=${this._params.flowConfig}
                        .opp=${this.opp}
                        loadingReason="loading_devices_areas"
                      ></step-flow-loading>
                    `
                  : html`
                      <step-flow-create-entry
                        .flowConfig=${this._params.flowConfig}
                        .step=${this._step}
                        .opp=${this.opp}
                        .devices=${this._devices}
                        .areas=${this._areas}
                      ></step-flow-create-entry>
                    `}
              `}
        </div>
      </op-dialog>
    `;
  }

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);
    this.addEventListener("flow-update", (ev) => {
      const { step, stepPromise } = ev.detail;
      this._processStep(step || stepPromise);
    });
  }

  public willUpdate(changedProps: PropertyValues) {
    super.willUpdate(changedProps);
    if (!changedProps.has("_step") || !this._step) {
      return;
    }
    if (["external", "progress"].includes(this._step.type)) {
      // external and progress step will send update event from the backend, so we should subscribe to them
      this._subscribeDataEntryFlowProgressed();
    }
    if (this._step.type === "create_entry") {
      if (this._step.result && this._params!.flowConfig.loadDevicesAndAreas) {
        this._fetchDevices(this._step.result.entry_id);
        this._fetchAreas();
      } else {
        this._devices = [];
        this._areas = [];
      }
    }
  }

  private async _fetchDevices(configEntryId) {
    this._unsubDevices = subscribeDeviceRegistry(
      this.opp.connection,
      (devices) => {
        this._devices = devices.filter((device) =>
          device.config_entries.includes(configEntryId)
        );
      }
    );
  }

  private async _fetchAreas() {
    this._unsubAreas = subscribeAreaRegistry(this.opp.connection, (areas) => {
      this._areas = areas;
    });
  }

  private async _checkFlowsInProgress(handler: string) {
    this._loading = "loading_handlers";
    this._handler = handler;

    const flowsInProgress = (
      await fetchConfigFlowInProgress(this.opp.connection)
    ).filter((flow) => flow.handler === handler);

    if (!flowsInProgress.length) {
      // No flows in progress, create a new flow
      this._loading = "loading_flow";
      let step: DataEntryFlowStep;
      try {
        step = await this._params!.flowConfig.createFlow(this.opp, handler);
      } catch (err) {
        this._step = undefined;
        this._params = undefined;
        showAlertDialog(this, {
          title: this.opp.localize(
            "ui.panel.config.integrations.config_flow.error"
          ),
          text: this.opp.localize(
            "ui.panel.config.integrations.config_flow.could_not_load"
          ),
        });
        return;
      } finally {
        this._handler = undefined;
      }
      this._processStep(step);
    } else {
      this._step = null;
      this._flowsInProgress = flowsInProgress;
    }
    this._loading = undefined;
  }

  private _handlerPicked(ev) {
    this._checkFlowsInProgress(ev.detail.handler);
  }

  private async _processStep(
    step: DataEntryFlowStep | undefined | Promise<DataEntryFlowStep>
  ): Promise<void> {
    if (step instanceof Promise) {
      this._loading = "loading_step";
      try {
        this._step = await step;
      } finally {
        this._loading = undefined;
      }
      return;
    }

    if (step === undefined) {
      this.closeDialog();
      return;
    }
    this._step = undefined;
    await this.updateComplete;
    this._step = step;
  }

  private _subscribeDataEntryFlowProgressed() {
    if (this._unsubDataEntryFlowProgressed) {
      return;
    }
    this._unsubDataEntryFlowProgressed = subscribeDataEntryFlowProgressed(
      this.opp.connection,
      async (ev) => {
        if (ev.data.flow_id !== this._step?.flow_id) {
          return;
        }
        this._processStep(
          this._params!.flowConfig.fetchFlow(this.opp, this._step?.flow_id)
        );
      }
    );
  }

  static get styles(): CSSResultGroup {
    return [
      haStyleDialog,
      css`
        op-dialog {
          --dialog-content-padding: 0;
        }
        op-icon-button {
          padding: 16px;
          position: absolute;
          top: 0;
          right: 0;
        }
        op-icon-button[rtl] {
          right: auto;
          left: 0;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "dialog-data-entry-flow": DataEntryFlowDialog;
  }
}
