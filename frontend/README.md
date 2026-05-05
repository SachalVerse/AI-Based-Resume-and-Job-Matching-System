# AI Resume Builder

A professional, high-visibility dark-themed resume builder powered by **Next.js** and **Google Gemini AI**.

## 🚀 Features

- **Step-by-Step Workflow**: Guided navigation to build your resume section by section without overwhelming the screen.
- **AI-Powered Generation**: Instantly generate professional bullet points and headings using the Gemini API.
- **Real-Time PDF Preview**: View your resume as a professional PDF as you type.
- **Accessible Dark Design**: A clean, charcoal-themed interface with high-visibility placeholders and typography.
- **Dynamic Sections**: Add, remove, and reorder custom sections like Experience, Education, and Skills.

## 🛠️ Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add your Google Gemini API key:
   ```env
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Open Application**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 🎨 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4
- **AI Integration**: Google Generative AI (@google/generative-ai)
- **PDF Generation**: @react-pdf/renderer
- **Animations**: Framer Motion
- **Icons**: Lucide React