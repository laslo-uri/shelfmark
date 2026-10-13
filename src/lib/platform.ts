/**
 * Lightweight platform detection for cross-browser / cross-OS behavior.
 */

export interface PlatformInfo {
  os: "unknown" | "ios" | "huawei" | "android" | "mac" | "windows" | "linux";
  isIOS: boolean;
  isAndroid: boolean;
  isHuawei: boolean;
  isMac: boolean;
  isWindows: boolean;
  isLinux: boolean;
  isMobile: boolean;
  isDesktop: boolean;
  isStandalone: boolean;
  isSecureContext: boolean;
}

export function getPlatform(): PlatformInfo {
  if (typeof navigator === "undefined") {
    return {
      os: "unknown",
      isIOS: false,
      isAndroid: false,
      isHuawei: false,
      isMac: false,
      isWindows: false,
      isLinux: false,
      isMobile: false,
      isDesktop: true,
      isStandalone: false,
      isSecureContext: false,
    };
  }

  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isHuawei = /Huawei|HarmonyOS|HONOR|HUAWEI/i.test(ua);
  const isMac = !isIOS && /Mac/i.test(navigator.platform ?? "");
  const isWindows = /Win/i.test(navigator.platform ?? "");
  const isLinux = /Linux/i.test(navigator.platform ?? "") && !isAndroid && !isHuawei;

  let os: PlatformInfo["os"] = "unknown";
  if (isIOS) os = "ios";
  else if (isHuawei) os = "huawei";
  else if (isAndroid) os = "android";
  else if (isMac) os = "mac";
  else if (isWindows) os = "windows";
  else if (isLinux) os = "linux";

  const isMobile = isIOS || isAndroid || isHuawei;
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.navigator.standalone === true;

  return {
    os,
    isIOS,
    isAndroid,
    isHuawei,
    isMac,
    isWindows,
    isLinux,
    isMobile,
    isDesktop: !isMobile,
    isStandalone,
    isSecureContext: window.isSecureContext === true,
  };
}

export function cameraRequiresSecureContext() {
  return typeof window !== "undefined" && !window.isSecureContext;
}

export function installHintForPlatform(platform: PlatformInfo = getPlatform()) {
  if (platform.isStandalone) return null;

  if (platform.isIOS) {
    return "Install: tap Share, then “Add to Home Screen”.";
  }
  if (platform.isAndroid || platform.isHuawei) {
    return "Install: open the browser menu and choose “Install app” or “Add to Home screen”.";
  }
  if (platform.isMac || platform.isWindows || platform.isLinux) {
    return "Install: use “Install Shelfmark” in the address bar (Chrome, Edge) or add this page to your dock.";
  }
  return "Install: use your browser’s install or “Add to Home screen” option for offline use.";
}
