"use client";
import "@/styles/glowOrbits.css";

export default function NeonOrbits() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <svg
        className="absolute inset-0 w-full h-full [mix-blend-mode:screen]"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id="warm" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF8A3D" />
            <stop offset="50%" stopColor="#FF6A00" />
            <stop offset="100%" stopColor="#FFC133" />
          </linearGradient>
          <linearGradient id="cool" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2EB5FF" />
            <stop offset="50%" stopColor="#3D7EFF" />
            <stop offset="100%" stopColor="#7EE8FA" />
          </linearGradient>
          <filter
            id="glow"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            filterUnits="objectBoundingBox"
          >
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Halo suave central */}
        <g filter="url(#glow)">
          <circle cx="500" cy="500" r="160" fill="#3D7EFF" opacity="0.15" />
        </g>

        {/* Arco frío principal (azul) */}
        <g className="animate-orbit-slower" filter="url(#glow)" transform="translate(500 500)">
          <circle
            r="360"
            fill="none"
            stroke="url(#cool)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="820 600"
          />
        </g>

        {/* Arco cálido interior (naranja) */}
        <g className="animate-orbit-slow" filter="url(#glow)" transform="translate(500 500)">
          <circle
            r="250"
            fill="none"
            stroke="url(#warm)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray="620 580"
          />
        </g>

        {/* Arco cálido exterior */}
        <g className="animate-orbit-slower" filter="url(#glow)" transform="translate(500 500)">
          <circle
            r="470"
            fill="none"
            stroke="url(#warm)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="900 1100"
            opacity="0.8"
          />
        </g>
      </svg>
    </div>
  );
}
