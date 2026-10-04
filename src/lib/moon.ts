/** Moon phase from the mean synodic month — accurate to within about a day, enough for ข้างขึ้น/ข้างแรม. */

const SYNODIC = 29.530588853;
const NEW_MOON_2000 = Date.UTC(2000, 0, 6, 18, 14); // a known new moon

export type MoonInfo = {
  /** days since new moon, 0 … 29.53 */
  age: number;
  /** lit fraction 0 … 1 */
  illumination: number;
  waxing: boolean;
  /** Thai lunar day label, e.g. "ข้างขึ้น 9 ค่ำ" */
  thai: string;
};

export function moonOn(date: Date): MoonInfo {
  const days = (date.getTime() - NEW_MOON_2000) / 86_400_000;
  const age = ((days % SYNODIC) + SYNODIC) % SYNODIC;
  const illumination = (1 - Math.cos((2 * Math.PI * age) / SYNODIC)) / 2;
  const waxing = age < SYNODIC / 2;
  const day = Math.min(15, Math.max(1, Math.ceil(waxing ? age : age - SYNODIC / 2)));
  const thai =
    waxing && day === 15 ? "จันทร์เต็มดวง · ขึ้น 15 ค่ำ" : !waxing && day >= 14 ? `จันทร์ดับ · แรม ${day} ค่ำ` : `${waxing ? "ข้างขึ้น" : "ข้างแรม"} ${day} ค่ำ`;
  return { age, illumination, waxing, thai };
}
