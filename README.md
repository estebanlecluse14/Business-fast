# Business Fast

Prototype web du jeu de plateau **Business Fast**.

## Version actuelle
**V0.42 — Fluidité & performances**

### Nouveautés V0.42
- Optimisation prioritaire après les retours de lag.
- Déplacement du pion réécrit : le plateau n'est plus reconstruit à chaque case parcourue.
- Un seul rendu complet du plateau est effectué à la fin du déplacement.
- Animation du dé raccourcie et bruitages intermédiaires moins fréquents.
- Réduction des effets de flou plein écran très coûteux.
- Animations décoratives continues ralenties ou désactivées sur les configurations plus modestes.
- Mode performance automatique selon la taille d'écran et le nombre de cœurs CPU disponibles.
- Ombres et filtres GPU allégés en mode performance.
- Particules secondaires réduites en mode performance.
- Aucun changement de règles ni d'économie.

### Pourquoi cette version
La V0.41 a sécurisé la logique. La V0.42 s'attaque au principal problème de confort restant : **la sensation de lag et les micro-saccades**, particulièrement pendant le déplacement des pions et les animations superposées.

## Structure
- `index.html` — structure de l'interface
- `css/style.css` — direction artistique, animations, responsive et optimisations
- `js/game.js` — règles, gameplay, événements, animations et mode développeur
- `assets/` — illustrations des quartiers, cases spéciales, pions, bâtiments et Merveille

## Lancer le jeu
Ouvrir `index.html` dans un navigateur moderne.

Projet en développement.
