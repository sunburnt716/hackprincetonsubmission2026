# Frontend source architecture

This folder is the application core for the Kinovo waiting room dashboard.

## Architectural intent

1. Keep the waiting room as the primary workflow.
2. Keep vitals in volatile memory for current phase visualization.
3. Separate UI composition from stream simulation and data mechanics.

## Readability first principle

The main UI objective is rapid nurse scanning. Card layout, visual hierarchy, and alert contrast are treated as primary design constraints.

## Algorithms present in this layer

1. Acuity sorting.
2. Staleness detection.
3. Circular buffer based trend and waveform windows.

$$
\text{Stale} = (t_{now} - t_{sample}) > 2\ \text{seconds for chart overlay}
$$

$$
\text{TrendWindow} = 60\ \text{points at}\ 1\ \text{Hz},\quad \text{WaveWindow} = 150\ \text{points at}\ 25\ \text{Hz}
$$
