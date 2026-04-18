# Shared UI components

This folder contains reusable UI building blocks.

## Why this boundary exists

Feature pages should compose behavior, while components should present focused interface units. This keeps maintenance cost low as workflows grow.

## Design principle

Each component should own one clear responsibility and accept explicit props.

$$
\text{Complexity} \propto \text{Responsibilities per component}
$$

Reducing responsibilities improves readability and testability.
