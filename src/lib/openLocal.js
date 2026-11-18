// One-tap open of a local video on the user's Mac or PC.
// Browsers can't open file:// paths, so we fire a wiser-open:// link that a tiny
// one-time helper (public/helpers/install-*) registers on each device.
export function openLocalHref(path) {
  return 'wiser-open://open?path=' + encodeURIComponent(path.trim())
}

export function openLocal(path) {
  if (!path || !path.trim()) return
  window.location.href = openLocalHref(path)
}
