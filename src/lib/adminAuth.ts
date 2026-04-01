const ADMIN_SESSION_KEY = "RAW_FRAMES_ADMIN_SESSION";
const ADMIN_SECRET_KEY = "RAW_FRAMES_ADMIN_SECRET";

export function readStoredAdminSecret() {
  return window.sessionStorage.getItem(ADMIN_SECRET_KEY) ?? "";
}

export function isAdminAuthenticated() {
  return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

export function persistAdminSession(password: string) {
  window.sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
  window.sessionStorage.setItem(ADMIN_SECRET_KEY, password);
}

export function clearAdminSession() {
  window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
  window.sessionStorage.removeItem(ADMIN_SECRET_KEY);
}
