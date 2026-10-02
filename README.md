# Business Fast

Prototype web du jeu de plateau **Business Fast**.

## Version actuelle
**V0.44 — UX des tours**

### Nouveautés V0.44
- Nouvelle zone **Action conseillée** indiquant clairement quoi faire à chaque moment.
- Phase du tour affichée : à jouer, décision, option, merveille, fin de tour, dette, etc.
- Prix d'achat et coût d'amélioration affichés directement dans les boutons.
- Bouton recommandé visuellement mis en avant sans animation lourde.
- Raisons de blocage disponibles sur les boutons désactivés.
- Textes contextuels pour achat, construction, Merveille et fin de tour.
- Joueur actif davantage mis en évidence avec badge **À TOI**.
- Numéro du tour de table visible dans BUSINESS CITY.
- Messages de début de tour personnalisés.
- Correction d'un petit écart du mode DEV : le bouton +50k journalise désormais bien +50k.
- Aucun changement de règles ni d'économie.

### Objectif
La V0.44 doit rendre une partie compréhensible sans avoir à deviner la prochaine action. Le joueur voit immédiatement **qui joue, quelle phase est en cours, quelle action est possible et pourquoi une autre est bloquée**.

## Structure
- `index.html` — structure de l'interface
- `css/style.css` — direction artistique, animations, responsive et UX
- `js/game.js` — règles, gameplay, événements, animations et guidage du tour
- `assets/` — illustrations SVG des quartiers, cases spéciales, pions, bâtiments et Merveille

Projet en développement.
