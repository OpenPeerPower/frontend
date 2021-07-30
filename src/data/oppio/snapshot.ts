import { atLeastVersion } from "../../common/config/version";
import { OpenPeerPower } from "../../types";
import { oppioApiResultExtractor, OppioResponse } from "./common";

export const friendlyFolderName = {
  ssl: "SSL",
  openpeerpower: "Configuration",
  "addons/local": "Local add-ons",
  media: "Media",
  share: "Share",
};

interface SnapshotContent {
  openpeerpower: boolean;
  folders: string[];
  addons: string[];
}

export interface OppioSnapshot {
  slug: string;
  date: string;
  name: string;
  type: "full" | "partial";
  protected: boolean;
  content: SnapshotContent;
}

export interface OppioSnapshotDetail extends OppioSnapshot {
  size: number;
  openpeerpower: string;
  addons: Array<{
    slug: "ADDON_SLUG";
    name: "NAME";
    version: "INSTALLED_VERSION";
    size: "SIZE_IN_MB";
  }>;
  repositories: string[];
  folders: string[];
}

export interface OppioFullSnapshotCreateParams {
  name: string;
  password?: string;
  confirm_password?: string;
}
export interface OppioPartialSnapshotCreateParams
  extends OppioFullSnapshotCreateParams {
  folders?: string[];
  addons?: string[];
  openpeerpower?: boolean;
}

export const fetchOppioSnapshots = async (
  opp: OpenPeerPower
): Promise<OppioSnapshot[]> => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    const data: { snapshots: OppioSnapshot[] } = await opp.callWS({
      type: "supervisor/api",
      endpoint: `/snapshots`,
      method: "get",
    });
    return data.snapshots;
  }

  return oppioApiResultExtractor(
    await opp.callApi<OppioResponse<{ snapshots: OppioSnapshot[] }>>(
      "GET",
      "oppio/snapshots"
    )
  ).snapshots;
};

export const fetchOppioSnapshotInfo = async (
  opp: OpenPeerPower,
  snapshot: string
): Promise<OppioSnapshotDetail> => {
  if (opp) {
    if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
      return opp.callWS({
        type: "supervisor/api",
        endpoint: `/snapshots/${snapshot}/info`,
        method: "get",
      });
    }
    return oppioApiResultExtractor(
      await opp.callApi<OppioResponse<OppioSnapshotDetail>>(
        "GET",
        `oppio/snapshots/${snapshot}/info`
      )
    );
  }
  // When called from onboarding we don't have opp
  const resp = await fetch(`/api/oppio/snapshots/${snapshot}/info`, {
    method: "GET",
  });
  const data = (await resp.json()).data;
  return data;
};

export const reloadOppioSnapshots = async (opp: OpenPeerPower) => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    await opp.callWS({
      type: "supervisor/api",
      endpoint: "/snapshots/reload",
      method: "post",
    });
    return;
  }

  await opp.callApi<OppioResponse<void>>("POST", `oppio/snapshots/reload`);
};

export const createOppioFullSnapshot = async (
  opp: OpenPeerPower,
  data: OppioFullSnapshotCreateParams
) => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    await opp.callWS({
      type: "supervisor/api",
      endpoint: "/snapshots/new/full",
      method: "post",
      timeout: null,
      data,
    });
    return;
  }
  await opp.callApi<OppioResponse<void>>(
    "POST",
    `oppio/snapshots/new/full`,
    data
  );
};

export const removeSnapshot = async (opp: OpenPeerPower, slug: string) => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    await opp.callWS({
      type: "supervisor/api",
      endpoint: `/snapshots/${slug}/remove`,
      method: "post",
    });
    return;
  }
  await opp.callApi<OppioResponse<void>>(
    "POST",
    `oppio/snapshots/${slug}/remove`
  );
};

export const createOppioPartialSnapshot = async (
  opp: OpenPeerPower,
  data: OppioPartialSnapshotCreateParams
) => {
  if (atLeastVersion(opp.config.version, 2021, 2, 4)) {
    await opp.callWS({
      type: "supervisor/api",
      endpoint: "/snapshots/new/partial",
      method: "post",
      timeout: null,
      data,
    });
    return;
  }

  await opp.callApi<OppioResponse<void>>(
    "POST",
    `oppio/snapshots/new/partial`,
    data
  );
};

export const uploadSnapshot = async (
  opp: OpenPeerPower,
  file: File
): Promise<OppioResponse<OppioSnapshot>> => {
  const fd = new FormData();
  let resp;
  fd.append("file", file);
  if (opp) {
    resp = await opp.fetchWithAuth("/api/oppio/snapshots/new/upload", {
      method: "POST",
      body: fd,
    });
  } else {
    // When called from onboarding we don't have opp
    resp = await fetch("/api/oppio/snapshots/new/upload", {
      method: "POST",
      body: fd,
    });
  }

  if (resp.status === 413) {
    throw new Error("Uploaded snapshot is too large");
  } else if (resp.status !== 200) {
    throw new Error(`${resp.status} ${resp.statusText}`);
  }
  return resp.json();
};
