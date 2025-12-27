# Self-Exclusion App

A Next.js application for managing self-exclusion lists and scanning ID cards to verify patron entry eligibility.

## Features

- **ID Scanning**: Automatically extracts Name, Date of Birth, and ID Number from ID card images.
- **AI-Powered OCR**: Integrates **Groq's Llama 4 Scout** (`meta-llama/llama-4-scout-17b-16e-instruct`) for high-accuracy, privacy-focused text extraction.
- **Age Verification**: Automatically flags underage patrons based on DOB.
- **Exclusion Management**: Checks scanned IDs against a central self-exclusion database.
- **Role-Based Access**: Secure login and management for staff.

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend/Auth**: Supabase
- **OCR/AI**: Groq API (Llama 4 Vision)

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/rajpal07/self-exclusion-app.git
    cd self-exclusion-app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env.local` file in the root directory and add the following keys:

    ```env
    # Supabase Configuration
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

    # Groq API Configuration (for OCR)
    GROQ_API_KEY=gsk_... # Your Groq API Key
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

1.  Log in with authorized credentials.
2.  Navigate to the "Add Patron" or "Scan ID" section.
3.  Use the camera to capture an ID card image.
4.  The system will process the image using Groq AI and display the extracted details for review.
5.  Confirm the details to check for exclusions or add a new entry.

## Deployment

This project is optimized for deployment on [Vercel](https://vercel.com).
Ensure all environment variables are correctly set in the Vercel project settings.
