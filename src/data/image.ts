import { OpenPeerPower } from "../types";

interface Image {
  filesize: number;
  name: string;
  uploaded_at: string; // isoformat date
  content_type: string;
  id: string;
}

export interface ImageMutableParams {
  name: string;
}

export const generateImageThumbnailUrl = (mediaId: string, size: number) =>
  `/api/image/serve/${mediaId}/${size}x${size}`;

export const fetchImages = (opp: OpenPeerPower) =>
  opp.callWS<Image[]>({ type: "image/list" });

export const createImage = async (
  opp: OpenPeerPower,
  file: File
): Promise<Image> => {
  const fd = new FormData();
  fd.append("file", file);
  const resp = await opp.fetchWithAuth("/api/image/upload", {
    method: "POST",
    body: fd,
  });
  if (resp.status === 413) {
    throw new Error("Uploaded image is too large");
  } else if (resp.status !== 200) {
    throw new Error("Unknown error");
  }
  return await resp.json();
};

export const updateImage = (
  opp: OpenPeerPower,
  id: string,
  updates: Partial<ImageMutableParams>
) =>
  opp.callWS<Image>({
    type: "image/update",
    media_id: id,
    ...updates,
  });

export const deleteImage = (opp: OpenPeerPower, id: string) =>
  opp.callWS({
    type: "image/delete",
    media_id: id,
  });
