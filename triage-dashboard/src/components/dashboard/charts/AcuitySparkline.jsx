import { curveMonotoneX, line, scaleLinear } from "d3";

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

function AcuitySparkline({ bpmSeries, spo2Series }) {
  const bpmPath = buildPath(bpmSeries, [40, 180]);
  const spo2Path = buildPath(spo2Series, [80, 100]);

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
      <div className="sparkline-legend" aria-hidden="true">
        <span className="sparkline-legend__item">
          <span className="sparkline-legend__swatch sparkline-legend__swatch--bpm" />
          BPM
        </span>
        <span className="sparkline-legend__item">
          <span className="sparkline-legend__swatch sparkline-legend__swatch--spo2" />
          SpO₂
        </span>
      </div>
    </div>
  );
}

export default AcuitySparkline;
