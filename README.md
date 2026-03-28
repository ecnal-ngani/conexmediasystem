# CONEX MEDIA | Professional Internal Network

A clean, professional media management system built for staff coordination and production tracking. This project uses a modern tech stack (Next.js, Firebase, and AI) to handle real-time data and security.

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
- **`QuickActions`**: The "zap" button for fast access to common tasks.
- **`ui/`**: A library of professional buttons, tables, and dialogs.

### 3. Data & Security (`src/firebase`)
- **`config.ts`**: Connects the app to our secure database.
- **`AuthContext`**: Manages user sessions (stays logged in, handles WFH status).
- **`firestore/`**: Real-time listeners that update the UI immediately when data changes.
- **`index.ts`**: The "Internal Gateway" that connects to the Firebase Node Module.

### 4. AI Operations (`src/ai`)
- **`face-verification-flow`**: Uses Gemini AI to ensure a real person is logging in for WFH compliance.
- **`document-summarization-flow`**: Helps staff quickly read long project briefs.

### 5. Custom Internal Modules (`src/lib`)
- **`media-helpers.ts`**: A custom "local module" created for shared logic like URL generation and file size formatting. This keeps our pages clean and easy to maintain.

---

## 🛠 Quick Start

### 1. Installation
Open your terminal in the project folder and run:
```bash
npm install
```
*Note: This creates the `node_modules` folder (the app's toolbox). This folder is managed by the system and should not be edited manually.*

### 2. Launch Development Server
```bash
npm run dev
```
The application will be available at [http://localhost:9002](http://localhost:9002).

## 📱 Mobile Access (Testing on your phone)
1. **Same Network**: Connect your phone and computer to the same Wi-Fi.
2. **Find Your IP**: 
   - **Windows**: Type `ipconfig` in Command Prompt. Look for `IPv4 Address`.
   - **Mac**: Check System Settings > Network.
3. **Open Browser**: Type `http://YOUR_IP_ADDRESS:9002` (e.g., `http://192.168.1.15:9002`) on your phone.

---
*Note: This codebase is designed for high readability and professional maintenance.*
