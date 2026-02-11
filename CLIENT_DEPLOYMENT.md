# Client Deployment Guide for LensClear

This guide explains how to build the LensClear application into a portable package and deploy it to client computers (even those without internet access).

## Prerequisites
- **Host Machine** (Your PC): Docker Desktop installed, source code present.
- **Client Machine**: Docker Desktop installed.

## 1. Create the Deployment Package
On your computer (Host), verify that you are in the project root folder.

Run the build script to create the images and save them to a folder:
```powershell
.\scripts\export-images.ps1
```
*Note: This script will build the latest code, save the Docker images to `.tar` files, and copy necessary configuration files into a new folder named `lensclear-distribution`.*

## 2. Transfer to Client
1. Locate the `lensclear-distribution` folder generated in your project root.
2. Copy this **entire folder** to a USB drive or transfer it via network to the Client computer.

## 3. Install on Client Computer
On the Client Computer:
1. Ensure **Docker Desktop** is running.
2. Open PowerShell as Administrator.
3. Navigate to the `lensclear-distribution` folder you copied.
4. Run the installation script:
   ```powershell
   .\install.ps1
   ```
   *This script handles loading the Docker images (Setup).*

## 4. Running the Application
Once installed, to start the application on the client:

**Using PowerShell:**
```powershell
docker-compose up -d
```

**Accessing the App:**
- Open browser and go to: `http://localhost`
- The application is now running locally on the client machine.
- If accessing from *another* device on the same network as the client machine, use the client machine's IP address (e.g., `http://192.168.1.50`).

## 5. Stopping the Application
```powershell
docker-compose down
```
