import { html } from "lit-element";
import { OpenPeerPower } from "../types";
import { documentationUrl } from "../util/documentation-url";

export const analyticsLearnMore = (opp: OpenPeerPower) => html`<a
  .href=${documentationUrl(opp, "/integrations/analytics/")}
  target="_blank"
  rel="noreferrer"
  >${opp.localize("ui.panel.config.core.section.core.analytics.learn_more")}</a
>`;
