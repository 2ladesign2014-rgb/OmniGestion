# TechGestion Pro - Guide de Déploiement et d'Installation

Bienvenue dans la documentation technique de **TechGestion Pro**. Cette application est une solution de gestion commerciale complète (ERP/CRM/POS) conçue pour fonctionner en mode **Offline-First** (hors ligne prioritaire) avec synchronisation cloud optionnelle.

---

## 📋 Prérequis Système

Pour installer et développer sur ce projet, vous avez besoin des outils suivants :

### Indispensables
1.  **Node.js** (v18 ou supérieur) : Pour gérer le Frontend React.
    *   [Télécharger Node.js](https://nodejs.org/)
2.  **Navigateur Moderne** : Google Chrome, Microsoft Edge, ou Brave (support PWA requis).

### Pour le Backend (Optionnel / Mode Full Stack)
Si vous souhaitez activer le backend Python/FastAPI :
1.  **Python** (v3.9+) : [Télécharger Python](https://www.python.org/)
2.  **MongoDB** (Community Server) : Base de données NoSQL.
    *   [Télécharger MongoDB](https://www.mongodb.com/try/download/community)

---

## 🚀 Installation Locale (Développement)

### Étape 1 : Récupération du projet
Clonez ce dépôt ou téléchargez les fichiers dans un dossier local.

```bash
git clone https://github.com/votre-repo/techgestion-pro.git
cd techgestion-pro
```

### Étape 2 : Installation des dépendances Frontend
L'application utilise une architecture moderne sans build complexe pour le mode prévisualisation, mais pour un environnement de production local :

```bash
# Si vous utilisez un bundler comme Vite (recommandé pour la prod)
npm install
```

*Note : Dans la version actuelle fournie (fichier unique), l'application utilise des `ImportMaps` (CDN) pour charger React, ce qui permet de lancer l'application sans `npm install` directement via un serveur web simple.*

### Étape 3 : Lancement de l'application
Vous pouvez utiliser n'importe quel serveur statique.

**Avec Python :**
```bash
python -m http.server 8000
```

**Avec Node.js (http-server) :**
```bash
npx http-server .
```

Ouvrez ensuite votre navigateur à l'adresse : `http://localhost:8000`

---

## 💻 Installation Bureau (Windows / Mac / Linux)

Grâce à la technologie PWA (Progressive Web App), cette application peut s'installer comme un logiciel natif sans passer par un store.

1.  Ouvrez l'application dans **Google Chrome** ou **Edge**.
2.  Regardez dans la barre d'adresse (à droite), vous verrez une icône représentant un **écran avec une flèche vers le bas** (ou un "+" dans un cercle).
3.  Cliquez dessus et sélectionnez **"Installer TechGestion Pro"**.
4.  L'application s'installe sur votre bureau, s'ouvre dans une fenêtre dédiée et fonctionne hors ligne.

---

## 📱 Installation Mobile (Android / iOS)

### Android (Chrome)
1.  Naviguez vers l'URL de l'application.
2.  Une bannière "Ajouter à l'écran d'accueil" peut apparaître. Sinon, ouvrez le menu (3 points) > **Installer l'application**.

### iOS (Safari)
1.  Ouvrez l'application dans Safari.
2.  Appuyez sur le bouton **Partager** (carré avec flèche vers le haut).
3.  Scrollez et sélectionnez **Sur l'écran d'accueil**.

---

## 🛠 Architecture Technique & Offline-First

L'application utilise une architecture hybride robuste :

### 1. Frontend (React 19 + TypeScript)
*   **Interface** : Composants réactifs et Tailwind CSS pour le style.
*   **Logique** : Tout le code métier est dans le navigateur.

### 2. Stockage Local (IndexedDB)
*   L'application utilise `idb` pour stocker **toutes** les données (Clients, Ventes, Stocks) directement dans le navigateur de l'utilisateur.
*   Cela garantit que l'application fonctionne parfaitement **sans connexion internet**.

### 3. Service Worker (`service-worker.js`)
*   Il met en cache les fichiers HTML, CSS, et JS.
*   Il permet le chargement instantané de l'application même en mode avion.
*   Il gère la file d'attente de synchronisation (`Background Sync`) lorsque la connexion revient.

---

## 🔗 Configuration du Backend (FastAPI) - "Pro Mode"

Pour passer en mode Full-Stack avec un serveur Python réel :

1.  **Créer l'environnement virtuel :**
    ```bash
    python -m venv venv
    source venv/bin/activate  # (ou venv\Scripts\activate sur Windows)
    ```

2.  **Installer les dépendances Python :**
    Créez un fichier `requirements.txt` :
    ```text
    fastapi
    uvicorn
    motor
    python-multipart
    python-jose[cryptography]
    passlib[bcrypt]
    ```
    Puis : `pip install -r requirements.txt`

3.  **Lancer le serveur :**
    ```bash
    uvicorn main:app --reload
    ```

4.  **Connecter le Frontend :**
    Modifiez le fichier `services/api.ts`. Remplacez la logique `db.getAll` par des appels `axios.get('http://localhost:8000/api/...')`.

---

## 🔑 Gestion des Clés API (IA Gemini)

L'application utilise l'IA Google Gemini pour l'assistant commercial.
Pour que cela fonctionne :

1.  Obtenez une clé sur [Google AI Studio](https://aistudio.google.com/).
2.  En local, créez un fichier `.env` à la racine (si vous utilisez Vite) ou injectez la variable d'environnement lors du build.
    ```env
    VITE_API_KEY=votre_cle_google_gemini
    ```

---

## 🆘 Dépannage Courant

**L'application ne s'installe pas :**
*   Vérifiez que le fichier `manifest.json` est accessible.
*   L'application doit être servie via **HTTPS** (ou `localhost`).

**Les données ne s'enregistrent pas :**
*   Vérifiez que vous n'êtes pas en "Navigation Privée" (IndexedDB est souvent bloqué en mode privé).
*   Ouvrez la console (F12) > Application > Storage pour vérifier l'espace disponible.

**L'IA ne répond pas :**
*   Vérifiez votre connexion internet (l'IA nécessite une connexion, contrairement au reste de l'app).
*   Vérifiez la clé API dans la console.