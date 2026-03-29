# TrustPool AI

AI-powered credit scoring platform for credit-invisible Indians using UPI transaction data.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/           # Design system atoms (Button, Card, Badge, etc.)
│   └── sections/     # Page sections (Hero, Navbar, Footer, etc.)
├── pages/            # Route pages
├── hooks/            # Custom React hooks
├── utils/            # Utilities and mock data
└── styles/           # Global CSS
```

## 🎨 Design System

- **Colors**: Navy-black backgrounds with electric blue accent
- **Typography**: Plus Jakarta Sans (display), Inter (body), JetBrains Mono (data)
- **Components**: Glassmorphism cards with blur effects

## 📱 Pages

1. **Landing** (`/`) - Marketing homepage
2. **Score Dashboard** (`/score`) - Trust Score visualization with SHAP explainability
3. **Lender Pool** (`/pool`) - Investment pool for retail lenders
4. **Ledger** (`/ledger`) - Blockchain-inspired reputation ledger
5. **Dashboard** (`/dashboard`) - User dashboard

## 🛠 Tech Stack

- React 18 + Vite
- Framer Motion (animations)
- Tailwind CSS
- Recharts
- React Router DOM v6
- Lucide Icons

## 🎯 Demo Flow

1. Visit `/` → Loading screen → Hero with 3D parallax card
2. Click "Get Your Score" → `/score`
3. Select profile → Watch score ring animate
4. Explore Pool and Ledger pages

---

Built for Hackathon 2025 🇮🇳
