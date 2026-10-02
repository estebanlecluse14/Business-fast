# Business Fast

Prototype web du jeu de plateau **Business Fast**.

## Version actuelle
**V0.41 — Debug & stabilité**

### Nouveautés V0.41
- Grosse passe de débogage après la Visual Alpha V0.40.
- Validation syntaxique complète du JavaScript.
- Test de démarrage et des principaux parcours de jeu.
- 200 simulations automatiques exécutées sans erreur bloquante.
- Correction du sélecteur des modales événementielles (`.modal-box` → `.box`).
- Nettoyage systématique des états de modale et de cinématique.
- Redémarrage de partie plus propre : overlays, dettes temporaires et musique sont réinitialisés.
- Protection de la file de dettes lorsque la partie est déjà terminée.
- Suppression des anciens effets de pion rond pouvant interférer avec les nouveaux pions SVG.
- Stabilisation de BUSINESS CITY et de la zone Merveille face aux anciennes couches CSS.
- Aucun changement volontaire des règles ou de l'économie du jeu.

## Contrôles effectués
- 36 cases présentes et chargées.
- Aucun ID HTML dupliqué.
- Toutes les références DOM statiques principales sont présentes.
- Achat de propriété testé.
- Passage niveau 1 → 3 testé.
- Lancement de Merveille testé.
- Simulateur de parties testé sur 200 exécutions.

## Structure
- `index.html` — structure de l'interface
- `css/style.css` — direction artistique et responsive
- `js/game.js` — règles, gameplay, événements, animations et mode développeur
- `assets/` — illustrations des quartiers, cases spéciales, pions, bâtiments et Merveille

## Lancer le jeu
Ouvrir `index.html` dans un navigateur moderne.

Projet en développement.
