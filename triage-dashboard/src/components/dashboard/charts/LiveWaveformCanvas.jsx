import { line, scaleLinear, curveBasis } from "d3";
import { useEffect, useRef, useState } from "react";

function LiveWaveformCanvas({ samples, latestTimestamp }) {
  const canvasRef = useRef(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNowMs(Date.now());
    }, 500);

    return () => clearInterval(intervalId);
  }, []);

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
        const xScale = scaleLinear()
          .domain([0, samples.length - 1])
          .range([0, width]);
        const yScale = scaleLinear()
          .domain([-1.2, 1.2])
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

  const isStale = nowMs - latestTimestamp > 2000;

  return (
    <div className="waveform-shell">
      <canvas
        ref={canvasRef}
        width={620}
        height={180}
        className="waveform-canvas"
        aria-label="Live heartbeat waveform"
      />
      {isStale ? <div className="stale-overlay">Stale Data</div> : null}
    </div>
  );
}

export default LiveWaveformCanvas;
