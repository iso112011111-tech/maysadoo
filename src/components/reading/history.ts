/** Reading ids this browser has made — the readings themselves live in the server database. */
const KEY = "duduang:history";

export function loadHistory(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function addHistory(id: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify([id, ...loadHistory().filter((x) => x !== id)].slice(0, 50)));
  } catch {
    // private mode / storage blocked: history just isn't remembered
  }
}
