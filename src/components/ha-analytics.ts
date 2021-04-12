import "@polymer/paper-tooltip/paper-tooltip";
import {
  css,
  CSSResult,
  customElement,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import { isComponentLoaded } from "../common/config/is_component_loaded";
import { fireEvent } from "../common/dom/fire_event";
import { Analytics, AnalyticsPreferences } from "../data/analytics";
import { haStyle } from "../resources/styles";
import { OpenPeerPower } from "../types";
import "./ha-checkbox";
import type { HaCheckbox } from "./ha-checkbox";
import "./ha-settings-row";

const ADDITIONAL_PREFERENCES = ["usage", "statistics"];

declare global {
  interface OPPDomEvents {
    "analytics-preferences-changed": { preferences: AnalyticsPreferences };
  }
}

@customElement("ha-analytics")
export class HaAnalytics extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public analytics?: Analytics;

  protected render(): TemplateResult {
    const loading = this.analytics === undefined;
    const baseEnabled = !loading && this.analytics!.preferences.base;

    return html`
      <ha-settings-row>
        <span slot="prefix">
          <ha-checkbox
            @change=${this._handleRowCheckboxClick}
            .checked=${baseEnabled}
            .preference=${"base"}
            .disabled=${loading}
            name="base"
          >
          </ha-checkbox>
        </span>
        <span slot="heading" data-for="base">
          ${this.opp.localize(
            `ui.panel.config.core.section.core.analytics.preference.base.title`
          )}
        </span>
        <span slot="description" data-for="base">
          ${this.opp.localize(
            `ui.panel.config.core.section.core.analytics.preference.base.description`
          )}
        </span>
      </ha-settings-row>
      ${ADDITIONAL_PREFERENCES.map(
        (preference) =>
          html`<ha-settings-row>
            <span slot="prefix">
              <ha-checkbox
                @change=${this._handleRowCheckboxClick}
                .checked=${this.analytics?.preferences[preference]}
                .preference=${preference}
                name=${preference}
              >
              </ha-checkbox>
              ${!baseEnabled
                ? html`<paper-tooltip animation-delay="0" position="right"
                    >${this.opp.localize(
                      "ui.panel.config.core.section.core.analytics.needs_base"
                    )}
                  </paper-tooltip>`
                : ""}
            </span>
            <span slot="heading" data-for=${preference}>
              ${preference === "usage"
                ? isComponentLoaded(this.opp, "oppio")
                  ? this.opp.localize(
                      `ui.panel.config.core.section.core.analytics.preference.usage_supervisor.title`
                    )
                  : this.opp.localize(
                      `ui.panel.config.core.section.core.analytics.preference.usage.title`
                    )
                : this.opp.localize(
                    `ui.panel.config.core.section.core.analytics.preference.${preference}.title`
                  )}
            </span>
            <span slot="description" data-for=${preference}>
              ${preference !== "usage"
                ? this.opp.localize(
                    `ui.panel.config.core.section.core.analytics.preference.${preference}.description`
                  )
                : isComponentLoaded(this.opp, "oppio")
                ? this.opp.localize(
                    `ui.panel.config.core.section.core.analytics.preference.usage_supervisor.description`
                  )
                : this.opp.localize(
                    `ui.panel.config.core.section.core.analytics.preference.usage.description`
                  )}
            </span>
          </ha-settings-row>`
      )}
      <ha-settings-row>
        <span slot="prefix">
          <ha-checkbox
            @change=${this._handleRowCheckboxClick}
            .checked=${this.analytics?.preferences.diagnostics}
            .preference=${"diagnostics"}
            .disabled=${loading}
            name="diagnostics"
          >
          </ha-checkbox>
        </span>
        <span slot="heading" data-for="diagnostics">
          ${this.opp.localize(
            `ui.panel.config.core.section.core.analytics.preference.diagnostics.title`
          )}
        </span>
        <span slot="description" data-for="diagnostics">
          ${this.opp.localize(
            `ui.panel.config.core.section.core.analytics.preference.diagnostics.description`
          )}
        </span>
      </ha-settings-row>
    `;
  }

  protected updated(changedProps) {
    super.updated(changedProps);

    this.shadowRoot!.querySelectorAll("*[data-for]").forEach((el) => {
      const forEl = (el as HTMLElement).dataset.for;
      delete (el as HTMLElement).dataset.for;

      el.addEventListener("click", () => {
        const toFocus = this.shadowRoot!.querySelector(
          `*[name=${forEl}]`
        ) as HTMLElement | null;

        if (toFocus) {
          toFocus.focus();
          toFocus.click();
        }
      });
    });
  }

  private _handleRowCheckboxClick(ev: Event) {
    const checkbox = ev.currentTarget as HaCheckbox;
    const preference = (checkbox as any).preference;
    const preferences = this.analytics ? { ...this.analytics.preferences } : {};

    if (preferences[preference] === checkbox.checked) {
      return;
    }

    preferences[preference] = checkbox.checked;

    if (ADDITIONAL_PREFERENCES.includes(preference) && checkbox.checked) {
      preferences.base = true;
    } else if (preference === "base" && !checkbox.checked) {
      preferences.usage = false;
      preferences.statistics = false;
    }

    fireEvent(this, "analytics-preferences-changed", { preferences });
  }

  static get styles(): CSSResult[] {
    return [
      haStyle,
      css`
        .error {
          color: var(--error-color);
        }

        ha-settings-row {
          padding: 0;
        }

        span[slot="heading"],
        span[slot="description"] {
          cursor: pointer;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-analytics": HaAnalytics;
  }
}
