import type { WardName } from "../types/voter";

export const wardPolygons: Record<Exclude<WardName, "Unknown">, string> = {
  North: "122,38 270,26 344,116 302,210 166,204 84,132",
  East: "344,116 462,158 430,306 306,292 302,210",
  South: "166,204 306,292 284,420 130,430 54,316",
  West: "84,132 166,204 130,430 32,354 26,218",
};

export const districtPoints = [
  { id: "01", ward: "East" as WardName, x: 367, y: 180 },
  { id: "02", ward: "South" as WardName, x: 206, y: 318 },
  { id: "03", ward: "West" as WardName, x: 92, y: 282 },
  { id: "04", ward: "North" as WardName, x: 206, y: 118 },
  { id: "05", ward: "South" as WardName, x: 246, y: 374 },
  { id: "06", ward: "North" as WardName, x: 286, y: 92 },
];

export function opacityForRate(rate: number): number {
  return Math.max(0.18, Math.min(0.92, 0.2 + rate / 100));
}
