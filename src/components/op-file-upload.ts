import "@material/mwc-icon-button/mwc-icon-button";
import { mdiClose } from "@mdi/js";
import "@polymer/iron-input/iron-input";
import "@polymer/paper-input/paper-input-container";
import { css, html, LitElement, PropertyValues, TemplateResult } from "lit";
import { customElement, property, state, query } from "lit/decorators";
import { classMap } from "lit/directives/class-map";
import { fireEvent } from "../common/dom/fire_event";
import "./op-circular-progress";
import "./op-svg-icon";

declare global {
  interface OPPDomEvents {
    "file-picked": { files: FileList };
  }
}

@customElement("op-file-upload")
export class HaFileUpload extends LitElement {
  @property() public accept!: string;

  @property() public icon!: string;

  @property() public label!: string;

  @property() public value: string | TemplateResult | null = null;

  @property({ type: Boolean }) private uploading = false;

  @property({ type: Boolean, attribute: "auto-open-file-dialog" })
  private autoOpenFileDialog = false;

  @state() private _drag = false;

  @query("#input") private _input?: HTMLInputElement;

  protected firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    if (this.autoOpenFileDialog) {
      this._input?.click();
    }
  }

  protected updated(changedProperties: PropertyValues) {
    if (changedProperties.has("_drag") && !this.uploading) {
      (
        this.shadowRoot!.querySelector("paper-input-container") as any
      )._setFocused(this._drag);
    }
  }

  public render(): TemplateResult {
    return html`
      ${this.uploading
        ? html`<op-circular-progress
            alt="Uploading"
            size="large"
            active
          ></op-circular-progress>`
        : html`
            <label for="input">
              <paper-input-container
                .alwaysFloatLabel=${Boolean(this.value)}
                @drop=${this._handleDrop}
                @dragenter=${this._handleDragStart}
                @dragover=${this._handleDragStart}
                @dragleave=${this._handleDragEnd}
                @dragend=${this._handleDragEnd}
                class=${classMap({
                  dragged: this._drag,
                })}
              >
                <label for="input" slot="label"> ${this.label} </label>
                <iron-input slot="input">
                  <input
                    id="input"
                    type="file"
                    class="file"
                    accept=${this.accept}
                    @change=${this._handleFilePicked}
                  />
                  ${this.value}
                </iron-input>
                ${this.value
                  ? html`<mwc-icon-button
                      slot="suffix"
                      @click=${this._clearValue}
                    >
                      <op-svg-icon .path=${mdiClose}></op-svg-icon>
                    </mwc-icon-button>`
                  : html`<mwc-icon-button slot="suffix">
                      <op-svg-icon .path=${this.icon}></op-svg-icon>
                    </mwc-icon-button>`}
              </paper-input-container>
            </label>
          `}
    `;
  }

  private _handleDrop(ev: DragEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    if (ev.dataTransfer?.files) {
      fireEvent(this, "file-picked", { files: ev.dataTransfer.files });
    }
    this._drag = false;
  }

  private _handleDragStart(ev: DragEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    this._drag = true;
  }

  private _handleDragEnd(ev: DragEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    this._drag = false;
  }

  private _handleFilePicked(ev) {
    fireEvent(this, "file-picked", { files: ev.target.files });
  }

  private _clearValue(ev: Event) {
    ev.preventDefault();
    this.value = null;
    fireEvent(this, "change");
  }

  static get styles() {
    return css`
      paper-input-container {
        position: relative;
        padding: 8px;
        margin: 0 -8px;
      }
      paper-input-container.dragged:before {
        position: var(--layout-fit_-_position);
        top: var(--layout-fit_-_top);
        right: var(--layout-fit_-_right);
        bottom: var(--layout-fit_-_bottom);
        left: var(--layout-fit_-_left);
        background: currentColor;
        content: "";
        opacity: var(--dark-divider-opacity);
        pointer-events: none;
        border-radius: 4px;
      }
      input.file {
        display: none;
      }
      img {
        max-width: 125px;
        max-height: 125px;
      }
      mwc-icon-button {
        --mdc-icon-button-size: 24px;
        --mdc-icon-size: 20px;
      }
      op-circular-progress {
        display: block;
        text-align-last: center;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-file-upload": HaFileUpload;
  }
}
