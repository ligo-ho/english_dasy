type Props = {
  percent: number; // 0..100, success share
  size?: number;
};

// Simple SVG donut chart showing success (green) vs mistakes (red).
// Two arcs, no external chart library.
export default function ResultDonut({ percent, size = 220 }: Props) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const radius = 80;
  const stroke = 22;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const successLen = (clamped / 100) * circumference;
  const failLen = circumference - successLen;

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`אחוז הצלחה: ${clamped}%`}>
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--danger)"
          strokeWidth={stroke}
        />
        {/* Success arc on top */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--success)"
          strokeWidth={stroke}
          strokeDasharray={`${successLen} ${failLen}`}
          // Start at the top (12 o'clock) and go clockwise
          transform={`rotate(-90 ${center} ${center})`}
          strokeLinecap="butt"
        />
        <text
          x={center}
          y={center - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={36}
          fontWeight={700}
          fill="var(--text)"
        >
          {clamped}%
        </text>
        <text
          x={center}
          y={center + 28}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={14}
          fill="var(--muted)"
        >
          אחוז הצלחה
        </text>
      </svg>
    </div>
  );
}
