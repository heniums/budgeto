// Page Template for Design Inspirations
// Replace [DesignName] with your component name (PascalCase)
// Replace [design-id] with your design ID (kebab-case)
// Replace [Design Title] with your design title
// Replace [username] with the Twitter handle of the original designer

"use client";

import { useState, ViewTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { DM_Sans } from "next/font/google";
import { ArrowLeft, ExternalLink, Code } from "lucide-react";
// Import any additional icons your design needs

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Light variant of your design (full interactive version)
function [DesignName]Light() {
  // Add any state management needed for interactivity
  // const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-[#f8f8f8] rounded-2xl border border-zinc-200/80 shadow-lg shadow-zinc-200/50 overflow-hidden">
      {/* Your full light design implementation */}
      <div className="px-5 py-5">
        <span className="text-zinc-900">Light mode content</span>
      </div>
    </div>
  );
}

// Dark variant of your design (full interactive version)
function [DesignName]Dark() {
  // Add any state management needed for interactivity
  // const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-zinc-800 rounded-2xl border border-zinc-700/80 shadow-lg shadow-black/30 overflow-hidden">
      {/* Your full dark design implementation */}
      <div className="px-5 py-5">
        <span className="text-zinc-100">Dark mode content</span>
      </div>
    </div>
  );
}

export default function [DesignName]Page() {
  return (
    <div className={`min-h-screen ${dmSans.className}`}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-base font-medium text-zinc-900">
              [Design Title]
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/ainergiz/design-inspirations/blob/main/src/app/designs/[design-id]/page.tsx"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <Code className="w-4 h-4" />
              <span className="hidden sm:inline">Code</span>
            </a>
            <a
              href="https://x.com/[username]"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              <span className="hidden sm:inline text-zinc-400">Inspired from</span>
              <Image
                src="https://unavatar.io/x/[username]"
                alt="Designer Name"
                width={24}
                height={24}
                className="w-6 h-6 rounded-full"
              />
              <span className="font-medium text-zinc-700">@[username]</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Split layout */}
      <div className="flex flex-col md:flex-row min-h-screen pt-[57px]">
        {/* Light mode side */}
        <ViewTransition name="[design-id]-light-panel">
          <div className="flex-1 bg-[#f5f5f5] relative">
            {/* Dot grid background */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle, #d4d4d4 1px, transparent 1px)`,
                backgroundSize: "24px 24px",
              }}
            />
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-57px)] p-6 md:p-12">
              <ViewTransition name="[design-id]-light">
                <div className="w-full max-w-md">
                  <[DesignName]Light />
                </div>
              </ViewTransition>
            </div>
          </div>
        </ViewTransition>

        {/* Dark mode side */}
        <ViewTransition name="[design-id]-dark-panel">
          <div className="flex-1 bg-zinc-950 relative">
            {/* Dot grid background */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle, #3f3f46 1px, transparent 1px)`,
                backgroundSize: "24px 24px",
              }}
            />
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-57px)] p-6 md:p-12">
              <ViewTransition name="[design-id]-dark">
                <div className="w-full max-w-md">
                  <[DesignName]Dark />
                </div>
              </ViewTransition>
            </div>
          </div>
        </ViewTransition>
      </div>
    </div>
  );
}
