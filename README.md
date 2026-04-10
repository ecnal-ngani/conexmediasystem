
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

## 📂 Operational Workflow (How to Edit)

Once you have connected this project to GitHub and deployed via **Firebase App Hosting**, your editing loop is as follows:

1. **Modify**: Request changes here in the AI Studio or edit files manually in the workstation.
2. **Commit & Push**: Use the terminal to push your changes to GitHub:
   ```bash
   git add .
   git commit -m "Update: [Description of changes]"
   git push origin main
   ```
3. **Auto-Deploy**: Firebase App Hosting monitors your GitHub. Within minutes of your `push`, the live website will update automatically.

## 🛠 Bootstrap Credentials
- **Email**: `admin@conex.media`
- **Security Token**: `CONEX-ADMIN-INIT`
