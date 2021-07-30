import { sanitizeUrl } from "@braintree/sanitize-url";
import { html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators";
import { navigate } from "../../src/common/navigate";
import {
  createSearchParam,
  extractSearchParamsObject,
} from "../../src/common/url/search-params";
import { Supervisor } from "../../src/data/supervisor/supervisor";
import "../../src/layouts/opp-error-screen";
import {
  ParamType,
  Redirect,
  Redirects,
} from "../../src/panels/my/ha-panel-my";
import { OpenPeerPower, Route } from "../../src/types";

const REDIRECTS: Redirects = {
  supervisor: {
    redirect: "/oppio/dashboard",
  },
  supervisor_logs: {
    redirect: "/oppio/system",
  },
  supervisor_info: {
    redirect: "/oppio/system",
  },
  supervisor_snapshots: {
    redirect: "/oppio/snapshots",
  },
  supervisor_store: {
    redirect: "/oppio/store",
  },
  supervisor_addon: {
    redirect: "/oppio/addon",
    params: {
      addon: "string",
    },
  },
  supervisor_ingress: {
    redirect: "/oppio/ingress",
    params: {
      addon: "string",
    },
  },
  supervisor_add_addon_repository: {
    redirect: "/oppio/store",
    params: {
      repository_url: "url",
    },
  },
};

@customElement("oppio-my-redirect")
class OppioMyRedirect extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public supervisor!: Supervisor;

  @property({ attribute: false }) public route!: Route;

  @state() public _error?: TemplateResult | string;

  connectedCallback() {
    super.connectedCallback();
    const path = this.route.path.substr(1);
    const redirect = REDIRECTS[path];

    if (!redirect) {
      this._error = this.supervisor.localize(
        "my.not_supported",
        "link",
        html`<a
          target="_blank"
          rel="noreferrer noopener"
          href="https://my.openpeerpower.io/faq.html#supported-pages"
        >
          ${this.supervisor.localize("my.faq_link")}
        </a>`
      );
      return;
    }

    let url: string;
    try {
      url = this._createRedirectUrl(redirect);
    } catch (err) {
      this._error = this.supervisor.localize("my.error");
      return;
    }

    navigate(url, { replace: true });
  }

  protected render(): TemplateResult {
    if (this._error) {
      return html`<opp-error-screen
        .error=${this._error}
      ></opp-error-screen>`;
    }
    return html``;
  }

  private _createRedirectUrl(redirect: Redirect): string {
    const params = this._createRedirectParams(redirect);
    return `${redirect.redirect}${params}`;
  }

  private _createRedirectParams(redirect: Redirect): string {
    const params = extractSearchParamsObject();
    if (!redirect.params && !Object.keys(params).length) {
      return "";
    }
    const resultParams = {};
    Object.entries(redirect.params || {}).forEach(([key, type]) => {
      if (!params[key] || !this._checkParamType(type, params[key])) {
        throw Error();
      }
      resultParams[key] = params[key];
    });
    return `?${createSearchParam(resultParams)}`;
  }

  private _checkParamType(type: ParamType, value: string) {
    if (type === "string") {
      return true;
    }
    if (type === "url") {
      return value && value === sanitizeUrl(value);
    }
    return false;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "oppio-my-redirect": OppioMyRedirect;
  }
}
