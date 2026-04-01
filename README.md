
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

## 🛡️ Panel Defense Preparation (Q&A)

### 1. Technical Architecture
**Q: Why did you choose Next.js for this project?**
*   **A:** Next.js allows us to build a "Full Stack" app in one place. It handles both the frontend (what users see) and the backend logic (how pages load and redirect) very efficiently using its "App Router" system.

### 2. Security & Authentication
**Q: What is a Security Token?**
*   **A:** It is a high-entropy internal passcode assigned to staff. Unlike public passwords, these are managed by the Administrator to prevent unauthorized access even if an email is compromised.

**Q: How do you prevent unauthorized users from seeing staff data?**
*   **A:** We use a "Two-Gate" system. Gate 1 is the Security Token check. Gate 2 is the AI Biometric Verification (for WFH).

### 3. Artificial Intelligence (AI)
**Q: How does the AI Biometric Verification work?**
*   **A:** We use a Genkit Flow that connects to Google's Gemini AI. When a WFH user takes a photo, the AI analyzes it in real-time to ensure it's a "Live" human face and not a photo of a screen or a mask.

---

## 🛠 Troubleshooting & Mobile Access

### 1. Fixing "401: Workstation does not exist"
If you see this error when using the "Share Preview" link:
- **Authentication**: Ensure the browser you are using (especially on mobile) is signed into the **same Google account** as your Firebase Studio session.
- **Active Session**: Ensure your Firebase Studio tab is active and not hibernating.
- **Best Practice**: Use the **Mobile Access (Local IP)** method below for testing on physical devices—it is faster and avoids 401 errors.

### 2. Mobile Access (Testing on your phone)
1. **Same Network**: Connect your phone and computer to the same Wi-Fi.
2. **Find Your IP Address**: 
   - **Windows**: Open **Command Prompt**, type `ipconfig`, and look for `IPv4 Address`.
   - **macOS (Terminal)**: Type `ipconfig getifaddr en0`.
3. **Open Browser**: Type `http://YOUR_IP_ADDRESS:9002` on your phone.

### 3. Launch Development Server
```bash
npm run dev
```
The application will be available at [http://localhost:9002](http://localhost:9002).

---
*Note: This codebase is designed for high readability and professional maintenance.*
