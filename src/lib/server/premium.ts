import "server-only";

/**
 * Access to the paid 1-on-1 room. Payment is not wired up yet: PREMIUM_OPEN=1 opens the room to everyone
 * (for testing). Replace this check with the real entitlement (payment / credits) when payments are added.
 */
export function premiumAccess(): boolean {
  return process.env.PREMIUM_OPEN === "1";
}
