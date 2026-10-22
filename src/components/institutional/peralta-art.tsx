/** Motivos editoriais inspirados nas plantas do mascote e nos caminhos de descoberta. */
export function Flower({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`peralta-flower ${className}`}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M60 34C42 1 17 23 34 43 0 35 1 69 30 68 5 91 37 112 49 86 49 122 85 117 79 86 108 106 123 74 93 65 125 52 102 21 81 43 88 11 56 4 60 34Z"
        fill="currentColor"
      />
      <circle cx="61" cy="63" r="15" fill="var(--paper)" />
      <path
        d="M54 64c4 6 11 6 15 0"
        stroke="var(--ink)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="55" cy="58" r="1.5" fill="var(--ink)" />
      <circle cx="67" cy="58" r="1.5" fill="var(--ink)" />
    </svg>
  );
}
export function Trail({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`peralta-trail ${className}`}
      viewBox="0 0 500 220"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M8 183C93 228 164 170 130 105 95 39 210 3 247 58 305 143 385 193 490 20"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray="9 10"
        strokeLinecap="round"
      />
      <path
        d="m469 28 23-12 1 26"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
