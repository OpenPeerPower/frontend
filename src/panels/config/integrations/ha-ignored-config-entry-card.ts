import {
  customElement,
  LitElement,
  property,
  css,
  html,
  TemplateResult,
} from "lit-element";
import { fireEvent } from "../../../common/dom/fire_event";
import { deleteConfigEntry } from "../../../data/config_entries";
import type { IntegrationManifest } from "../../../data/integration";
import { showConfirmationDialog } from "../../../dialogs/generic/show-dialog-box";
import type { OpenPeerPower } from "../../../types";
import type { ConfigEntryExtended } from "./ha-config-integrations";
import "./ha-integration-action-card";

@customElement("ha-ignored-config-entry-card")
export class HaIgnoredConfigEntryCard extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public entry!: ConfigEntryExtended;

  @property() public manifest?: IntegrationManifest;

  protected render(): TemplateResult {
    return html`
      <ha-integration-action-card
        .opp=${this.opp}
        .manifest=${this.manifest}
        .banner=${this.opp.localize(
          "ui.panel.config.integrations.ignore.ignored"
        )}
        .domain=${this.entry.domain}
        .localizedDomainName=${this.entry.localized_domain_name}
        .label=${this.entry.title === "Ignored"
          ? // In 2020.2 we added support for entry.title. All ignored entries before
            // that have title "Ignored" so we fallback to localized domain name.
            this.entry.localized_domain_name
          : this.entry.title}
      >
        <mwc-button
          @click=${this._removeIgnoredIntegration}
          .label=${this.opp.localize(
            "ui.panel.config.integrations.ignore.stop_ignore"
          )}
        ></mwc-button>
      </ha-integration-action-card>
    `;
  }

  private async _removeIgnoredIntegration() {
    showConfirmationDialog(this, {
      title: this.opp!.localize(
        "ui.panel.config.integrations.ignore.confirm_delete_ignore_title",
        "name",
        this.opp.localize(`component.${this.entry.domain}.title`)
      ),
      text: this.opp!.localize(
        "ui.panel.config.integrations.ignore.confirm_delete_ignore"
      ),
      confirmText: this.opp!.localize(
        "ui.panel.config.integrations.ignore.stop_ignore"
      ),
      confirm: async () => {
        const result = await deleteConfigEntry(this.opp, this.entry.entry_id);
        if (result.require_restart) {
          alert(
            this.opp.localize(
              "ui.panel.config.integrations.config_entry.restart_confirm"
            )
          );
        }
        fireEvent(this, "change", undefined, {
          bubbles: false,
        });
      },
    });
  }

  static styles = css`
    :host {
      --state-color: var(--divider-color, #e0e0e0);
    }

    mwc-button {
      --mdc-theme-primary: var(--primary-color);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-ignored-config-entry-card": HaIgnoredConfigEntryCard;
  }
}
