export default function PlanoreLogo() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Star */}
      <path
        d="M24 2L30.5 17.5H46.5L33.5 26.5L40 42L24 33L8 42L14.5 26.5L1.5 17.5H17.5L24 2Z"
        fill="url(#gradient1)"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      
      {/* Ticket (right side) */}
      <g transform="translate(28, 20)">
        <rect x="0" y="0" width="14" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        {/* Ticket lines */}
        <line x1="0" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="1"/>
        <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="0.8" opacity="0.7"/>
        <line x1="2" y1="10" x2="12" y2="10" stroke="currentColor" strokeWidth="0.8" opacity="0.7"/>
        <circle cx="7" cy="14" r="1.5" fill="currentColor"/>
      </g>

      <defs>
        <linearGradient id="gradient1" x1="24" y1="2" x2="24" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7000ff"/>
          <stop offset="100%" stopColor="#00c2ff"/>
        </linearGradient>
      </defs>
    </svg>
  )
}
