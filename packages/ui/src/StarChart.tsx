"use client";

interface DataPoint {
  date: string;
  stars: number;
}

interface StarChartProps {
  snapshots: DataPoint[];
  currentStars: number;
  velocity: number | null; // stars per 30 days
  name: string;
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function formatDate(d: string): string {
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Generate projected data points based on current velocity.
 * Shows past 90 days (projected backwards) + 30 days forward.
 */
function generateProjectedData(currentStars: number, velocity: number): DataPoint[] {
  const points: DataPoint[] = [];
  const now = new Date();
  const dailyRate = velocity / 30;

  // 90 days back
  for (let i = 90; i >= 0; i -= 5) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    points.push({
      date: d.toISOString().slice(0, 10),
      stars: Math.round(currentStars - dailyRate * i),
    });
  }

  return points;
}

export function StarChart({ snapshots, currentStars, velocity, name }: StarChartProps) {
  // Use actual snapshots if we have enough, otherwise project from velocity
  const data = snapshots.length >= 3
    ? snapshots
    : velocity && velocity > 0
      ? generateProjectedData(currentStars, velocity)
      : null;

  if (!data || data.length < 2) {
    return null;
  }

  const isProjected = snapshots.length < 3;

  // Chart dimensions
  const W = 480;
  const H = 120;
  const PAD_X = 45;
  const PAD_Y = 15;
  const chartW = W - PAD_X * 2;
  const chartH = H - PAD_Y * 2;

  const stars = data.map((d) => d.stars);
  const minY = Math.min(...stars) * 0.98;
  const maxY = Math.max(...stars) * 1.02;
  const rangeY = maxY - minY || 1;

  const toX = (i: number) => PAD_X + (i / (data.length - 1)) * chartW;
  const toY = (v: number) => PAD_Y + chartH - ((v - minY) / rangeY) * chartH;

  // Build SVG path
  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(d.stars).toFixed(1)}`)
    .join(" ");

  // Area fill
  const areaPath = `${linePath} L ${toX(data.length - 1).toFixed(1)} ${(H - PAD_Y).toFixed(1)} L ${PAD_X} ${(H - PAD_Y).toFixed(1)} Z`;

  // Y-axis labels (3 ticks)
  const yTicks = [minY, (minY + maxY) / 2, maxY].map((v) => ({
    value: v,
    y: toY(v),
    label: formatNum(Math.round(v)),
  }));

  // X-axis labels (first and last)
  const xLabels = [
    { x: toX(0), label: formatDate(data[0].date) },
    { x: toX(data.length - 1), label: formatDate(data[data.length - 1].date) },
  ];

  const growth = data[data.length - 1].stars - data[0].stars;
  const growthPct = data[0].stars > 0 ? ((growth / data[0].stars) * 100).toFixed(1) : "0";

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-gray-900">Star Growth</h2>
        <div className="flex items-center gap-3 text-xs">
          {growth > 0 && (
            <span className="text-green-600 font-medium">
              +{formatNum(growth)} ({growthPct}%)
            </span>
          )}
          {isProjected && (
            <span className="text-gray-400 italic">estimated from velocity</span>
          )}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Star growth chart for ${name}`}
      >
        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={PAD_X}
              y1={tick.y}
              x2={W - PAD_X}
              y2={tick.y}
              stroke="#f0f0f0"
              strokeWidth="1"
            />
            <text
              x={PAD_X - 5}
              y={tick.y + 3}
              textAnchor="end"
              className="fill-gray-400"
              fontSize="9"
            >
              {tick.label}
            </text>
          </g>
        ))}

        {/* X labels */}
        {xLabels.map((label, i) => (
          <text
            key={i}
            x={label.x}
            y={H - 2}
            textAnchor={i === 0 ? "start" : "end"}
            className="fill-gray-400"
            fontSize="9"
          >
            {label.label}
          </text>
        ))}

        {/* Area fill */}
        <path
          d={areaPath}
          fill="url(#starGradient)"
          opacity="0.15"
        />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={isProjected ? "4 2" : undefined}
        />

        {/* Current point */}
        <circle
          cx={toX(data.length - 1)}
          cy={toY(data[data.length - 1].stars)}
          r="3"
          fill="#3b82f6"
        />

        {/* Gradient def */}
        <defs>
          <linearGradient id="starGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
