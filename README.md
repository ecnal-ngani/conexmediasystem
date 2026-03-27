
# CONEX MEDIA | Secure Private Network

A secure media management system for internal personnel, featuring biometric verification, task management, and an AI-powered production hub.

## Project Architecture

This application is built with:
- **Next.js 15 (App Router)**: Core framework for the dashboard and routing.
- **Firebase**: Handles Authentication and real-time Firestore database.
- **Tailwind CSS & ShadCN UI**: For a consistent, professional design system.
- **Genkit (AI)**: Powering biometric face verification and document summarization.

## Getting Started (Local Development)

### 1. Prerequisites
- **Node.js (LTS version)**: [Download here](https://nodejs.org/)
- **Visual Studio Code**: Recommended IDE.

### 2. Setup
1. **Extract**: Unzip the project folder.
2. **Install**: Open a terminal in the folder and run:
   ```bash
   npm install
   ```
3. **Run**: Start the development server:
   ```bash
   npm run dev
   ```
4. **Access**: Open [http://localhost:9002](http://localhost:9002) in your browser.

## Project Structure (For Explanation)

- `src/app`: Contains all pages (Dashboard, Admin, Production).
- `src/components`: Shared UI components (Sidebar, Modals).
- `src/firebase`: Configuration and custom hooks for database interaction.
- `src/ai`: Genkit flows for AI processing.
- `firestore.rules`: Security logic ensuring only authorized users access data.

## Security Overview
This app uses **Role-Based Access Control (RBAC)**.
- **ADMIN**: Full control over staff and projects.
- **EDITOR/VIDEOGRAPHER**: Access to production tools and tasks.
- **INTERN**: Read-only access to specific sectors.
- **WFH Protocol**: Remote users must pass a biometric check before entering the dashboard.

---
*Created for CONEX MEDIA Internal Operations.*
