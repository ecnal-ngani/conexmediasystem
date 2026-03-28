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

## 💡 Frequently Asked Questions (For Explaining the Project)

### Q: Where is the HTML?
**A:** We use `.tsx` files. These are "Smart HTML" files. They look like HTML but allow us to add logic (like showing your name automatically) directly into the structure. The browser turns these into regular HTML when the page loads.

### Q: What is TypeScript (TS)?
**A:** It's like a "Safety Net" for JavaScript. It prevents us from making simple mistakes (like trying to add a number to a word) by checking our code as we write it.

### Q: What are Node Modules?
**A:** This is the "App's Toolbox." It contains pre-written code for things like the Database and AI so we don't have to build them from scratch. We hide this folder because it's managed by the system.

### Q: What is the `.next` folder?
**A:** This is the "Build Cache." It's a temporary folder the computer creates to make the app run faster. It is automatically updated every time you save your code.

---

## 🛡️ Panel Defense Preparation (Q&A)

### 1. Technical Architecture
**Q: Why did you choose Next.js for this project?**
*   **A:** Next.js allows us to build a "Full Stack" app in one place. It handles both the frontend (what users see) and the backend logic (how pages load and redirect) very efficiently using its "App Router" system.

### 2. Security & Authentication
**Q: How do you prevent unauthorized users from seeing staff data?**
*   **A:** We use a "Two-Gate" system. First, the `AuthContext` checks if a user is logged in. Second, the `firestore.rules` file acts as a database-level guard. Even if someone tried to bypass the UI, the database itself would reject any request not coming from an authenticated staff account.

**Q: What is the purpose of the "Anonymous Login" mentioned in the code?**
*   **A:** It's a security baseline. It gives the user a temporary identity so they can communicate with the server securely *before* we lookup their email in our private staff registry.

### 3. Artificial Intelligence (AI)
**Q: How does the AI Biometric Verification work?**
*   **A:** We use a Genkit Flow that connects to Google's Gemini AI. When a WFH user takes a photo, the AI analyzes it in real-time to ensure it's a "Live" human face and not a photo of a screen or a mask.

**Q: Why use AI for document summarization?**
*   **A:** In a media environment, project briefs can be 10 pages long. The AI summarizes the text into a "Quick Briefing" to save staff time, which is a standard efficiency tool in modern production houses.

### 4. Data Management
**Q: How does the app update the "Production Hub" without refreshing the page?**
*   **A:** We use "Real-time Snapshots" (specifically the `onSnapshot` hook in our Firebase module). The app stays connected to the database; as soon as an artist updates a project status, the database "pushes" that change to all connected staff screens instantly.

### 5. Project Maintenance
**Q: What is the benefit of the `lib/media-helpers.ts` file you created?**
*   **A:** It follows the "DRY" principle (Don't Repeat Yourself). By putting shared logic like "File Code Generation" in one place, we ensure consistency across the whole app and make the code much easier to maintain or debug.

---

## 🛠 Quick Start

### 1. Installation
Open your terminal in the project folder and run:
```bash
npm install
```
*Note: This creates the `node_modules` folder. Do not edit this manually.*

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
