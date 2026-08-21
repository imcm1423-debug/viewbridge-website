import React from "react";

interface ViewBridgeLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  theme?: "dark" | "light" | "navy";
  className?: string;
}

export const ViewBridgeLogo: React.FC<ViewBridgeLogoProps> = ({
  size = "md",
  showTagline = true,
  theme = "light",
  className = "",
}) => {
  const iconSizes = {
    sm: { w: 28, h: 16, stroke: 2, circleR: 2 },
    md: { w: 42, h: 24, stroke: 2.2, circleR: 2.5 },
    lg: { w: 60, h: 34, stroke: 2.5, circleR: 3 },
    xl: { w: 84, h: 48, stroke: 3, circleR: 3.5 },
  };

  const textSizes = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  const taglineSizes = {
    sm: "text-[8px]",
    md: "text-[10px]",
    lg: "text-[11px]",
    xl: "text-xs",
  };

  const isDark = theme === "dark" || theme === "navy";
  const primaryTextColor = isDark ? "text-white" : "text-[#0A192F]";
  const taglineColor = isDark ? "text-[#00B4D8]/90" : "text-[#00B4D8]";
  const bridgeColor = "#00B4D8";

  const { w, h, stroke, circleR } = iconSizes[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Vector Bridge Logo Mark */}
      <svg
        width={w}
        height={h}
        viewBox="0 0 100 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-105"
      >
        {/* Bridge Baseline / Deck */}
        <line
          x1="2"
          y1="42"
          x2="98"
          y2="42"
          stroke={bridgeColor}
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Tower 1 */}
        <line
          x1="32"
          y1="12"
          x2="32"
          y2="52"
          stroke={bridgeColor}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="32" cy="10" r="4.5" fill={bridgeColor} />

        {/* Tower 2 */}
        <line
          x1="68"
          y1="12"
          x2="68"
          y2="52"
          stroke={bridgeColor}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="68" cy="10" r="4.5" fill={bridgeColor} />

        {/* Main Suspension Cables */}
        {/* Left Span */}
        <path
          d="M 2 42 Q 17 34 32 14"
          stroke={bridgeColor}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        {/* Center Main Span (Swooping Catinary) */}
        <path
          d="M 32 14 Q 50 38 68 14"
          stroke={bridgeColor}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        {/* Right Span */}
        <path
          d="M 68 14 Q 83 34 98 42"
          stroke={bridgeColor}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Vertical Cable Suspenders */}
        {/* Left side suspenders */}
        <line x1="12" y1="39" x2="12" y2="42" stroke={bridgeColor} strokeWidth="2" strokeLinecap="round" />
        <line x1="22" y1="34" x2="22" y2="42" stroke={bridgeColor} strokeWidth="2" strokeLinecap="round" />

        {/* Center suspenders */}
        <line x1="41" y1="26" x2="41" y2="42" stroke={bridgeColor} strokeWidth="2" strokeLinecap="round" />
        <line x1="50" y1="32" x2="50" y2="42" stroke={bridgeColor} strokeWidth="2" strokeLinecap="round" />
        <line x1="59" y1="26" x2="59" y2="42" stroke={bridgeColor} strokeWidth="2" strokeLinecap="round" />

        {/* Right side suspenders */}
        <line x1="78" y1="34" x2="78" y2="42" stroke={bridgeColor} strokeWidth="2" strokeLinecap="round" />
        <line x1="88" y1="39" x2="88" y2="42" stroke={bridgeColor} strokeWidth="2" strokeLinecap="round" />
      </svg>

      {/* Typography */}
      <div className="flex flex-col justify-center leading-none">
        <div className={`font-extrabold tracking-tight ${primaryTextColor} ${textSizes[size]} flex items-center font-sans`}>
          <span>View</span>
          <span className="text-[#00B4D8]">Bridge</span>
        </div>
        {showTagline && (
          <span className={`font-semibold tracking-wider ${taglineColor} ${taglineSizes[size]} mt-0.5 uppercase`}>
            Observation-driven Product Design
          </span>
        )}
      </div>
    </div>
  );
};
