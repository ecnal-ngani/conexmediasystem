
# CONEX MEDIA | Professional Internal Network

A clean, professional media management system built for staff coordination and production tracking. This project uses a modern tech stack (Next.js, Firebase, and AI) to handle real-time data and security.

## 🚀 CRITICAL: Mobile Access & 401 Errors

If you see a **401: Workstation does not exist** or **Permission Denied** error on your phone:
**This is NOT a bug in the code.** It is a security gate from Google Cloud. To bypass it and test on your phone:

### The "Local IP" Method (Recommended)
1. **Connect**: Put your phone and computer on the **same Wi-Fi network**.
2. **Identify IP**:
   - **Windows**: Open Command Prompt, type `ipconfig`, look for `IPv4 Address`.
   - **macOS/Linux**: Open Terminal, type `ipconfig getifaddr en0`.
3. **Browse**: On your phone, type: `http://YOUR_IP_ADDRESS:9002` (e.g., `http://192.168.1.15:9002`).

*Note: Camera access is restricted on non-HTTPS connections. If the camera fails via Local IP, you must use the "Share Preview" link on a browser logged into your Google account, or test on a secure localhost connection.*

## 📂 Project Structure

### 1. The Core Application (`src/app`)
- **`/login`**: Secure entry point with Mobile Access troubleshooting.
- **`/verify`**: Biometric AI check for WFH users.
- **`/dashboard`**: Master Hub with Real-time Presence and Gamified Stats.

### 2. UI Components (`src/components`)
- **`MobileNav`**: Professional bottom navigation bar for one-handed operation.
- **`DashboardSidebar`**: Optimized desktop navigation.
- **`QuickActions`**: Floating tactical shortcuts.

### 3. Data & Security (`src/firebase`)
- **`AuthContext`**: Manages sessions and Security Token validation.
- **`Firestore Hooks`**: Real-time listeners for projects, tasks, and presence.

---

## 🛠 Troubleshooting

### Fixing "401: Workstation does not exist"
- **Cause**: Your phone's browser is not signed into the same Google account as your PC, or it is blocking required authentication cookies.
- **Fix**: Use the **Local IP Method** described above. It is faster and bypasses the Google Cloud workstation proxy.

### Initial Access (First-Time Login)
Use the **Master Bootstrap Credentials**:
- **Email**: `admin@conex.media`
- **Security Token**: `CONEX-ADMIN-INIT`
