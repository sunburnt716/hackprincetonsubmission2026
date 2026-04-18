# State providers and session windows

This folder contains React context providers and hooks for shared runtime state.

## Current provider strategy

Vitals are managed in memory using fixed size circular windows per patient.

1. Trend buffers track one minute at one sample per second.
2. Waveform buffers track six seconds at twenty five samples per second.

## Purge policy

1. Purge patient buffers on release.
2. Purge all buffers on provider unmount.
3. Avoid persistence of raw vitals in browser storage.

## Buffer equations

$$
\text{index}_{next} = (\text{index}_{current} + 1) \bmod N
$$

This gives constant memory usage while preserving recent samples.
