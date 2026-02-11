# 📦 LensClear Client Transfer & Deployment Guide

This guide explains how to package the LensClear application and deploy it to a client's computer, including those **without internet access**.

---

## 🏗️ Phase 1: Create the Package (For Developer)

**Goal:** Create a portable folder containing the entire application and installation scripts.

1.  **Open PowerShell** in your project root folder (`lensclear-project`).
2.  **Run the Export Script**:
    ```powershell
    .\scripts\build_package.ps1
    ```
    *What this does:*
    - Builds the latest version of the Frontend and Backend.
    - Saves them into compressed Docker image files (`.tar`).
    - Creates a folder named `lensclear-delivery`.

3.  **Transfer**:
    - Locate the `lensclear-delivery` folder.
    - Copy this **entire folder** to a USB drive or shared network location.

---

## 🚀 Phase 2: Install on Client (For User)

**Goal:** Install and run the application on the target computer.

### Prerequisites
- **Docker Desktop** must be installed and running on the client computer.
- No Internet connection is required for installation.

### Installation Steps
1.  **Copy the Folder**: Copy the `lensclear-delivery` folder from the USB drive to the client's computer (e.g., Desktop or Documents).
2.  **Open PowerShell**: Open the folder in File Explorer, type `powershell` in the address bar, and hit Enter.
3.  **Run Installer**:
    ```powershell
    .\install.ps1
    ```
    *(Note: If you get a security error, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first).*

4.  **Completion**:
    - The script will load the software, start the services, and automatically open your browser to `http://localhost`.

---

## 🛠️ Managing the App

Navigate to the `lensclear-delivery` folder in PowerShell:

- **Start**: `docker-compose up -d`
- **Stop**: `docker-compose down`
- **Restart**: `docker-compose restart`

### Troubleshooting

**"Port 80 is in use"**
- Ensure no other web servers (like IIS or Apache) are running on the client machine. The application requires Port 80 for the dashboard.

**"Docker not found"**
- Make sure Docker Desktop is installed and the whale icon is visible in the system tray.

**"Firestore Connectivity"**
- The application requires an internet connection for the initial data sync with Firestore. Ensure the client machine has internet access if they are using the default cloud database.
