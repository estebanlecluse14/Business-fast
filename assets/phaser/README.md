# Business Fast — Phaser Sprite Pack

This directory is the runtime sprite library for the 2.5D board.

## Runtime filenames
- city_0.png — base property building
- city_1.png — level 1 property
- city_2.png — level 2 property
- city_3.png — level 3 property
- bank.png — bank landmark
- jail.png — prison landmark
- airport.png — airport landmark
- beach.png — beach landmark
- forest.png — terrain forest cluster
- mountain.png — terrain mountain cluster

## Art rules
Transparent PNG; consistent 2.5D/isometric camera; object centred horizontally; ground contact near bottom centre; no labels baked into sprites; lighting from upper-left; generous transparent padding; no UI background.

Phaser falls back to procedural graphics when a sprite is unavailable, so assets can be migrated progressively without breaking gameplay.
