# Yunnan University ICPC Registration System

A modern, serverless registration system for the ICPC (International Collegiate Programming Contest) campus selection contest at Yunnan University.

## 🚀 Features

- **Student Registration**: Streamlined form for students to submit personal info, resume, and attachments.
- **Admin Dashboard**: Comprehensive management interface for reviewing registrations.
- **Email Notifications**: Automated email notifications for approval/rejection results.
- **Secure Authentication**: Powered by Supabase Auth with email verification.
- **Role-Based Access**: Strict separation between student and admin privileges.

## 🛠 Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend & Database**: Supabase (PostgreSQL, Auth, Storage)
- **Email Service**: Resend (via Vercel Serverless Functions)
- **Hosting**: Vercel

## 📦 Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Resend account (for email functionality)
- Vercel CLI (optional, for local API testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/icpc-registry.git
   cd icpc-registry
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```bash
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   RESEND_API_KEY=your_resend_api_key
   ```

4. **Database Migration**
   Apply the SQL migrations found in `supabase/migrations` to your Supabase project using the SQL Editor or Supabase CLI.

5. **Run Locally**
   
   To run the frontend only:
   ```bash
   npm run dev
   ```
   
   To run with backend API functions (email service):
   ```bash
   npm run dev:vercel
   ```

## 🚢 Deployment

This project is optimized for deployment on **Vercel**.

1. Push your code to a Git repository.
2. Import the project into Vercel.
3. Add the environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `RESEND_API_KEY`) in the Vercel project settings.
4. Deploy!

## 📄 License

MIT License
