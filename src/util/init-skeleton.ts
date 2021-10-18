export const removeInitSkeleton = () => {
  const initEl = document.getElementById("op-init-skeleton");
  if (initEl) {
    initEl.parentElement!.removeChild(initEl);
  }
};
