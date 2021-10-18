import "@material/mwc-button";
import {
  css,
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import { isComponentLoaded } from "../../../common/config/is_component_loaded";
import { fireEvent } from "../../../common/dom/fire_event";
import "../../../components/op-blueprint-picker";
import "../../../components/op-card";
import "../../../components/op-circular-progress";
import "../../../components/op-dialog";
import {
  AutomationConfig,
  showAutomationEditor,
} from "../../../data/automation";
import { haStyle, haStyleDialog } from "../../../resources/styles";
import type { OpenPeerPower } from "../../../types";
import { showThingtalkDialog } from "./thingtalk/show-dialog-thingtalk";

@customElement("op-dialog-new-automation")
class DialogNewAutomation extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @internalProperty() private _opened = false;

  public showDialog(): void {
    this._opened = true;
  }

  public closeDialog(): void {
    this._opened = false;
    fireEvent(this, "dialog-closed", { dialog: this.localName });
  }

  protected render(): TemplateResult {
    if (!this._opened) {
      return html``;
    }
    return html`
      <op-dialog
        open
        @closed=${this.closeDialog}
        .heading=${this.opp.localize(
          "ui.panel.config.automation.dialog_new.header"
        )}
      >
        <div>
          ${this.opp.localize("ui.panel.config.automation.dialog_new.how")}
          <div class="container">
            ${isComponentLoaded(this.opp, "cloud")
              ? html`<op-card outlined>
                  <div>
                    <h3>
                      ${this.opp.localize(
                        "ui.panel.config.automation.dialog_new.thingtalk.header"
                      )}
                    </h3>
                    ${this.opp.localize(
                      "ui.panel.config.automation.dialog_new.thingtalk.intro"
                    )}
                    <div class="side-by-side">
                      <paper-input
                        id="input"
                        .label=${this.opp.localize(
                          "ui.panel.config.automation.dialog_new.thingtalk.input_label"
                        )}
                      ></paper-input>
                      <mwc-button @click=${this._thingTalk}
                        >${this.opp.localize(
                          "ui.panel.config.automation.dialog_new.thingtalk.create"
                        )}</mwc-button
                      >
                    </div>
                  </div>
                </op-card>`
              : html``}
            ${isComponentLoaded(this.opp, "blueprint")
              ? html`<op-card outlined>
                  <div>
                    <h3>
                      ${this.opp.localize(
                        "ui.panel.config.automation.dialog_new.blueprint.use_blueprint"
                      )}
                    </h3>
                    <op-blueprint-picker
                      @value-changed=${this._blueprintPicked}
                      .opp=${this.opp}
                    ></op-blueprint-picker>
                  </div>
                </op-card>`
              : html``}
          </div>
        </div>
        <mwc-button slot="primaryAction" @click=${this._blank}>
          ${this.opp.localize(
            "ui.panel.config.automation.dialog_new.start_empty"
          )}
        </mwc-button>
      </op-dialog>
    `;
  }

  private _thingTalk() {
    this.closeDialog();
    showThingtalkDialog(this, {
      callback: (config: Partial<AutomationConfig> | undefined) =>
        showAutomationEditor(this, config),
      input: this.shadowRoot!.querySelector("paper-input")!.value as string,
    });
  }

  private _blueprintPicked(ev: CustomEvent) {
    showAutomationEditor(this, { use_blueprint: { path: ev.detail.value } });
    this.closeDialog();
  }

  private _blank() {
    showAutomationEditor(this);
    this.closeDialog();
  }

  static get styles(): CSSResult[] {
    return [
      haStyle,
      haStyleDialog,
      css`
        .container {
          display: flex;
        }
        op-card {
          width: calc(50% - 8px);
          margin: 4px;
        }
        op-card div {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        op-card {
          box-sizing: border-box;
          padding: 8px;
        }
        op-blueprint-picker {
          width: 100%;
        }
        .side-by-side {
          display: flex;
          flex-direction: row;
          align-items: flex-end;
        }
        @media all and (max-width: 500px) {
          .container {
            flex-direction: column;
          }
          op-card {
            width: 100%;
          }
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-dialog-new-automation": DialogNewAutomation;
  }
}
