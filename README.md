# SpaceGravure

Logiciel de génération de G-code pour la gravure laser.

## Comment lancer l'application

Comme le lancement par script peut être instable sur certains systèmes (à cause des politiques de sécurité ou de services comme OneDrive), voici la méthode de lancement manuelle, qui est fiable à 100%.

### Prérequis

Avoir [Node.js et npm](https://nodejs.org/fr) installés sur votre machine.

### Étapes de lancement

1.  **Ouvrez une invite de commande (PowerShell est recommandé).**
    -   Vous pouvez la trouver en cherchant `PowerShell` dans votre menu Démarrer.

2.  **Naviguez jusqu'au dossier du projet.**
    -   Utilisez la commande `cd` pour vous déplacer dans le répertoire où vous avez placé les fichiers du projet. Par exemple, si votre projet est sur le Bureau :
    ```powershell
    cd $HOME\Desktop\SpaceGravure
    ```

3.  **Installez les dépendances (à faire une seule fois).**
    -   La toute première fois que vous lancez le projet, ou après une mise à jour, exécutez la commande ci-dessous. Elle télécharge les paquets nécessaires comme Electron.
    ```powershell
    npm install
    ```

4.  **Lancez l'application.**
    -   Une fois les dépendances installées, vous pouvez lancer l'application à tout moment avec cette commande :
    ```powershell
    npm start
    ```

L'application "SpaceGravure" devrait maintenant s'ouvrir dans sa propre fenêtre.
