# Service and mock data mechanics

This folder contains service logic for auth, triage simulation, and model transformation.

## Why this layer exists

The UI should not own low level simulation or data mutation details. Services isolate those concerns and make backend replacement easier.

## Waiting room domain decisions

1. Mock records are waiting room intake records.
2. Location is intentionally excluded in the current phase schema.
3. Transport metadata remains available for reliability compatibility.

## Core algorithms

1. Acuity sorting.
2. Vitals perturbation for stream simulation.
3. Device health drift simulation.

$$
\text{SortedQueue} = \operatorname{sort}(\text{critical DESC}, SpO_2\ \text{ASC}, t\ \text{DESC})
$$
