import { html } from "lit";
import { OpenPeerPower } from "../types";
import { documentationUrl } from "../util/documentation-url";

export const analyticsLearnMore = (opp: OpenPeerPower) => html`<a
  .href=${documentationUrl(opp, "/integrations/analytics/")}
  target="_blank"
  rel="noreferrer"
>
  How we process your data
</a>`;
