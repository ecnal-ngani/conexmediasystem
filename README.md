
# CONEX MEDIA | Professional Internal Network

A clean, professional media management system built for staff coordination and production tracking.

## 🚀 CRITICAL: Mobile Access & 401 Errors

If you see a **401: Workstation does not exist** or **Permission Denied** error on your phone while scanning the QR code:
**This is NOT a bug in the code.** It is a security gate from the Google Cloud Workstation.

### The "Local IP" Method (Recommended Fix)
To bypass the 401 error and test on your phone with **no restrictions**:
1. **Connect**: Ensure your phone and computer are on the **same Wi-Fi network**.
2. **Identify IP**:
   - **Windows**: Open Command Prompt, type `ipconfig`, look for `IPv4 Address` (e.g., 192.168.1.15).
   - **macOS/Linux**: Open Terminal, type `ipconfig getifaddr en0`.
3. **Browse**: On your phone, open your browser and type: `http://YOUR_IP_ADDRESS:9002` (e.g., `http://192.168.1.15:9002`).

*Note: Camera features require a "Secure Context". Browser security allows this on 'localhost' or 'https'. If testing via Local IP, you may need to enable "Insecure origins treated as secure" in Chrome Flags (chrome://flags/#unsafely-treat-insecure-origin-as-secure) and add your Local IP address there.*

## 📂 How to Connect to GitHub

To take this project from "Preview" to a live website, you must link it to GitHub:

1. **Create Repo**: Go to [GitHub](https://github.com/new) and create a new **Private** repository (e.g., `conex-media-system`). Do NOT initialize it with a README or License.
2. **Open Terminal**: In this workstation, open the terminal.
3. **Initialize & Link**:
   ```bash
   git init
   git add .
   git commit -m "Initial Command: System Deployment"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```
4. **Deploy with Firebase**:
   - Go to the [Firebase Console](https://console.firebase.google.com/).
   - Select **App Hosting** from the sidebar.
   - Click "Get Started" and connect your GitHub account.
   - Select your repository and Firebase will handle the rest.

## 🛠 Operational Workflow (Editing Cycle)

Once linked, your editing loop is as follows:

1. **Modify**: Request changes here in AI Studio or edit files manually.
2. **Commit & Push**: Use the terminal to send changes to GitHub:
   ```bash
   git add .
   git commit -m "Update: [Description of changes]"
   git push origin main
   ```
3. **Auto-Deploy**: Firebase App Hosting monitors your GitHub. Within minutes of your `push`, the live website will update automatically.

## 🔑 Bootstrap Credentials
- **Email**: `admin@conex.media`
- **Security Token**: `CONEX-ADMIN-INIT`
