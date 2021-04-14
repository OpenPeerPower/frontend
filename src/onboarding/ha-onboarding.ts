import {
  Auth,
  createConnection,
  genClientId,
  getAuth,
  subscribeConfig,
} from "openpeerpower-js-websocket";
import {
  customElement,
  html,
  internalProperty,
  property,
  PropertyValues,
  TemplateResult,
} from "lit-element";
import { OPPDomEvent } from "../common/dom/fire_event";
import { extractSearchParamsObject } from "../common/url/search-params";
import { subscribeOne } from "../common/util/subscribe-one";
import { AuthUrlSearchParams, oppUrl } from "../data/auth";
import { fetchDiscoveryInformation } from "../data/discovery";
import {
  fetchOnboardingOverview,
  OnboardingResponses,
  OnboardingStep,
  onboardIntegrationStep,
} from "../data/onboarding";
import { subscribeUser } from "../data/ws-user";
import { litLocalizeLiteMixin } from "../mixins/lit-localize-lite-mixin";
import { OppElement } from "../state/opp-element";
import { OpenPeerPower } from "../types";
import { registerServiceWorker } from "../util/register-service-worker";
import "./onboarding-create-user";
import "./onboarding-loading";
import "./onboarding-analytics";

type OnboardingEvent =
  | {
      type: "user";
      result: OnboardingResponses["user"];
    }
  | {
      type: "core_config";
      result: OnboardingResponses["core_config"];
    }
  | {
      type: "integration";
    }
  | {
      type: "analytics";
    };

declare global {
  interface OPPDomEvents {
    "onboarding-step": OnboardingEvent;
  }

  interface GlobalEventHandlersEventMap {
    "onboarding-step": OPPDomEvent<OnboardingEvent>;
  }
}

@customElement("ha-onboarding")
class HaOnboarding extends litLocalizeLiteMixin(OppElement) {
  @property({ attribute: false }) public opp?: OpenPeerPower;

  public translationFragment = "page-onboarding";

  @internalProperty() private _loading = false;

  @internalProperty() private _restoring = false;

  @internalProperty() private _supervisor?: boolean;

  @internalProperty() private _steps?: OnboardingStep[];

