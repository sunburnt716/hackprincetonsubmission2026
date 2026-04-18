# Public assets folder

This folder contains static files served directly by Vite.

## Why it is separate

Public assets are not transformed by the build pipeline. This is useful for fixed files that must keep exact names or paths.

## Decision rules

1. Put immutable static files here.
2. Put import based assets in `src/assets`.
3. Avoid storing clinical data in static files.

## Framework context

The app is built with React and Vite. Vite serves this folder at the root path during development and production builds.
