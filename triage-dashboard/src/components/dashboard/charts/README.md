# Vitals visualization components

This folder contains chart components for two visual languages.

## Visual language split

1. Acuity sparkline for low frequency trend reading on the card.
2. Live waveform canvas for high frequency signal reading in detail view.

## Technical decisions

SVG is used for compact trend rendering and declarative path updates.
Canvas is used for waveform rendering to keep frame cost low at high sample rates.

## D3 usage

1. `d3.scaleLinear` for domain to pixel mapping.
2. `d3.line` for path generation.
3. `d3.curveMonotoneX` for smooth trend line.
4. `d3.curveBasis` for waveform smoothing.

## Equations

Signal synthesis in mock mode uses a composite wave.

$$
y(t) = \sin(2\pi f t) + 0.35\sin(4\pi f t + \phi) + 0.15\sin(10\pi f t)
$$

Where $f = BPM / 60$.