  protected render(): TemplateResult {
    const step = this._curStep()!;

    if (this._loading || !step) {
      return html` <onboarding-loading></onboarding-loading> `;
    }
    if (step.step === "user") {
      return html`
        ${!this._restoring
          ? html`<onboarding-create-user
              .localize=${this.localize}
              .language=${this.language}
            >
            </onboarding-create-user>`
          : ""}
        ${this._supervisor
          ? html`<onboarding-restore-snapshot
              .localize=${this.localize}
              .restoring=${this._restoring}
              @restoring=${this._restoringSnapshot}
            >
            </onboarding-restore-snapshot>`
          : ""}
      `;
    }
    if (step.step === "core_config") {
      return html`
        <onboarding-core-config
          .opp=${this.opp}
          .onboardingLocalize=${this.localize}
        ></onboarding-core-config>
      `;
    }
    if (step.step === "analytics") {
      return html`
        <onboarding-analytics
          .opp=${this.opp}
          .localize=${this.localize}
        ></onboarding-analytics>
      `;
    }

    if (step.step === "integration") {
      return html`
        <onboarding-integrations
          .opp=${this.opp}
          .onboardingLocalize=${this.localize}
        ></onboarding-integrations>
      `;
    }
    return html``;
  }

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);
    this._fetchOnboardingSteps();
    this._fetchDiscoveryInformation();
    import("./onboarding-integrations");
    import("./onboarding-core-config");
    registerServiceWorker(this, false);
    this.addEventListener("onboarding-step", (ev) => this._handleStepDone(ev));
    if (window.innerWidth > 450) {
      import("./particles");
    }
  }

  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);
    if (changedProps.has("language")) {
      document.querySelector("html")!.setAttribute("lang", this.language!);
    }
    if (changedProps.has("opp")) {
      this.oppChanged(
        this.opp!,
        changedProps.get("opp") as OpenPeerPower | undefined
      );
    }
  }

  private _curStep() {
    return this._steps ? this._steps.find((stp) => !stp.done) : undefined;
  }

  private _restoringSnapshot() {
    this._restoring = true;
  }

  private async _fetchDiscoveryInformation(): Promise<void> {
    try {
      const response = await fetchDiscoveryInformation();
      this._supervisor = [
        "Open Peer Power OS",
        "Open Peer Power Supervised",
      ].includes(response.installation_type);
      if (this._supervisor) {
        // Only load if we have supervisor
        import("./onboarding-restore-snapshot");
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        "Something went wrong loading onboarding-restore-snapshot",
        err
      );
    }
  }

  private async _fetchOnboardingSteps() {
    try {
      const response = await (window.stepsPromise || fetchOnboardingOverview());

      if (response.status === 404) {
        // We don't load the component when onboarding is done
        document.location.assign("/");
        return;
      }

      const steps: OnboardingStep[] = await response.json();

      if (steps.every((step) => step.done)) {
        // Onboarding is done!
        document.location.assign("/");
        return;
      }

      if (steps[0].done) {
        // First step is already done, so we need to get auth somewhere else.
        const auth = await getAuth({
          oppUrl,
        });
        history.replaceState(null, "", location.pathname);
        await this._connectOpp(auth);
      }

      this._steps = steps;
    } catch (err) {
      alert("Something went wrong loading onboarding, try refreshing");
    }
  }

  private async _handleStepDone(ev: OPPDomEvent<OnboardingEvent>) {
    const stepResult = ev.detail;
    this._steps = this._steps!.map((step) =>
      step.step === stepResult.type ? { ...step, done: true } : step
    );

    if (stepResult.type === "user") {
      const result = stepResult.result as OnboardingResponses["user"];
      this._loading = true;
      try {
        const auth = await getAuth({
          oppUrl,
          authCode: result.auth_code,
        });
        await this._connectOpp(auth);
      } catch (err) {
        alert("Ah snap, something went wrong!");
        location.reload();
      } finally {
        this._loading = false;
      }
    } else if (stepResult.type === "core_config") {
      // We do nothing
    } else if (stepResult.type === "integration") {
      this._loading = true;

      // Determine if oauth redirect has been provided
      const externalAuthParams = extractSearchParamsObject() as AuthUrlSearchParams;
      const authParams =
        externalAuthParams.client_id && externalAuthParams.redirect_uri
          ? externalAuthParams
          : {
              client_id: genClientId(),
              redirect_uri: `${location.protocol}//${location.host}/?auth_callback=1`,
              state: btoa(
                JSON.stringify({
                  oppUrl: `${location.protocol}//${location.host}`,
                  clientId: genClientId(),
                })
              ),
            };

      let result: OnboardingResponses["integration"];

      try {
        result = await onboardIntegrationStep(this.opp!, {
          client_id: authParams.client_id!,
          redirect_uri: authParams.redirect_uri!,
        });
      } catch (err) {
        this.opp!.connection.close();
        await this.opp!.auth.revoke();

        alert(`Unable to finish onboarding: ${err.message}`);

        document.location.assign("/?");
        return;
      }

      // If we don't close the connection manually, the connection will be
      // closed when we navigate away from the page. Firefox allows JS to
      // continue to execute, and so HAWS will automatically reconnect once
      // the connection is closed. However, since we revoke our token below,
      // HAWS will reload the page, since that will trigger the auth flow.
      // In Firefox, triggering a reload will overrule the navigation that
      // was in progress.
      this.opp!.connection.close();

      // Revoke current auth token.
      await this.opp!.auth.revoke();

      // Build up the url to redirect to
      let redirectUrl = authParams.redirect_uri!;
      redirectUrl +=
        (redirectUrl.includes("?") ? "&" : "?") +
        `code=${encodeURIComponent(result.auth_code)}`;

      if (authParams.state) {
        redirectUrl += `&state=${encodeURIComponent(authParams.state)}`;
      }

      document.location.assign(redirectUrl);
    }
  }

  private async _connectOpp(auth: Auth) {
    const conn = await createConnection({ auth });
    // Make sure config and user info is loaded before we initialize.
    // It is needed for the core config step.
    await Promise.all([
      subscribeOne(conn, subscribeConfig),
      subscribeOne(conn, subscribeUser),
    ]);
    this.initializeOpp(auth, conn);
    // Load config strings for integrations
    (this as any)._loadFragmentTranslations(this.opp!.language, "config");
    // Make sure opp is initialized + the config/user callbacks have called.
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-onboarding": HaOnboarding;
  }
}
