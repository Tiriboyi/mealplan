"use client";

import { RotateCw, TriangleAlert } from "lucide-react";
import { usePlan } from "./PlanProvider";

/** Stands in for a page's content while promotions load, or when they could not be loaded. */
export default function Status({ rows = 4 }: { rows?: number }) {
  const { load, retry } = usePlan();

  if (load.state === "error")
    return (
      <div className="empty" role="alert">
        <TriangleAlert aria-hidden="true" />
        <h2>Promotions did not load</h2>
        <p>{load.message}</p>
        <button className="button primary" onClick={retry}>
          <RotateCw aria-hidden="true" />
          Try again
        </button>
      </div>
    );

  return (
    <div className="skeletons" role="status" aria-label="Loading promotions">
      <div className="skeleton tall" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton" />
      ))}
    </div>
  );
}
