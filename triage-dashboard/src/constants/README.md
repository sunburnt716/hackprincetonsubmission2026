# Constants and stable keys

This folder stores shared constants such as route paths and mock endpoint names.

## Why this is important

String duplication creates drift and routing bugs. Central constants improve refactor safety.

## Decision model

Use constants for every repeated key where semantic stability matters.

$$
\text{Risk of drift} \downarrow \text{ when key reuse} \uparrow
$$
