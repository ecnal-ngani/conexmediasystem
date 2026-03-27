# CONEX MEDIA | Secure Private Network

This is a NextJS-based secure media management system built with ShadCN UI, Tailwind CSS, and Firebase.

## Local Development Setup

To run this project on your local machine using VSCode:

1. **Download the Project**: Use the download button in Firebase Studio to get the latest source code.
2. **Extract**: Unzip the downloaded file to your preferred location.
3. **Open in VSCode**: Open the extracted folder in Visual Studio Code.
4. **Install Dependencies**:
   Open a terminal in VSCode and run:
   ```bash
   npm install
   ```
5. **Configure Environment Variables**:
   Create a `.env` file in the root directory (if not already present) and add your configuration:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
6. **Start the Development Server**:
   ```bash
   npm run dev
   ```
7. **View the App**:
   Open [http://localhost:9002](http://localhost:9002) in your browser.

## Features
- **Secure Authentication**: Multi-role access (Admin, Brand Manager, Editor, Intern).
- **WFH Biometric Sync**: GenAI-powered face verification for remote access.
- **Production Hub**: Real-time project tracking with automated file coding.
- **Task Management Matrix**: Direct assignments with privacy filtering.
- **AI Content Curator**: GenAI-driven resource recommendations.
- **Operations Calendar**: Synchronized shoot and meeting scheduling.

## Security Notice
This is a private network prototype. Authorized personnel credentials:
- `admin@conex.private`
- `employee@conex.private`
- `intern@conex.private`
