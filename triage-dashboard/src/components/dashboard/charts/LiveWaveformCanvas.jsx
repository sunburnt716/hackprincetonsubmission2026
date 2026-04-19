import { line, scaleLinear, curveBasis } from "d3";
import { useEffect, useRef } from "react";

function LiveWaveformCanvas({ samples, isStale = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let frameId;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.fillRect(0, 0, width, height);

      if (samples.length > 1) {
        const values = samples.map((sample) => sample.value);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const span = Math.max(maxValue - minValue, 0.35);
        const padding = span * 0.25;

        const xScale = scaleLinear()
          .domain([0, samples.length - 1])
          .range([0, width]);
        const yScale = scaleLinear()
          .domain([minValue - padding, maxValue + padding])
          .range([height - 6, 6]);

        const waveform = line()
          .x((_, index) => xScale(index))
          .y((d) => yScale(d.value))
          .curve(curveBasis)
          .context(ctx);

        ctx.lineWidth = 2;
        ctx.strokeStyle = "#22c55e";
        ctx.beginPath();
        waveform(samples);
        ctx.stroke();
      }

      frameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [samples]);

  return (
    <div
      className="waveform-shell"
      style={{
        opacity: isStale ? 0.55 : 1,
        filter: isStale ? "grayscale(0.3)" : "none",
      }}
    >
      <canvas
        ref={canvasRef}
        width={620}
        height={180}
        className="waveform-canvas"
        aria-label={
          isStale
            ? "Live heartbeat waveform, stale data"
            : "Live heartbeat waveform"
        }
      />
    </div>
  );
}

export default LiveWaveformCanvas;
