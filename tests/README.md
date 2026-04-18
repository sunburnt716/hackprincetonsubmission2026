# Test data and simulation notes

This folder holds mock datasets used to simulate clinical queue behavior before backend ingestion is available.

## Thought process

The system is currently UI first with backend pending. Realistic simulation is required so nurses can evaluate readability, triage ordering, and alert behavior.

## Data strategy

1. Keep values physiologically plausible.
2. Prioritize waiting-room triage readability and device-health realism.
3. Use synthetic identities only.

## Core equations used by triage simulation

Critical check in the UI layer uses threshold logic.

$$
\text{isCritical} = (SpO_2 < 90) \lor (\Delta BPM > 20)
$$

Queue ordering follows acuity first sorting.

$$
\text{Priority} = (\text{isCritical DESC}, SpO_2\ \text{ASC}, t\ \text{DESC})
$$
