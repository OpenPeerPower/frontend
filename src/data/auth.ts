import { OpenPeerPower } from "../types";

export interface AuthUrlSearchParams {
  client_id?: string;
  redirect_uri?: string;
  state?: string;
}

export interface AuthProvider {
  name: string;
  id: string;
  type: string;
}

export interface Credential {
  type: string;
}

export interface SignedPath {
  path: string;
}

export const oppUrl = `${location.protocol}//${location.host}`;

export const getSignedPath = (
  opp: OpenPeerPower,
  path: string
): Promise<SignedPath> => opp.callWS({ type: "auth/sign_path", path });

export const fetchAuthProviders = () =>
  fetch("/auth/providers", {
    credentials: "same-origin",
  });

export const createAuthForUser = async (
  opp: OpenPeerPower,
  userId: string,
  username: string,
  password: string
) =>
  opp.callWS({
    type: "config/auth_provider/openpeerpower/create",
    user_id: userId,
    username,
    password,
  });

export const adminChangePassword = async (
  opp: OpenPeerPower,
  userId: string,
  password: string
) =>
  opp.callWS<void>({
    type: "config/auth_provider/openpeerpower/admin_change_password",
    user_id: userId,
    password,
  });
