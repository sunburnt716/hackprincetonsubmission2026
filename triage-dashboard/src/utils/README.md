# Utility functions and data structures

This folder contains low level helpers that support providers and services.

## Circular buffer decision

A fixed size circular buffer is used because telemetry windows require predictable memory cost.

## Complexity profile

1. Push operation is constant time.
2. Clear operation is linear in window size.
3. Memory usage is fixed at initialization.

$$
T_{push} = O(1),\quad M = O(N)
$$

## Security note

This layer supports in memory only handling. No utility in this folder should write raw vitals to persistent storage in the current phase.
