import { curveMonotoneX, line, scaleLinear } from "d3";
import { useEffect, useState } from "react";

const WIDTH = 320;
const HEIGHT = 72;

function buildPath(series, yDomain) {
  if (!series.length) {
    return "";
  }

  const xScale = scaleLinear()
    .domain([0, Math.max(series.length - 1, 1)])
    .range([0, WIDTH]);
  const yScale = scaleLinear()
    .domain(yDomain)
    .range([HEIGHT - 4, 4]);

  const generator = line()
    .x((_, index) => xScale(index))
    .y((d) => yScale(d.value))
    .curve(curveMonotoneX);

  return generator(series) ?? "";
}

function AcuitySparkline({ bpmSeries, spo2Series, latestTimestamp }) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNowMs(Date.now());
    }, 500);

    return () => clearInterval(intervalId);
  }, []);

  const bpmPath = buildPath(bpmSeries, [40, 180]);
  const spo2Path = buildPath(spo2Series, [80, 100]);
  const isStale = nowMs - latestTimestamp > 2000;

  return (
    <div className="acuity-sparkline">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="acuity-sparkline__svg"
        role="img"
        aria-label="Acuity trend for BPM and SpO2"
      >
        <path d={bpmPath} className="sparkline sparkline--bpm" />
        <path d={spo2Path} className="sparkline sparkline--spo2" />
      </svg>
      {isStale ? <div className="stale-overlay">Stale Data</div> : null}
    </div>
  );
}

export default AcuitySparkline;
