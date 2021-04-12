import { OpenPeerPower } from "../types";
import { handleFetchPromise } from "../util/opp-call-api";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface OnboardingCoreConfigStepResponse {}

export interface OnboardingUserStepResponse {
  auth_code: string;
}

export interface OnboardingIntegrationStepResponse {
  auth_code: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface OnboardingAnalyticsStepResponse {}

export interface OnboardingResponses {
  user: OnboardingUserStepResponse;
  core_config: OnboardingCoreConfigStepResponse;
  integration: OnboardingIntegrationStepResponse;
  analytics: OnboardingAnalyticsStepResponse;
}

export type ValidOnboardingStep = keyof OnboardingResponses;

export interface OnboardingStep {
  step: ValidOnboardingStep;
  done: boolean;
}

export const fetchOnboardingOverview = () =>
  fetch("/api/onboarding", { credentials: "same-origin" });

export const onboardUserStep = (params: {
  client_id: string;
  name: string;
  username: string;
  password: string;
  language: string;
}) =>
  handleFetchPromise<OnboardingUserStepResponse>(
    fetch("/api/onboarding/users", {
      method: "POST",
      credentials: "same-origin",
      body: JSON.stringify(params),
    })
  );

export const onboardCoreConfigStep = (opp: OpenPeerPower) =>
  opp.callApi<OnboardingCoreConfigStepResponse>(
    "POST",
    "onboarding/core_config"
  );

export const onboardAnalyticsStep = (opp: OpenPeerPower) =>
  opp.callApi<OnboardingAnalyticsStepResponse>("POST", "onboarding/analytics");

export const onboardIntegrationStep = (
  opp: OpenPeerPower,
  params: { client_id: string; redirect_uri: string }
) =>
  opp.callApi<OnboardingIntegrationStepResponse>(
    "POST",
    "onboarding/integration",
    params
  );
