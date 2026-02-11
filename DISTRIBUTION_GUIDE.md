# LensClear Distribution Guide

This guide explains how to package the LensClear project for Team deployment and how to install it on a new computer.

## 📦 For Developers: Creating a Release

To create a distribution package that can be shared with the team:

1.  **Open PowerShell** in the project root.
2.  **Run the Export Script**:
    ```powershell
    .\scripts\export-images.ps1
    ```
    *   This will build the Docker images.
    *   It will export them to `.tar` files.
    *   It will package everything into a folder named `lensclear-distribution`.

3.  **Share the Folder**:
    *   Zip or copy the internal `lensclear-distribution` folder.
    *   Send this folder to the client or team member.

---

## 🚀 For Clients/Users: Installing the App

To install and run LensClear on a new Windows computer:

### 1. Prerequisites
*   **Docker Desktop** must be installed and running.
    *   [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 2. Installation
1.  **Extract the folder** provided to you (e.g., `lensclear-distribution`).
2.  Open the folder.
3.  Right-click `deploy-team.ps1` and select **Run with PowerShell**.
    *   *Note: If restricted, you might need to Open Powershell as Administrator, navigate to the folder, and run `.\deploy-team.ps1`*.

### 3. What Happens Next?
The script will auto-magically:
1.  Check if Docker is running.
2.  Load the images from the files (no internet download needed for app code).
3.  Start the Website and Backend Server.
4.  Open the dashboard in your default browser.

### 4. Troubleshooting
*   **"Script is disabled on this system"**:
    *   Open PowerShell as Admin and run: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`
*   **App not opening**:
    *   Manually go to: [http://localhost:5173](http://localhost:5173) working on port 5173.
*   **Stopping the App**:
    *   Run `cleanup.ps1` to stop and remove the containers.

## 🛠️ Folder Structure
Inside the distribution folder:
*   `images/` - Contains the offline docker image files.
*   `install.ps1` - The one-click installer script.
*   `cleanup.ps1` - Script to stop everything.
*   `docker-compose.yml` - The orchestration config.
