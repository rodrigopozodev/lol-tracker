"use client";
import React from "react";

export default function InfinityLines() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" suppressHydrationWarning>
      <svg
        className="absolute inset-0 w-full h-full [mix-blend-mode:screen]"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id="warm" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-form-gradient-from)" />
            <stop offset="100%" stopColor="var(--color-form-gradient-to)" />
          </linearGradient>
          <linearGradient id="cool" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2EB5FF" />
            <stop offset="100%" stopColor="#3D7EFF" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g filter="url(#glow)">
          {/* Fría principal */}
          <g className="animate-orbit-slow" transform="translate(500 500)">
            <path
              d="M -260 0 C -260 -140, -80 -180, 0 -80 C 80 20, 260 -20, 260 -120 C 260 -220, 120 -260, 0 -200 C -120 -140, -260 -40, -260 0 Z"
              fill="none"
              stroke="url(#cool)"
              strokeWidth="4"
              strokeDasharray="360"
              pathLength={1000}
              className="animate-dash"
              opacity="0.9"
            />
          </g>

          {/* Cálida principal */}
          <g className="animate-orbit-slower" transform="translate(500 520) scale(1.12)">
            <path
              d="M -260 0 C -260 140, -80 180, 0 80 C 80 -20, 260 20, 260 120 C 260 220, 120 260, 0 200 C -120 140, -260 40, -260 0 Z"
              fill="none"
              stroke="url(#warm)"
              strokeWidth="4"
              strokeDasharray="420"
              pathLength={1000}
              className="animate-dash-slow"
              opacity="0.85"
            />
          </g>

          {/* Paralelas extra (2 frías, 1 cálida) */}
          <g className="animate-orbit-slow" transform="translate(500 500) scale(1.02) translate(12 -8) rotate(1.5)">
            <path
              d="M -260 0 C -260 -140, -80 -180, 0 -80 C 80 20, 260 -20, 260 -120 C 260 -220, 120 -260, 0 -200 C -120 -140, -260 -40, -260 0 Z"
              fill="none"
              stroke="url(#cool)"
              strokeWidth="3"
              strokeDasharray="340"
              pathLength={1000}
              className="animate-dash"
              opacity="0.7"
            />
          </g>
          <g className="animate-orbit-slow" transform="translate(500 500) scale(0.94) translate(-18 10) rotate(-2)">
            <path
              d="M -260 0 C -260 -140, -80 -180, 0 -80 C 80 20, 260 -20, 260 -120 C 260 -220, 120 -260, 0 -200 C -120 -140, -260 -40, -260 0 Z"
              fill="none"
              stroke="url(#cool)"
              strokeWidth="2.5"
              strokeDasharray="320"
              pathLength={1000}
              className="animate-dash"
              opacity="0.55"
            />
          </g>
          <g className="animate-orbit-slower" transform="translate(500 520) scale(1.22) rotate(-1)">
            <path
              d="M -260 0 C -260 140, -80 180, 0 80 C 80 -20, 260 20, 260 120 C 260 220, 120 260, 0 200 C -120 140, -260 40, -260 0 Z"
              fill="none"
              stroke="url(#warm)"
              strokeWidth="3"
              strokeDasharray="400"
              pathLength={1000}
              className="animate-dash-slow"
              opacity="0.65"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}