export const brandsUrl = (
  domain: string,
  type: "icon" | "logo",
  useFallback?: boolean
): string => {
  return `https://brands.openpeerpower.io/${
    useFallback ? "_/" : ""
  }${domain}/${type}.png`;
};
