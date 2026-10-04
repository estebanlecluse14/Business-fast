# Business Fast

Prototype web du jeu de plateau **Business Fast**.

## Version actuelle
**V0.46 — Centre du plateau & Merveille**

### Nouveautés V0.46
- Refonte complète du cœur de **BUSINESS CITY**.
- Logo, joueur actif, numéro du tour et dé regroupés dans un HUD central compact.
- Dé réduit et mieux intégré pour libérer de l'espace.
- Bandeau des joueurs actifs ajouté au centre.
- Zone Merveille transformée en dock d'information compact.
- Trois états Merveille clairement distingués : emplacement vide, projet disponible, chantier en cours.
- Quand un quartier est complet, le centre affiche directement **Projet disponible** et permet d'ouvrir la Merveille.
- Progression du chantier affichée en pourcentage, étape et tours restants.
- Décor central légèrement atténué pour mieux faire ressortir les informations.
- Suppression d'un double appel de rendu de la Merveille dans `refresh()`.
- Aucun nouvel effet lourd ni animation continue.
- Aucun changement de règles ni d'économie.

### Objectif
La V0.46 transforme le centre du plateau en zone réellement utile au gameplay : **voir qui joue, où en est le tour et suivre la Merveille sans chevauchement ni surcharge visuelle**.

## Structure
- `index.html` — structure de l'interface
- `css/style.css` — direction artistique, UX et centre du plateau
- `js/game.js` — règles, gameplay, décisions et état de la Merveille
- `assets/` — illustrations SVG des quartiers, cases spéciales, pions, bâtiments et Merveille

Projet en développement.
