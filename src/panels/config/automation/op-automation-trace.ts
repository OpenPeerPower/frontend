import {
  mdiDownload,
  mdiPencil,
  mdiRayEndArrow,
  mdiRayStartArrow,
  mdiRefresh,
} from "@mdi/js";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators";
import { classMap } from "lit/directives/class-map";
import { repeat } from "lit/directives/repeat";
import { isComponentLoaded } from "../../../common/config/is_component_loaded";
import { formatDateTimeWithSeconds } from "../../../common/datetime/format_date_time";
import type { NodeInfo } from "../../../components/trace/hat-graph";
import "../../../components/trace/hat-script-graph";
import { AutomationEntity } from "../../../data/automation";
import { getLogbookDataForContext, LogbookEntry } from "../../../data/logbook";
import {
  AutomationTrace,
  AutomationTraceExtended,
  loadTrace,
  loadTraces,
} from "../../../data/trace";
import { showAlertDialog } from "../../../dialogs/generic/show-dialog-box";
import { haStyle } from "../../../resources/styles";
import { OpenPeerPower, Route } from "../../../types";
import { configSections } from "../op-panel-config";
import "../../../components/trace/op-trace-blueprint-config";
import "../../../components/trace/op-trace-config";
import "../../../components/trace/op-trace-logbook";
import "../../../components/trace/op-trace-path-details";
import "../../../components/trace/op-trace-timeline";
import { traceTabStyles } from "../../../components/trace/trace-tab-styles";

