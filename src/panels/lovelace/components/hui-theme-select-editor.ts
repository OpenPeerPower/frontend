import "@material/mwc-button";
import "@polymer/paper-dropdown-menu/paper-dropdown-menu";
import "@polymer/paper-item/paper-item";
import "@polymer/paper-listbox/paper-listbox";
import {
  css,
  CSSResult,
  customElement,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import { fireEvent } from "../../../common/dom/fire_event";
import { OpenPeerPower } from "../../../types";

@customElement("hui-theme-select-editor")
export class HuiThemeSelectEditor extends LitElement {
  @property() public value?: string;

  @property() public label?: string;

  @property({ attribute: false }) public opp?: OpenPeerPower;

  protected render(): TemplateResult {
    return html`
      <paper-dropdown-menu
        .label=${this.label ||
        `${this.opp!.localize(
          "ui.panel.lovelace.editor.card.generic.theme"
        )} (${this.opp!.localize(
          "ui.panel.lovelace.editor.card.config.optional"
        )})`}
        dynamic-align
      >
        <paper-listbox
          slot="dropdown-content"
          .selected=${this.value}
          attr-for-selected="theme"
          @iron-select=${this._changed}
        >
          <paper-item theme="remove"
            >${this.opp!.localize(
              "ui.panel.lovelace.editor.card.generic.no_theme"
            )}</paper-item
          >
          ${Object.keys(this.opp!.themes.themes)
            .sort()
            .map((theme) => {
              return html` <paper-item theme=${theme}>${theme}</paper-item> `;
            })}
        </paper-listbox>
      </paper-dropdown-menu>
    `;
  }

  static get styles(): CSSResult {
    return css`
      paper-dropdown-menu {
        width: 100%;
      }
      paper-item {
        cursor: pointer;
      }
    `;
  }

  private _changed(ev): void {
    if (!this.opp || ev.target.selected === "") {
      return;
    }
    this.value = ev.target.selected === "remove" ? "" : ev.target.selected;
    fireEvent(this, "value-changed", { value: this.value });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-theme-select-editor": HuiThemeSelectEditor;
  }
}
