# Business Fast — Godot base

Cette base Godot vit **à côté** de la version web. Elle ne remplace pas le prototype HTML/CSS/JS pour l'instant.

## Objectif

Préparer une future migration vers Godot avec une architecture propre :

- `scenes/main.tscn` : scène principale
- `scripts/main.gd` : orchestration de l'affichage
- `scripts/game_manager.gd` : état général et tours
- `scripts/game_data.gd` : données communes du plateau
- `scripts/board.gd` : premier rendu 2D du plateau
- futurs dossiers : `players/`, `ui/`, `effects/`, `data/`

## Ouvrir dans Godot

Importe le fichier :

`godot/project.godot`

Godot ouvrira directement :

`res://scenes/main.tscn`

## AI Essentials Toolkit

Le plugin n'est volontairement pas copié dans GitHub. Installe-le dans le projet Godot local sous :

`res://addons/ai_essentials_toolkit/`

Puis active le plugin et ajoute :

`res://addons/ai_essentials_toolkit/game_server.gd`

en Autoload.

## Important

La version web reste la référence gameplay actuelle. Cette base Godot sert à préparer le futur moteur sans ralentir le développement web.
