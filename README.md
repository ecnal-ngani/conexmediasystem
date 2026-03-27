# CONEX MEDIA | Secure Private Network

This is a NextJS-based secure media management system built with ShadCN UI, Tailwind CSS, and Firebase.

## Local Development Setup

To run this project on your local machine using VSCode, follow these steps:

### 1. Prerequisites (Must be installed first)
- **Node.js**: You need Node.js installed to run the server. 
  - Download it here: [https://nodejs.org/](https://nodejs.org/) (Choose the **LTS** version).
  - After installing, **restart VSCode** before proceeding.
- **XAMPP is NOT required**: This project uses Node.js and Firebase (Cloud Database), so you do not need Apache or MySQL from XAMPP.

### 2. Setup Instructions
1. **Download the Project**: Use the download button in Firebase Studio to get the latest source code.
2. **Extract**: Unzip the downloaded file to your preferred location.
3. **Open in VSCode**: Open the extracted folder in Visual Studio Code.
4. **Install Dependencies**:
   Open a terminal in VSCode (`Ctrl + ` `) and run:
   ```bash
   npm install
   ```
   *Note: If you see "vulnerabilities" or "deprecated" warnings, you can safely ignore them. This is normal.*

5. **Start the Development Server**:
   In the terminal, run:
   ```bash
   npm run dev
   ```
6. **View the App**:
   Once the terminal says "Ready", open [http://localhost:9002](http://localhost:9002) in your browser.

## Troubleshooting

### "Scripts are disabled on this system" (Windows Error)
If you get an error when running `npm install` saying scripts are disabled:
1. **Use the Command Prompt** instead of PowerShell:
   - In the VSCode Terminal, click the arrow next to the `+` sign and select **Command Prompt**.
   - Run `npm install` there.
2. **OR Fix PowerShell**:
   - Open PowerShell as **Administrator** (Right-click Start > search PowerShell > Run as Administrator).
   - Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
   - Type `Y` and press Enter.
   - Restart VSCode.

## Success Checklist
- [x] Node.js installed (LTS Version).
- [x] `npm install` finished (Warnings are okay!).
- [x] `npm run dev` shows "Ready in ...s".
- [x] Browser opens to `localhost:9002`.

## Security Notice
This is a private network prototype. Authorized personnel credentials:
- `admin@conex.private`
- `employee@conex.private`
- `intern@conex.private`
