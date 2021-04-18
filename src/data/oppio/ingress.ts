import { atLeastVersion } from "../../common/config/version";
import { OpenPeerPower } from "../../types";
import { OppioResponse } from "./common";
import { CreateSessionResponse } from "./supervisor";

function setIngressCookie(session: string): string {
  document.cookie = `ingress_session=${session};path=/api/oppio_ingress/;SameSite=Strict${
    location.protocol === "https:" ? ";Secure" : ""
  }`;
  return session;
}

export const createOppioSession = async (
  opp: OpenPeerPower
): Promise<string> => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    const wsResponse: { session: string } = await opp.callWS({
      type: "supervisor/api",
      endpoint: "/ingress/session",
      method: "post",
    });
    return setIngressCookie(wsResponse.session);
  }

  const restResponse: { data: { session: string } } = await opp.callApi<
    OppioResponse<CreateSessionResponse>
  >("POST", "oppio/ingress/session");
  return setIngressCookie(restResponse.data.session);
};

export const validateOppioSession = async (
  opp: OpenPeerPower,
  session: string
): Promise<void> => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    await opp.callWS({
      type: "supervisor/api",
      endpoint: "/ingress/validate_session",
      method: "post",
      data: { session },
    });
    return;
  }

  await opp.callApi<OppioResponse<void>>(
    "POST",
    "oppio/ingress/validate_session",
    { session }
  );
};
