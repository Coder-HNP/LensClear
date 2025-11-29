# AntiGravity IoT System Dashboard

A futuristic, production-ready IoT Dashboard built with React, TailwindCSS, and Firebase.

## Features

- **Real-time Monitoring**: Live updates for device status, temperature, humidity, and more using Firestore real-time listeners.
- **Device Control**: Interactive control panel to toggle power, switch modes, and trigger actions.
- **Data Visualization**: Dynamic charts showing sensor history.
- **Alert System**: Real-time notifications for critical events (e.g., overheating, low battery).
- **Event Logging**: Comprehensive history of all user actions and system events.
- **Device Management**: Link and unlink devices easily.
- **Responsive Design**: Fully optimized for desktop, tablet, and mobile.
- **Secure Auth**: Google Sign-in and Email/Password authentication.

## Tech Stack

- **Frontend**: React (Vite)
- **Styling**: TailwindCSS
- **Backend**: Firebase (Auth, Firestore)
- **Charts**: Chart.js (react-chartjs-2)
- **Icons**: Lucide React

## Setup Instructions

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd lensclear-project
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Firebase Configuration**
    - Create a project in the [Firebase Console](https://console.firebase.google.com/).
    - Enable **Authentication** (Email/Password, Google).
    - Enable **Firestore Database**.
    - Copy your web app configuration keys.
    - Update `src/firebase.js` with your keys.

4.  **Deploy Security Rules**
    - Copy the contents of `firestore.rules` to your Firebase Console > Firestore > Rules tab.
    - Or deploy using CLI: `firebase deploy --only firestore:rules`

5.  **Run Locally**
    ```bash
    npm run dev
    ```

## Deployment

To deploy to Firebase Hosting:

1.  **Install Firebase CLI**
    ```bash
    npm install -g firebase-tools
    ```

2.  **Login and Init**
    ```bash
    firebase login
    firebase init hosting
    ```

3.  **Build and Deploy**
    ```bash
    npm run build
    firebase deploy
    ```

## License

MIT
