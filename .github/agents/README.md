# Agent role definitions

This folder contains agent role prompts used to coordinate planning and implementation.

## Why this exists

The team needs consistent behavior across sessions and contributors. Role prompts reduce variance in architecture decisions and keep safety and data integrity concerns visible.

## Current phase alignment

The planner role is now explicitly constrained to waiting room intake use cases. Location fields and ambulance oriented UI assumptions are deferred.

## Decision flow

1. Interpret request within phase boundaries.
2. Validate schema impact.
3. Validate security impact.
4. Validate test strategy.

This can be described as a gated path.

$$
\text{ShipCandidate} = R \land S \land Q \land T
$$

Where $R$ is request fit, $S$ is schema safety, $Q$ is security fit, and $T$ is testability.
