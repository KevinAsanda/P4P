'use client';

import React from 'react';

// Code 128 B patterns: Array of 6-digit width strings (bars and spaces)
const CODE128_PATTERNS: string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
];

const START_CODE_B = 104;
const STOP_CODE = 106;

function encodeCode128B(text: string): string[] {
  const codes: number[] = [START_CODE_B];
  let checksum = START_CODE_B;

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const code = charCode >= 32 && charCode <= 126 ? charCode - 32 : 0;
    codes.push(code);
    checksum += code * (i + 1);
  }

  const checksumVal = checksum % 103;
  codes.push(checksumVal);
  codes.push(STOP_CODE);

  return codes.map(c => CODE128_PATTERNS[c] || CODE128_PATTERNS[0]);
}

interface BarcodeSvgProps {
  value: string;
  width?: number;
  height?: number;
  showText?: boolean;
  className?: string;
}

export default function BarcodeSvg({
  value,
  width = 280,
  height = 90,
  showText = true,
  className = '',
}: BarcodeSvgProps) {
  const cleanValue = (value || 'P4P-ITEM').toUpperCase();
  const patternStrings = encodeCode128B(cleanValue);

  // Calculate total module units
  let totalUnits = 0;
  for (const str of patternStrings) {
    for (const char of str) {
      totalUnits += parseInt(char, 10);
    }
  }

  const padding = 12;
  const quietZone = 10;
  const effectiveWidth = width - (padding * 2);
  const barHeight = showText ? height - 28 : height - (padding * 2);
  const unitWidth = (effectiveWidth - (quietZone * 2)) / totalUnits;

  // Build SVG bars
  let currentX = padding + quietZone;
  const rects: React.JSX.Element[] = [];

  patternStrings.forEach((patternStr, patternIdx) => {
    let isBar = true;
    for (let i = 0; i < patternStr.length; i++) {
      const w = parseInt(patternStr[i], 10) * unitWidth;
      if (isBar) {
        rects.push(
          <rect
            key={`${patternIdx}-${i}`}
            x={currentX}
            y={padding}
            width={w}
            height={barHeight}
            fill="#000000"
          />
        );
      }
      currentX += w;
      isBar = !isBar;
    }
  });

  return (
    <div className={`flex flex-col items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        <rect width={width} height={height} fill="#ffffff" rx={8} />
        {rects}
      </svg>
      {showText && (
        <span className="font-mono text-xs font-black tracking-widest text-jetblack mt-1">
          {cleanValue}
        </span>
      )}
    </div>
  );
}
