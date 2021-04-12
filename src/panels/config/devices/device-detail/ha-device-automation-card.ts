import {
  css,
  CSSResult,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import "../../../../components/ha-card";
import "../../../../components/ha-chip-set";
import { showAutomationEditor } from "../../../../data/automation";
import {
  DeviceAction,
  DeviceAutomation,
} from "../../../../data/device_automation";
import { showScriptEditor } from "../../../../data/script";
import { OpenPeerPower } from "../../../../types";

export abstract class HaDeviceAutomationCard<
  T extends DeviceAutomation
> extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public deviceId?: string;

  @property() public script = false;

  @property() public automations: T[] = [];

  protected headerKey = "";

  protected type = "";

  private _localizeDeviceAutomation: (
    opp: OpenPeerPower,
    automation: T
  ) => string;

  constructor(
    localizeDeviceAutomation: HaDeviceAutomationCard<
      T
    >["_localizeDeviceAutomation"]
  ) {
    super();
    this._localizeDeviceAutomation = localizeDeviceAutomation;
  }

  protected shouldUpdate(changedProps): boolean {
    if (changedProps.has("deviceId") || changedProps.has("automations")) {
      return true;
    }
    const oldOpp = changedProps.get("opp") as OpenPeerPower | undefined;
    if (!oldOpp || oldOpp.language !== this.opp.language) {
      return true;
    }
    return false;
  }

  protected render(): TemplateResult {
    if (this.automations.length === 0) {
      return html``;
    }
    return html`
      <h3>
        ${this.opp.localize(this.headerKey)}
      </h3>
      <div class="content">
        <ha-chip-set
          @chip-clicked=${this._handleAutomationClicked}
          .items=${this.automations.map((automation) =>
            this._localizeDeviceAutomation(this.opp, automation)
          )}
        >
        </ha-chip-set>
      </div>
    `;
  }

  private _handleAutomationClicked(ev: CustomEvent) {
    const automation = this.automations[ev.detail.index];
    if (!automation) {
      return;
    }
    if (this.script) {
      showScriptEditor(this, { sequence: [automation as DeviceAction] });
      return;
    }
    const data = {};
    data[this.type] = [automation];
    showAutomationEditor(this, data);
  }

  static get styles(): CSSResult {
    return css`
      h3 {
        color: var(--primary-text-color);
      }
    `;
  }
}
