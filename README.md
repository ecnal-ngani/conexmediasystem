# CONEX MEDIA | Private Internal Network

A professional media management system designed for internal staff. This dashboard facilitates production tracking, task assignments, and secure biometric verification for remote personnel.

## Quick Start

### 1. Installation
Open your terminal in the project folder and run:
```bash
npm install
```

### 2. Launch Development Server
```bash
npm run dev
```
The application will be available at [http://localhost:9002](http://localhost:9002).

## Mobile Access (Testing on your phone)

To view the application on your mobile device without a QR code:

1. **Same Network**: Ensure your computer and phone are connected to the same Wi-Fi network.
2. **Find Your IP**: 
   - **Windows**: Open Command Prompt, type `ipconfig`, and find the `IPv4 Address` (e.g., `192.168.1.15`).
   - **Mac**: Go to System Settings > Network > Wi-Fi > Details, and find your IP address.
3. **Open Browser**: On your phone, open your browser and type `http://YOUR_IP_ADDRESS:9002` (e.g., `http://192.168.1.15:9002`).

## Project Structure

- `src/app`: Page routes and core layouts.
- `src/components`: Reusable UI components (Sidebar, Tables, Modals).
- `src/firebase`: Database configuration and real-time data hooks.
- `src/ai`: Genkit AI flows for biometric analysis and document processing.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database/Auth**: Firebase
- **Styling**: Tailwind CSS & ShadCN UI
- **AI**: Genkit (Google Gemini)

---
*Confidential - Internal Use Only.*