
# CONEX MEDIA | Professional Internal Network

A clean, professional media management system built for staff coordination and production tracking. This project uses a modern tech stack (Next.js, Firebase, and AI) to handle real-time data and security.

## 🚀 Initial Access (First-Time Login)

If you are setting up the system for the first time and have no users in your database, use the **Master Bootstrap Credentials** to gain access and enroll your team:

- **Email**: `admin@conex.media`
- **Security Token**: `CONEX-ADMIN-INIT`

*Note: The first login with these credentials will automatically create the primary Administrator account in your database.*

## 📂 Project Structure (Human-Readable Map)

### 1. The Core Application (`src/app`)
- **`/login`**: The secure entry point for staff.
- **`/verify`**: Where WFH (Work From Home) users perform a quick AI biometric check.
- **`/dashboard`**: The main hub.
  - **`/production`**: Tracks media projects, file codes, and artist assignments.
  - **`/calendar`**: A master view of shoots, meetings, and deadlines.
  - **`/admin`**: (Admin Only) For enrolling new staff and managing the team.

### 2. UI Components (`src/components`)
- **`DashboardSidebar`**: The main navigation menu on the left.
- **`QuickActions`**: The floating circular buttons (Bottom Right).
  - **Bell Icon**: System notifications and activity feed.
  - **Plus Icon**: Quick access to create projects, tasks, or events.
- **`ui/`**: A library of professional buttons, tables, and dialogs.

### 3. Data & Security (`src/firebase`)
- **`config.ts`**: Connects the app to our secure database.
- **`AuthContext`**: The "Internal Module" that manages user sessions and the **Security Token** gateway.
- **`firestore/`**: Real-time listeners that update the UI immediately when data changes.

### 4. AI Operations (`src/ai`)
- **`face-verification-flow`**: Uses Gemini AI to ensure a real person is logging in for WFH compliance.
- **`document-summarization-flow`**: Helps staff quickly read long project briefs.

---

## 📱 Mobile Access (Crucial for Testing)

### 1. Why the "Share Preview" Link fails on Phone
The "Share Preview" link is protected by a Google Cloud authentication gate. You will likely see a **401: Workstation does not exist** or find that the **Login Button does not work** on your phone because:
- **Authentication**: Your phone browser isn't signed into the same Google account as your PC.
- **Proxy Blocking**: Mobile browsers (especially Safari on iOS) block the secure cookies required to talk to the database through the preview proxy.

### 2. The Solution: Local IP Method (The ONLY way to test on Phone)
1. **Connect**: Put your phone and computer on the **same Wi-Fi network**.
2. **Identify IP**:
   - **Windows**: Open **Command Prompt**, type `ipconfig`, look for `IPv4 Address`.
   - **macOS/Linux**: Open **Terminal**, type `ipconfig getifaddr en0`.
3. **Browse**: On your phone, type: `http://YOUR_IP_ADDRESS:9002` (e.g., `http://192.168.1.15:9002`).

*Note: Camera access is restricted on non-HTTPS connections. If the camera fails via Local IP, use the "Share Preview" link on a logged-in mobile browser or test on a secure localhost connection.*

---

## 🛠 Troubleshooting

### 1. Fixing "401: Workstation does not exist"
If you see this error when using the "Share Preview" link:
- **Authentication**: Ensure the browser you are using (especially on mobile) is signed into the **same Google account** as your Firebase Studio session.
- **Active Session**: Ensure your Firebase Studio tab is active and not hibernating.
- **Best Practice**: Use the **Mobile Access (Local IP)** method described above—it is faster and avoids 401 errors.

### 2. Launch Development Server
```bash
npm run dev
```
The application will be available at [http://localhost:9002](http://localhost:9002).

---
*Note: This codebase is designed for high readability and professional maintenance.*