@customElement("op-automation-trace")
export class HaAutomationTrace extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public automationId!: string;

  @property({ attribute: false }) public automations!: AutomationEntity[];

  @property({ type: Boolean }) public isWide?: boolean;

  @property({ type: Boolean, reflect: true }) public narrow!: boolean;

  @property({ attribute: false }) public route!: Route;

  @state() private _entityId?: string;

  @state() private _traces?: AutomationTrace[];

  @state() private _runId?: string;

  @state() private _selected?: NodeInfo;

  @state() private _trace?: AutomationTraceExtended;

  @state() private _logbookEntries?: LogbookEntry[];

  @state() private _view:
    | "details"
    | "config"
    | "timeline"
    | "logbook"
    | "blueprint" = "details";

  protected render(): TemplateResult {
    const stateObj = this._entityId
      ? this.opp.states[this._entityId]
      : undefined;

    const graph = this.shadowRoot!.querySelector("hat-script-graph");
    const trackedNodes = graph?.trackedNodes;
    const renderedNodes = graph?.renderedNodes;

    const title = stateObj?.attributes.friendly_name || this._entityId;

    let devButtons: TemplateResult | string = "";
    if (__DEV__) {
      devButtons = html`<div style="position: absolute; right: 0;">
        <button @click=${this._importTrace}>Import trace</button>
        <button @click=${this._loadLocalStorageTrace}>Load stored trace</button>
      </div>`;
    }

    const actionButtons = html`
      <mwc-icon-button label="Refresh" @click=${() => this._loadTraces()}>
        <op-svg-icon .path=${mdiRefresh}></op-svg-icon>
      </mwc-icon-button>
      <mwc-icon-button
        .disabled=${!this._trace}
        label="Download Trace"
        @click=${this._downloadTrace}
      >
        <op-svg-icon .path=${mdiDownload}></op-svg-icon>
      </mwc-icon-button>
    `;

    return html`
      ${devButtons}
      <opp-tabs-subpage
        .opp=${this.opp}
        .narrow=${this.narrow}
        .route=${this.route}
        .tabs=${configSections.automation}
      >
        ${this.narrow
          ? html`<span slot="header"> ${title} </span>
              <div slot="toolbar-icon">${actionButtons}</div>`
          : ""}
        <div class="toolbar">
          ${!this.narrow
            ? html`<div>
                ${title}
                <a
                  class="linkButton"
                  href="/config/automation/edit/${this.automationId}"
                >
                  <mwc-icon-button label="Edit Automation" tabindex="-1">
                    <op-svg-icon .path=${mdiPencil}></op-svg-icon>
                  </mwc-icon-button>
                </a>
              </div>`
            : ""}
          ${this._traces && this._traces.length > 0
            ? html`
                <div>
                  <mwc-icon-button
                    .disabled=${this._traces[this._traces.length - 1].run_id ===
                    this._runId}
                    label="Older trace"
                    @click=${this._pickOlderTrace}
                  >
                    <op-svg-icon .path=${mdiRayEndArrow}></op-svg-icon>
                  </mwc-icon-button>
                  <select .value=${this._runId} @change=${this._pickTrace}>
                    ${repeat(
                      this._traces,
                      (trace) => trace.run_id,
                      (trace) =>
                        html`<option value=${trace.run_id}>
                          ${formatDateTimeWithSeconds(
                            new Date(trace.timestamp.start),
                            this.opp.locale
                          )}
                        </option>`
                    )}
                  </select>
                  <mwc-icon-button
                    .disabled=${this._traces[0].run_id === this._runId}
                    label="Newer trace"
                    @click=${this._pickNewerTrace}
                  >
                    <op-svg-icon .path=${mdiRayStartArrow}></op-svg-icon>
                  </mwc-icon-button>
                </div>
              `
            : ""}
          ${!this.narrow ? html`<div>${actionButtons}</div>` : ""}
        </div>

        ${this._traces === undefined
          ? html`<div class="container">Loading…</div>`
          : this._traces.length === 0
          ? html`<div class="container">No traces found</div>`
          : this._trace === undefined
          ? ""
          : html`
              <div class="main">
                <div class="graph">
                  <opt-script-graph
                    .trace=${this._trace}
                    .selected=${this._selected?.path}
                    @graph-node-selected=${this._pickNode}
                  ></hat-script-graph>
                </div>

                <div class="info">
                  <div class="tabs top">
                    ${[
                      ["details", "Step Details"],
                      ["timeline", "Trace Timeline"],
                      ["logbook", "Related logbook entries"],
                      ["config", "Automation Config"],
                    ].map(
                      ([view, label]) => html`
                        <button
                          tabindex="0"
                          .view=${view}
                          class=${classMap({ active: this._view === view })}
                          @click=${this._showTab}
                        >
                          ${label}
                        </button>
                      `
                    )}
                    ${this._trace.blueprint_inputs
                      ? html`
                          <button
                            tabindex="0"
                            .view=${"blueprint"}
                            class=${classMap({
                              active: this._view === "blueprint",
                            })}
                            @click=${this._showTab}
                          >
                            Blueprint Config
                          </button>
                        `
                      : ""}
                  </div>
                  ${this._selected === undefined ||
                  this._logbookEntries === undefined ||
                  trackedNodes === undefined
                    ? ""
                    : this._view === "details"
                    ? html`
                        <op-trace-path-details
                          .opp=${this.opp}
                          .narrow=${this.narrow}
                          .trace=${this._trace}
                          .selected=${this._selected}
                          .logbookEntries=${this._logbookEntries}
                          .trackedNodes=${trackedNodes}
                          .renderedNodes=${renderedNodes!}
                        ></op-trace-path-details>
                      `
                    : this._view === "config"
                    ? html`
                        <op-trace-config
                          .opp=${this.opp}
                          .trace=${this._trace}
                        ></op-trace-config>
                      `
                    : this._view === "logbook"
                    ? html`
                        <op-trace-logbook
                          .opp=${this.opp}
                          .narrow=${this.narrow}
                          .trace=${this._trace}
                          .logbookEntries=${this._logbookEntries}
                        ></op-trace-logbook>
                      `
                    : this._view === "blueprint"
                    ? html`
                        <op-trace-blueprint-config
                          .opp=${this.opp}
                          .trace=${this._trace}
                        ></op-trace-blueprint-config>
                      `
                    : html`
                        <op-trace-timeline
                          .opp=${this.opp}
                          .trace=${this._trace}
                          .logbookEntries=${this._logbookEntries}
                          .selected=${this._selected}
                          @value-changed=${this._timelinePathPicked}
                        ></op-trace-timeline>
                      `}
                </div>
              </div>
            `}
      </opp-tabs-subpage>
    `;
  }

  protected firstUpdated(changedProps) {
    super.firstUpdated(changedProps);

    if (!this.automationId) {
      return;
    }

    const params = new URLSearchParams(location.search);
    this._loadTraces(params.get("run_id") || undefined);
  }

  protected updated(changedProps) {
    super.updated(changedProps);

    // Only reset if automationId has changed and we had one before.
    if (changedProps.get("automationId")) {
      this._traces = undefined;
      this._entityId = undefined;
      this._runId = undefined;
      this._trace = undefined;
      this._logbookEntries = undefined;
      if (this.automationId) {
        this._loadTraces();
      }
    }

    if (changedProps.has("_runId") && this._runId) {
      this._trace = undefined;
      this._logbookEntries = undefined;
      this.shadowRoot!.querySelector("select")!.value = this._runId;
      this._loadTrace();
    }

    if (
      changedProps.has("automations") &&
      this.automationId &&
      !this._entityId
    ) {
      const automation = this.automations.find(
        (entity: AutomationEntity) => entity.attributes.id === this.automationId
      );
      this._entityId = automation?.entity_id;
    }
  }

  private _pickOlderTrace() {
    const curIndex = this._traces!.findIndex((tr) => tr.run_id === this._runId);
    this._runId = this._traces![curIndex + 1].run_id;
    this._selected = undefined;
  }

  private _pickNewerTrace() {
    const curIndex = this._traces!.findIndex((tr) => tr.run_id === this._runId);
    this._runId = this._traces![curIndex - 1].run_id;
    this._selected = undefined;
  }

  private _pickTrace(ev) {
    this._runId = ev.target.value;
    this._selected = undefined;
  }

  private _pickNode(ev) {
    this._selected = ev.detail;
  }

  private async _loadTraces(runId?: string) {
    this._traces = await loadTraces(this.opp, "automation", this.automationId);
    // Newest will be on top.
    this._traces.reverse();

    if (runId) {
      this._runId = runId;
    }

    // Check if current run ID still exists
    if (
      this._runId &&
      !this._traces.some((trace) => trace.run_id === this._runId)
    ) {
      this._runId = undefined;
      this._selected = undefined;

      // If we came here from a trace passed into the url, clear it.
      if (runId) {
        const params = new URLSearchParams(location.search);
        params.delete("run_id");
        history.replaceState(
          null,
          "",
          `${location.pathname}?${params.toString()}`
        );
      }

      await showAlertDialog(this, {
        text: "Chosen trace is no longer available",
      });
    }

    // See if we can set a default runID
    if (!this._runId && this._traces.length > 0) {
      this._runId = this._traces[0].run_id;
    }
  }

  private async _loadTrace() {
    const trace = await loadTrace(
      this.opp,
      "automation",
      this.automationId,
      this._runId!
    );
    this._logbookEntries = isComponentLoaded(this.opp, "logbook")
      ? await getLogbookDataForContext(
          this.opp,
          trace.timestamp.start,
          trace.context.id
        )
      : [];

    this._trace = trace;
  }

  private _downloadTrace() {
    const aEl = document.createElement("a");
    aEl.download = `trace ${this._entityId} ${
      this._trace!.timestamp.start
    }.json`;
    aEl.href = `data:application/json;charset=utf-8,${encodeURI(
      JSON.stringify(
        {
          trace: this._trace,
          logbookEntries: this._logbookEntries,
        },
        undefined,
        2
      )
    )}`;
    aEl.click();
  }

  private _importTrace() {
    const traceText = prompt("Enter downloaded trace");
    if (!traceText) {
      return;
    }
    localStorage.devTrace = traceText;
    this._loadLocalTrace(traceText);
  }

  private _loadLocalStorageTrace() {
    if (localStorage.devTrace) {
      this._loadLocalTrace(localStorage.devTrace);
    }
  }

  private _loadLocalTrace(traceText: string) {
    const traceInfo = JSON.parse(traceText);
    this._trace = traceInfo.trace;
    this._logbookEntries = traceInfo.logbookEntries;
  }

  private _showTab(ev) {
    this._view = (ev.target as any).view;
  }

  private _timelinePathPicked(ev) {
    const path = ev.detail.value;
    const nodes =
      this.shadowRoot!.querySelector("hat-script-graph")!.trackedNodes;
    if (nodes[path]) {
      this._selected = nodes[path];
    }
  }

  static get styles(): CSSResultGroup {
    return [
      haStyle,
      traceTabStyles,
      css`
        .toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 20px;
          height: var(--header-height);
          padding: 0 16px;
          background-color: var(--primary-background-color);
          font-weight: 400;
          color: var(--app-header-text-color, white);
          border-bottom: var(--app-header-border-bottom, none);
          box-sizing: border-box;
        }

        .toolbar > * {
          display: flex;
          align-items: center;
        }

        :host([narrow]) .toolbar > * {
          display: contents;
        }

        .main {
          height: calc(100% - 56px);
          display: flex;
          background-color: var(--card-background-color);
        }

        :host([narrow]) .main {
          height: auto;
          flex-direction: column;
        }

        .container {
          padding: 16px;
        }

        .graph {
          border-right: 1px solid var(--divider-color);
          overflow-x: auto;
          max-width: 50%;
        }
        :host([narrow]) .graph {
          max-width: 100%;
        }

        .info {
          flex: 1;
          background-color: var(--card-background-color);
        }

        .linkButton {
          color: var(--primary-text-color);
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-automation-trace": HaAutomationTrace;
  }
}
