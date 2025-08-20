'use client';

import { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';

export default function LoadingBar() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 2));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (svgRef.current) {
      const rc = rough.svg(svgRef.current);

      // 기존 내용 지우기
      svgRef.current.innerHTML = '';

      // 바 외곽선 (손그림 박스 느낌)
      const barOutline = rc.rectangle(10, 10, 380, 40, {
        roughness: 2,
        stroke: 'black',
        strokeWidth: 2,
      });
      svgRef.current.appendChild(barOutline);

      // 진행된 부분
      const filled = rc.rectangle(10, 10, (380 * progress) / 100, 40, {
        roughness: 2,
        fill: 'black',
        fillStyle: 'zigzag',
        stroke: 'none',
      });
      svgRef.current.appendChild(filled);
    }
  }, [progress]);

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-3xl mb-4">Loading...</h1>
      <svg ref={svgRef} width="400" height="60"></svg>
    </div>
  );
}
