
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

*Note: Camera/Biometric features require a "Secure Context". Browser security allows this on 'localhost' or 'https'. If testing via Local IP, you may need to enable "Insecure origins treated as secure" in Chrome Flags (chrome://flags/#unsafely-treat-insecure-origin-as-secure) and add your Local IP address there.*

## 📂 Production Deployment (Public Access)

To make this project publicly accessible with **zero restrictions**:
1. **GitHub**: Push your code to a GitHub repository.
2. **Firebase App Hosting**: Connect your repository in the Firebase Console under "App Hosting". Firebase will provide a permanent, public HTTPS URL.

## 🛠 Bootstrap Credentials
- **Email**: `admin@conex.media`
- **Security Token**: `CONEX-ADMIN-INIT`
