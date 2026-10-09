# Activer les salons Firebase — Business Fast V0.57

1. Ouvrir https://console.firebase.google.com/ et créer un projet Firebase sur le forfait **Spark (gratuit)**.
2. Dans **Paramètres du projet > Vos applications**, ajouter une application **Web** et copier ses paramètres publics dans `js/firebase-config.js`.
3. Dans **Build > Authentication > Sign-in method**, activer **Anonyme**.
4. Dans **Build > Realtime Database**, créer une base de données. Copier son URL exacte dans `databaseURL`.
5. Dans **Realtime Database > Règles**, utiliser temporairement les règles ci-dessous pour tester **uniquement avec des personnes de confiance** :

```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": "auth != null && $roomCode.matches(/^[A-Z2-9]{6}$/)",
        ".write": "auth != null && $roomCode.matches(/^[A-Z2-9]{6}$/)",
        ".validate": "newData.hasChildren(['host', 'members', 'status']) && newData.child('status').val() == 'waiting' && newData.child('members').childrenCount <= 4"
      }
    }
  }
}
```

**Attention :** ces règles de démonstration ne sécurisent pas les actions d'un hôte contre un joueur malveillant. Elles autorisent tout utilisateur anonyme authentifié qui connaît un code à modifier ou supprimer le salon. Ne pas utiliser ces règles pour des parties classées, des données personnelles, ou une mise en production ouverte. Avant la sortie publique, il faudra des règles strictes par joueur, une validation serveur et une logique de partie autoritaire.

## État du développement

- Interface du menu multijoueur : ajoutée.
- Création d'un code de salon, rejoindre, présence en temps réel (max. 4), copier le code, quitter : code ajouté, à tester avec une base Firebase configurée.
- Synchronisation du plateau, dés, tours, achats, événements et victoire : **non implémentée**.
- Ranked et classement global : **non implémentés**.

Ne pas confondre salon connecté et partie jouable en réseau. Le mode classique local n'est pas modifié.
