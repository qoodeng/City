/**
 * Crash test dummy registration marker — quartered circle spinner.
 * Opposite quadrants share the same color (black / city-yellow).
 */
export function CrashSpinner({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <div className={`animate-spin ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Top-right quadrant — yellow */}
        <path d="M50,50 L50,0 A50,50 0 0,1 100,50 Z" fill="#FFD700" />
        {/* Bottom-right quadrant — black */}
        <path d="M50,50 L100,50 A50,50 0 0,1 50,100 Z" fill="#0A0A0A" />
        {/* Bottom-left quadrant — yellow */}
        <path d="M50,50 L50,100 A50,50 0 0,1 0,50 Z" fill="#FFD700" />
        {/* Top-left quadrant — black */}
        <path d="M50,50 L0,50 A50,50 0 0,1 50,0 Z" fill="#0A0A0A" />
      </svg>
    </div>
  );
}
