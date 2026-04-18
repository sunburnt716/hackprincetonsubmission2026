# Dashboard components

This folder contains waiting room specific UI units.

## Clinical intent

The components support nurse intake triage inside a waiting room context. They intentionally avoid ambulance route and geospatial context in this phase.

## Main modules

1. Patient card for rapid acuity scanning.
2. Patient detail modal for deeper validation.
3. Device health grid for wearable readiness.
4. Add patient modal for registry lookup and temporary intake.

## Key decisions

Release patient actions exist on both the card and detail modal to reduce click depth.

Critical visualization follows threshold logic.

$$
\text{Alert} = (SpO_2 < 90) \lor (\Delta BPM > 20)
$$
