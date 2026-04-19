import CircularBuffer from "../utils/CircularBuffer";

export const TRACK_A_SAMPLE_INTERVAL_MS = 40;
export const TRACK_A_STABILIZATION_WINDOW_MS = 1000;
export const TRACK_A_CAPACITY = Math.max(
  1,
  Math.round(TRACK_A_STABILIZATION_WINDOW_MS / TRACK_A_SAMPLE_INTERVAL_MS),
);
export const TRACK_B_CAPACITY = 120;
export const TRACK_B_HALF_WINDOW = TRACK_B_CAPACITY / 2;
export const TRACK_A_STALE_AFTER_MS = 3000;
export const TRACK_A_DIM_AFTER_MS = 10000;

export const waveformSample = (timeMs, heartBeat) => {
  const frequency = heartBeat / 60;
  const base = Math.sin((2 * Math.PI * frequency * timeMs) / 1000);
  const harmonic =
    0.35 * Math.sin((4 * Math.PI * frequency * timeMs) / 1000 + 0.8);
  const spike = Math.sin((10 * Math.PI * frequency * timeMs) / 1000) * 0.15;
  return base + harmonic + spike;
};

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const average = (values) => {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const calculateStats = (values) => {
  if (!values.length) {
    return { mean: 0, stdDev: 0 };
  }

  const mean = average(values);
  const variance = average(values.map((value) => (value - mean) ** 2));

  return {
    mean,
    stdDev: Math.sqrt(variance),
  };
};

const buildBufferedSeries = (buffer) => buffer.valuesWithTimestamps();

export const createTrackAState = (
  seedVitals = null,
  seedTimestamp = Date.now(),
) => {
  const displayBuffer = new CircularBuffer(TRACK_A_CAPACITY);
  const rawQueue = [];
  const lastAcceptedTimestamp = seedTimestamp - TRACK_A_STABILIZATION_WINDOW_MS;

  if (seedVitals?.heartBeat) {
    for (let offset = TRACK_A_CAPACITY - 1; offset >= 0; offset -= 1) {
      const sampleTimestamp =
        seedTimestamp - offset * TRACK_A_SAMPLE_INTERVAL_MS;
      const waveformValue = waveformSample(
        sampleTimestamp,
        seedVitals.heartBeat,
      );
      const sample = {
        value: waveformValue,
        timestamp: sampleTimestamp,
        quality: "observed",
      };

      rawQueue.push(sample);
      displayBuffer.push(sample.value, sample.timestamp);
    }
  }

  return {
    rawQueue,
    displayBuffer,
    lastAcceptedSample: rawQueue.at(-1) ?? null,
    lastAcceptedTimestamp:
      rawQueue.at(-1)?.timestamp ?? lastAcceptedTimestamp ?? null,
  };
};

export const createTrackBState = () => ({
  bpm: new CircularBuffer(TRACK_B_CAPACITY),
  spo2: new CircularBuffer(TRACK_B_CAPACITY),
  stress: new CircularBuffer(TRACK_B_CAPACITY),
});

export const createPipelineState = (
  seedVitals = null,
  seedTimestamp = Date.now(),
) => ({
  trackA: createTrackAState(seedVitals, seedTimestamp),
  trackB: createTrackBState(),
  lastObservedAt: seedTimestamp,
});

export const computeNews2Approx = ({ bloodOxygen, heartBeat, stress }) => {
  let score = 0;

  if (bloodOxygen >= 96) {
    score += 0;
  } else if (bloodOxygen >= 94) {
    score += 1;
  } else if (bloodOxygen >= 92) {
    score += 2;
  } else {
    score += 3;
  }

  if (heartBeat <= 40 || heartBeat >= 131) {
    score += 3;
  } else if (heartBeat <= 50 || heartBeat >= 111) {
    score += 2;
  } else if (heartBeat >= 91) {
    score += 1;
  }

  if (typeof stress === "number" && stress >= 70) {
    score += 1;
  }

  return Math.min(score, 7);
};

const classifyTrendDirection = (baseline, recent) => {
  const baselineComposite =
    (100 - baseline.bloodOxygen) * 2 +
    baseline.heartBeat * 0.15 +
    baseline.stress * 0.05;
  const recentComposite =
    (100 - recent.bloodOxygen) * 2 +
    recent.heartBeat * 0.15 +
    recent.stress * 0.05;

  const delta = recentComposite - baselineComposite;

  if (delta > 1.25) {
    return "rising";
  }

  if (delta < -1.25) {
    return "falling";
  }

  return "stable";
};

export const projectTrackB = (trackBState) => {
  const bpmSeries = buildBufferedSeries(trackBState.bpm);
  const spo2Series = buildBufferedSeries(trackBState.spo2);
  const stressSeries = buildBufferedSeries(trackBState.stress);
  const sampleCount = Math.min(
    bpmSeries.length,
    spo2Series.length,
    stressSeries.length,
  );
  const isWarmingUp = sampleCount < TRACK_B_CAPACITY;

  const currentVitals = {
    bloodOxygen: spo2Series.at(-1)?.value ?? null,
    heartBeat: bpmSeries.at(-1)?.value ?? null,
    stress: stressSeries.at(-1)?.value ?? null,
  };

  if (!sampleCount || isWarmingUp) {
    return {
      bpmSeries,
      spo2Series,
      stressSeries,
      isWarmingUp,
      direction: "stable",
      velocity: 0,
      acuityScore: computeNews2Approx({
        bloodOxygen: spo2Series.at(-1)?.value ?? 100,
        heartBeat: bpmSeries.at(-1)?.value ?? 60,
        stress: stressSeries.at(-1)?.value ?? 0,
      }),
    };
  }

  const halfWindow = Math.floor(TRACK_B_HALF_WINDOW);
  const baseline = {
    bloodOxygen: average(
      spo2Series.slice(0, halfWindow).map((point) => point.value),
    ),
    heartBeat: average(
      bpmSeries.slice(0, halfWindow).map((point) => point.value),
    ),
    stress: average(
      stressSeries.slice(0, halfWindow).map((point) => point.value),
    ),
  };

  const recent = {
    bloodOxygen: average(
      spo2Series.slice(-halfWindow).map((point) => point.value),
    ),
    heartBeat: average(
      bpmSeries.slice(-halfWindow).map((point) => point.value),
    ),
    stress: average(
      stressSeries.slice(-halfWindow).map((point) => point.value),
    ),
  };

  const direction = classifyTrendDirection(baseline, recent);
  const velocity =
    (recent.bloodOxygen - baseline.bloodOxygen) * -1 +
      (recent.heartBeat - baseline.heartBeat) * 0.1 +
      (recent.stress - baseline.stress) * 0.05 || 0;

  return {
    bpmSeries,
    spo2Series,
    stressSeries,
    isWarmingUp,
    direction,
    velocity,
    acuityScore: computeNews2Approx({
      bloodOxygen: currentVitals.bloodOxygen ?? 100,
      heartBeat: currentVitals.heartBeat ?? 60,
      stress: currentVitals.stress ?? 0,
    }),
  };
};

const fillWaveformGap = (trackAState, nextValue, nextTimestamp) => {
  const previous = trackAState.lastAcceptedSample;
  const previousTimestamp = trackAState.lastAcceptedTimestamp;

  if (!previous || !previousTimestamp) {
    return;
  }

  const gapMs = nextTimestamp - previousTimestamp;
  const expectedSteps = Math.floor(gapMs / TRACK_A_SAMPLE_INTERVAL_MS);

  if (expectedSteps <= 1) {
    return;
  }

  const gapLimit = 6;
  const steps = Math.min(expectedSteps, gapLimit);

  for (let step = 1; step < steps; step += 1) {
    const ratio = step / steps;
    const interpolatedValue =
      previous.value + (nextValue - previous.value) * ratio;
    const interpolatedTimestamp =
      previousTimestamp + step * TRACK_A_SAMPLE_INTERVAL_MS;

    trackAState.rawQueue.push({
      value: interpolatedValue,
      timestamp: interpolatedTimestamp,
      quality: "interpolated",
    });
  }
};

export const ingestTrackAWaveform = (
  trackAState,
  heartBeat,
  timestamp = Date.now(),
) => {
  const rawValue = waveformSample(timestamp, heartBeat);
  const rawValues = trackAState.rawQueue.map((entry) => entry.value);
  const stats = calculateStats(rawValues);
  const isOutlier =
    rawValues.length >= 5 &&
    stats.stdDev > 0 &&
    Math.abs(rawValue - stats.mean) > 3 * stats.stdDev;

  const cleanedValue = isOutlier
    ? (trackAState.lastAcceptedSample?.value ?? rawValue)
    : rawValue;

  fillWaveformGap(trackAState, cleanedValue, timestamp);

  const sample = {
    value: cleanedValue,
    timestamp,
    quality: isOutlier ? "interpolated" : "observed",
  };

  trackAState.rawQueue.push(sample);

  if (trackAState.rawQueue.length > TRACK_A_CAPACITY) {
    const emitted = trackAState.rawQueue.shift();
    trackAState.displayBuffer.push(emitted.value, emitted.timestamp);
  } else {
    trackAState.displayBuffer.push(sample.value, sample.timestamp);
  }

  trackAState.lastAcceptedSample = sample;
  trackAState.lastAcceptedTimestamp = timestamp;

  return {
    sample,
    isOutlier,
  };
};

export const ingestTrackBVitals = (
  trackBState,
  vitals,
  timestamp = Date.now(),
) => {
  trackBState.bpm.push(vitals.heartBeat, timestamp);
  trackBState.spo2.push(vitals.bloodOxygen, timestamp);
  trackBState.stress.push(vitals.stress ?? 0, timestamp);

  return projectTrackB(trackBState);
};

export const seedPipelineFromHistory = (
  trackAState,
  trackBState,
  history = [],
) => {
  history.forEach((entry) => {
    const timestamp = new Date(entry.timestamp).getTime();
    ingestTrackAWaveform(trackAState, entry.vitals.heartBeat, timestamp);
    ingestTrackBVitals(trackBState, entry.vitals, timestamp);
  });

  return {
    trackA: trackAState,
    trackB: trackBState,
  };
};

export const computeFreshness = (patient, now = Date.now()) => {
  const timestamp =
    patient.clinicalPayload?.timestamp ??
    patient.transportMeta?.lastSyncTime ??
    null;
  const lastUpdatedAt = timestamp ? new Date(timestamp).toISOString() : null;
  const ageMs = timestamp
    ? Math.max(now - new Date(timestamp).getTime(), 0)
    : null;
  const connected =
    patient.transportMeta?.connectionStatus === "connected" &&
    patient.transportMeta?.activeReadsHealthy !== false;

  let state = "disconnected";

  if (connected && typeof ageMs === "number") {
    state = ageMs > TRACK_A_STALE_AFTER_MS ? "stale" : "connected";
  }

  if (
    !connected &&
    patient.transportMeta?.connectionStatus === "pending_reads"
  ) {
    state = "stale";
  }

  const dimVitals = typeof ageMs === "number" && ageMs > TRACK_A_DIM_AFTER_MS;

  return {
    state,
    ageMs,
    lastUpdatedAt,
    dimVitals,
    isStale: state === "stale",
  };
};

export const createPipelineViewModel = (
  patient,
  trackAState,
  trackBState,
  now = Date.now(),
) => {
  const freshness = computeFreshness(patient, now);
  const trackB = projectTrackB(trackBState);
  const latestBpm =
    trackB.bpmSeries.at(-1)?.value ??
    patient.clinicalPayload?.vitals?.heartBeat ??
    null;
  const latestSpo2 =
    trackB.spo2Series.at(-1)?.value ??
    patient.clinicalPayload?.vitals?.bloodOxygen ??
    null;
  const latestStress =
    trackB.stressSeries.at(-1)?.value ??
    patient.clinicalPayload?.vitals?.stress ??
    null;

  return {
    rawWaveform: trackAState.displayBuffer
      .valuesWithTimestamps()
      .map((point) => point.value),
    currentVitals: {
      bpm: latestBpm,
      spo2: latestSpo2,
      acuityScore: trackB.acuityScore,
    },
    trends: {
      direction: trackB.direction,
      isWarmingUp: trackB.isWarmingUp,
      velocity: trackB.velocity,
      bpmSeries: trackB.bpmSeries,
      spo2Series: trackB.spo2Series,
      stressSeries: trackB.stressSeries,
    },
    status: {
      state: freshness.state,
      ageMs: freshness.ageMs,
      lastUpdatedAt: freshness.lastUpdatedAt,
      dimVitals: freshness.dimVitals,
      bufferedDuringDeadZone: Boolean(
        patient.transportMeta?.bufferedDuringDeadZone,
      ),
    },
    latestStress,
  };
};

export const projectWaveformSeries = (trackAState) =>
  trackAState.displayBuffer.valuesWithTimestamps();
