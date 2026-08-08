// Preview Template for Design Inspirations
// Replace [DesignName] with your component name (PascalCase)
// Replace [design-id] with your design ID (kebab-case)

"use client";

import { ViewTransition } from "react";
// Import any additional dependencies your design needs

// Light variant of your design (compact preview version)
function [DesignName]Light() {
  return (
    <div className="bg-[#f8f8f8] rounded-xl border border-zinc-200/80 shadow-lg shadow-zinc-200/50 overflow-hidden">
      {/* Your light design implementation */}
      <div className="px-3 py-3">
        <span className="text-zinc-900 text-sm">Light mode content</span>
      </div>
    </div>
  );
}

// Dark variant of your design (compact preview version)
function [DesignName]Dark() {
  return (
    <div className="bg-zinc-800 rounded-xl border border-zinc-700/80 shadow-lg shadow-black/30 overflow-hidden">
      {/* Your dark design implementation */}
      <div className="px-3 py-3">
        <span className="text-zinc-100 text-sm">Dark mode content</span>
      </div>
    </div>
  );
}

// Main preview component - exports side-by-side light/dark
export function [DesignName]Preview() {
  return (
    <div className="flex gap-3">
      {/* Light mode panel */}
      <ViewTransition name="[design-id]-light-panel">
        <div className="flex-1 bg-[#f5f5f5] rounded-xl p-3 relative overflow-hidden inline-block">
          {/* Dot grid background */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle, #d4d4d4 1px, transparent 1px)`,
              backgroundSize: "16px 16px",
            }}
          />
          <div className="relative z-10">
            <ViewTransition name="[design-id]-light">
              <div className="inline-block">
                <[DesignName]Light />
              </div>
            </ViewTransition>
          </div>
        </div>
      </ViewTransition>

      {/* Dark mode panel */}
      <ViewTransition name="[design-id]-dark-panel">
        <div className="flex-1 bg-zinc-950 rounded-xl p-3 relative overflow-hidden inline-block">
          {/* Dot grid background */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle, #3f3f46 1px, transparent 1px)`,
              backgroundSize: "16px 16px",
            }}
          />
          <div className="relative z-10">
            <ViewTransition name="[design-id]-dark">
              <div className="inline-block">
                <[DesignName]Dark />
              </div>
            </ViewTransition>
          </div>
        </div>
      </ViewTransition>
    </div>
  );
}
