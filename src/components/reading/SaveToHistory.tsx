"use client";

import { useEffect } from "react";
import { addHistory } from "./history";

/** Opening a saved reading (e.g. after a reload) keeps it in this browser's history. */
export default function SaveToHistory({ id }: { id: string }) {
  useEffect(() => addHistory(id), [id]);
  return null;
}
