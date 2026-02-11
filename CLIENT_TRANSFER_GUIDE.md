# 📦 LensClear Client Transfer & Deployment Guide

This guide explains how to package the LensClear application and deploy it to a client's computer, including those **without internet access**.

---

## 🏗️ Phase 1: Create the Package (For Developer)

**Goal:** Create a portable folder containing the entire application and installation scripts.

1.  **Open PowerShell** in your project root folder (`lensclear-project`).
2.  **Run the Export Script**:
    ```powershell
    .\scripts\export-images.ps1
    ```
    *What this does:*
    - Builds the latest version of the Frontend and Backend.
    - Saves them + MongoDB into Docker image files (`.tar`).
    - Creates a folder named `lensclear-distribution`.

3.  **Transfer**:
    - Locate the `lensclear-distribution` folder.
    - Copy this **entire folder** to a USB drive or shared network location.

---

## 🚀 Phase 2: Install on Client (For User)

**Goal:** Install and run the application on the target computer.

### Prerequisites
- **Docker Desktop** must be installed and running on the client computer.
- No Internet connection is required for installation (if Docker is already installed).

### Installation Steps
1.  **Copy the Folder**: Copy the `lensclear-distribution` folder from the USB drive to the client's computer (e.g., Desktop or Documents).
2.  **Open PowerShell**: Right-click the folder and verify the path, then open PowerShell and `cd` into it, OR just open the folder in File Explorer, type `powershell` in the address bar, and hit Enter.
3.  **Run Installer**:
    ```powershell
    .\install.ps1
    ```
    *(Note: If you get a security error, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first).*

4.  **Configuration**:
    - The script may ask for the computer's **IP Address**.
    - If you want other devices (like tablets/sensors) to connect to this computer, enter its specific IP (e.g., `192.168.1.50`).
    - If standalone, just press **Enter** (defaults to `localhost`).

5.  **Completion**:
    - The script will load the software, start the services, and automatically open your browser to `http://localhost`.

---

## 🛠️ Managing the App

### Start / Stop
Navigate to the `lensclear-distribution` folder in PowerShell:

- **Start**: `docker-compose up -d`
- **Stop**: `docker-compose down`
- **Restart**: `docker-compose restart`

### Troubleshooting

**"Docker not found"**
- Make sure Docker Desktop is installed and the whale icon is visible in the system tray.

**"Execution of scripts is disabled on this system"**
- Run this command in PowerShell before the install script:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  ```

**App not accessible on network**
- Check Windows Firewall. You may need to allow port `80` (Frontend) and `5000` (Backend/API) and `1883` (MQTT).
