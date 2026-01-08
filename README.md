# Self-Exclusion App

A Next.js application for managing self-exclusion lists with AI-powered ID card scanning and verification.

> [!IMPORTANT]
> **Privacy-First Design**: This application does NOT store ID card images. Images are processed in memory and immediately discarded after text extraction.

## 🌟 Features

- **AI-Powered ID Scanning**: Automatically extracts Name, Date of Birth, and ID Number from ID card images using Groq's Llama 4 Scout model
- **Age Verification**: Automatically validates age based on extracted date of birth
- **Exclusion Management**: Search and manage self-exclusion lists with real-time verification
- **Secure Authentication**: Role-based access control with Supabase Auth
- **Audit Logging**: Complete audit trail of all operations for compliance
- **Privacy-Focused**: Zero image storage - all ID photos processed in memory only

## 🏗️ Technology Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **AI/OCR** | Groq API (Llama 4 Scout) |
| **Testing** | Jest + React Testing Library |

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security & Privacy](#security--privacy)
- [Documentation](#documentation)
- [Troubleshooting](#troubleshooting)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account ([sign up](https://supabase.com))
- Groq API key ([get key](https://console.groq.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rajpal07/self-exclusion-app.git
   cd self-exclusion-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (see [Environment Setup](#environment-setup))

4. **Set up database** (see [Database Setup](#database-setup))

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Open application**
   - Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Environment Setup

### Create Environment File

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Groq API Configuration (for OCR)
GROQ_API_KEY=gsk_your_groq_api_key
```

### Getting API Keys

#### Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Groq

1. Go to [console.groq.com](https://console.groq.com)
2. Create an account or sign in
3. Navigate to **API Keys**
4. Create a new API key → `GROQ_API_KEY`

> [!CAUTION]
> **Never commit `.env.local` to version control!** It's already in `.gitignore`.

## 🗄️ Database Setup

### 1. Create Tables

In your Supabase project, go to **SQL Editor** and run:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create excluded_persons table
CREATE TABLE excluded_persons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patron_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  dob DATE NOT NULL,
  expiry_date DATE NOT NULL,
  added_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_excluded_persons_name ON excluded_persons(name);
CREATE INDEX idx_excluded_persons_dob ON excluded_persons(dob);
CREATE INDEX idx_excluded_persons_expiry ON excluded_persons(expiry_date);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

### 2. Enable Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE excluded_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Excluded persons policies
CREATE POLICY "Authenticated users can view exclusions"
  ON excluded_persons FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert exclusions"
  ON excluded_persons FOR INSERT TO authenticated
  WITH CHECK (true);

-- Audit logs policies
CREATE POLICY "Users can create audit logs"
  ON audit_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

For complete database documentation, see [DATABASE.md](./DATABASE.md).

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

Application runs on [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test Suites

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# Security tests
npm run test:security
```

### Generate Coverage Report

```bash
npm run test:coverage
```

For detailed testing documentation, see [TESTING.md](./TESTING.md).

## 📦 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your repository

3. **Configure Environment Variables**
   - Add all variables from `.env.local`
   - Ensure `GROQ_API_KEY` is set (server-side only)

4. **Deploy**
   - Vercel will automatically build and deploy
   - Application will be available at `https://your-app.vercel.app`

### Environment Variables in Vercel

Navigate to **Settings** → **Environment Variables** and add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Production, Preview, Development |
| `GROQ_API_KEY` | Your Groq API key | Production, Preview, Development |

## 🔒 Security & Privacy

### Image Handling

> [!NOTE]
> **Critical Privacy Feature**: ID card images are NEVER stored anywhere.

**Image Lifecycle**:
1. Captured in browser memory (base64)
2. Sent via HTTPS to `/api/ocr`
3. Forwarded to Groq AI for processing
4. Text data extracted (name, DOB, ID number)
5. Image immediately discarded
6. Only text data stored in database

**Verification**:
- Check browser DevTools → No localStorage/sessionStorage entries
- Check Supabase Storage → No image files
- Check Network tab → No uploads to storage endpoints

For complete security documentation, see [SECURITY.md](./SECURITY.md).

### Data Protection

- **Encryption in Transit**: All API calls over HTTPS/TLS 1.2+
- **Encryption at Rest**: Supabase PostgreSQL encryption enabled
- **Row Level Security**: Database-level access control
- **Authentication**: Secure session management with HTTP-only cookies
- **Audit Logging**: Complete trail of all operations

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [SECURITY.md](./SECURITY.md) | Security architecture and privacy measures |
| [DATABASE.md](./DATABASE.md) | Database schema, RLS policies, and management |
| [TESTING.md](./TESTING.md) | Testing guide and procedures |
| [docs/SECURITY_AUDIT_REPORT.md](./docs/SECURITY_AUDIT_REPORT.md) | Comprehensive security audit |

## 🎯 Usage

### 1. Sign Up / Log In

- Navigate to `/login`
- Create account or sign in
- Redirected to dashboard

### 2. Scan ID Card

- Click **"Scan ID Card"** button
- Allow camera access
- Align ID card within frame
- Capture image
- Review extracted data
- Confirm or retake

### 3. Search for Patron

- Enter name and date of birth
- Click **"Check"**
- View result (excluded or not found)

### 4. Add Patron to Exclusion List

- Fill in patron details
- Set expiry date
- Click **"Add Patron"**
- Patron added to active exclusions

### 5. View Exclusion Lists

- **Active**: Exclusions with future expiry dates
- **Expired**: Past exclusions for reference

## 🛠️ Troubleshooting

### Camera Not Working

- **Check Permissions**: Ensure browser has camera access
- **HTTPS Required**: Camera API requires HTTPS (works on localhost)
- **Browser Support**: Use Chrome, Firefox, Safari, or Edge

### OCR Not Extracting Data

- **Image Quality**: Ensure ID card is clear and well-lit
- **Alignment**: Keep ID card within frame boundaries
- **Retry**: Use "Retake" button for better capture
- **Manual Entry**: Enter details manually if scanning fails

### Database Connection Issues

- **Check Environment Variables**: Verify Supabase URL and key
- **RLS Policies**: Ensure user is authenticated
- **Network**: Check internet connection

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Groq** for AI-powered OCR
- **Supabase** for backend infrastructure
- **Next.js** for the framework
- **Vercel** for hosting

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Check [SECURITY.md](./SECURITY.md) for security concerns
- Review [TESTING.md](./TESTING.md) for testing help

---

**Built with ❤️ for privacy and security**
