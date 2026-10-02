# Business Fast

Prototype web du jeu de plateau **Business Fast**.

## Version actuelle
**V0.43 — Animations légères & rendu net**

### Nouveautés V0.43
- Priorité donnée à la fluidité et à la netteté plutôt qu'aux effets lourds.
- Suppression de la perspective/rotation 3D du plateau, qui pouvait provoquer un rendu flou.
- Suppression des zooms CSS sur les tuiles, pions, bâtiments et illustrations SVG.
- Pion déplacé sans changement d'échelle pour conserver un rendu net.
- Animations principales réécrites autour de l'opacité et de petites translations.
- Cinématiques accélérées et particules lourdes supprimées.
- Ombres, filtres et effets continus fortement réduits.
- Dé animé plus simplement et plus rapidement.
- Assets SVG conservés à leur rendu natif pour éviter l'impression de basse résolution.
- Aucun changement des règles ou de l'économie.

### Objectif
La V0.42 avait réduit les recalculs JavaScript. La V0.43 s'attaque à la seconde source du problème : **les effets CSS lourds et les transformations 3D qui pouvaient rendre le jeu à la fois saccadé et flou**.

## Structure
- `index.html` — structure de l'interface
- `css/style.css` — direction artistique, animations, responsive et optimisations
- `js/game.js` — règles, gameplay, événements, animations et mode développeur
- `assets/` — illustrations SVG des quartiers, cases spéciales, pions, bâtiments et Merveille

Projet en développement.
