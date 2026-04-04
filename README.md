# 🛍️ Buy237 — Cameroon E-Commerce Platform
### Complete Full-Stack Application | v3.0 Final

> Mobile-first e-commerce for Cameroon: MTN MoMo, Orange Money, Visual Search, Voice Search, In-App Chat, Wishlist.

---

## 📁 Project Structure (53 files)

```
buy237/
├── backend/
│   ├── package.json          ← Dependencies (Express, pg, multer, nodemailer, sharp, helmet)
│   ├── .env.example          ← All environment variables documented
│   ├── schema.sql            ← Full PostgreSQL schema (15+ tables, triggers, indexes)
│   └── src/
│       ├── index.js          ← Server (Helmet + Rate limiting + CORS)
│       ├── db/index.js       ← PostgreSQL connection pool
│       ├── middleware/
│       │   ├── auth.js       ← JWT + role-based guards
│       │   └── upload.js     ← Multer image upload (5MB max, 5 images)
│       ├── services/
│       │   ├── emailService.js      ← Nodemailer (welcome, reset, order, status emails)
│       │   ├── paymentService.js    ← MTN MoMo + Orange Money API
│       │   └── visualSearchService.js ← Google Vision / HuggingFace / tag fallback
│       ├── controllers/
│       │   ├── authController.js    ← Register, login, forgot/reset password
│       │   ├── productController.js ← CRUD + auto visual indexing on upload
│       │   ├── cartController.js    ← Persistent cart per user
│       │   ├── orderController.js   ← Checkout, tracking, status updates
│       │   ├── vendorController.js  ← Shop management + dashboard analytics
│       │   ├── addressController.js ← Landmark-based addresses + delivery zones
│       │   ├── paymentController.js ← MoMo initiate, status check, webhooks
│       │   ├── uploadController.js  ← Image upload/delete endpoints
│       │   ├── searchController.js  ← Visual search + product indexing + analytics
│       │   └── chatController.js    ← In-app messaging (buyer ↔ vendor)
│       ├── routes/index.js   ← 50+ REST API endpoints
│       └── utils/seed.js     ← Database seeder (admin + vendors + 15 products)
│
└── frontend/
    ├── package.json
    ├── .env.example
    ├── public/index.html
    └── src/
        ├── App.jsx           ← Router (17 routes)
        ├── index.js
        ├── context/AppContext.jsx    ← Global auth + cart + notifications
        ├── utils/api.js              ← authAPI, productAPI, cartAPI, orderAPI,
        │                              vendorAPI, addressAPI, paymentAPI,
        │                              uploadAPI, chatAPI, searchAPI
        ├── styles/global.css         ← Complete design system (CSS variables)
        ├── hooks/
        │   └── useVoiceSearch.js     ← Web Speech API hook (EN + FR)
        ├── components/
        │   ├── layout/
        │   │   ├── Header.jsx        ← Search bar + 🎤 Voice + 📷 Visual + account menu
        │   │   └── BottomNav.jsx     ← Mobile: Home, Search, Cart, ❤️ Wishlist, Account
        │   └── common/
        │       ├── ProductCard.jsx   ← Card + wishlist button + skeleton
        │       ├── WishlistButton.jsx ← ❤️ Heart button component
        │       ├── VisualSearchModal.jsx ← Photo search modal (camera + gallery)
        │       └── Notification.jsx  ← Toast notifications
        └── pages/
            ├── HomePage.jsx          ← Banner carousel, categories, MoMo promo, products
            ├── SearchPage.jsx        ← Grid + filters + 🎤 voice strip + 📷 image button
            ├── ProductDetailPage.jsx ← Images, specs, ❤️ wishlist, 💬 chat, reviews
            ├── CartPage.jsx          ← Quantity controls, delivery fee, MoMo preview
            ├── CheckoutPage.jsx      ← 3-step: address → payment → confirm
            ├── OrdersPage.jsx        ← List + detail + status tracker
            ├── AuthPages.jsx         ← Login + Register + ForgotPassword
            ├── ResetPasswordPage.jsx ← Password reset via token link
            ├── AccountPage.jsx       ← Profile, addresses, security, settings
            ├── WishlistPage.jsx      ← Saved products (local storage)
            ├── VendorChatPage.jsx    ← WhatsApp-style buyer-vendor messaging
            ├── VendorDashboardPage.jsx ← Stats, products, orders, 💬 inbox
            ├── VendorRegisterPage.jsx  ← Shop creation
            ├── VendorPublicPage.jsx    ← Public shop page /vendor/:id
            └── AdminDashboardPage.jsx  ← Order management + product featuring
```

---

## ⚡ Quick Start

### 1. Database Setup (Supabase — free forever)
```bash
# Go to supabase.com → New Project → SQL Editor
# Paste the entire content of backend/schema.sql → Run
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env       # Fill in DATABASE_URL and JWT_SECRET
npm run dev                # http://localhost:5000
npm run seed               # Populate with sample data
```

### 3. Frontend
```bash
cd frontend
npm install
npm start                  # http://localhost:3000
```

---

## 🔑 Test Accounts (after `npm run seed`)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@buy237.cm | Admin@237 |
| Vendor 1 | techcm@buy237.cm | Vendor@237 |
| Vendor 2 | modecm@buy237.cm | Vendor@237 |
| Customer | customer@buy237.cm | Customer@237 |

---

## 🔍 Visual Search — How to Set Up

The visual search works in 3 modes, automatically:

### Mode 1: Google Cloud Vision (Best accuracy)
```env
GOOGLE_VISION_API_KEY=your_key_here
VISUAL_SEARCH_MODE=google
```
Get key: console.cloud.google.com → Enable Vision API → Create credentials

### Mode 2: Hugging Face CLIP (Free)
```env
HUGGINGFACE_API_TOKEN=hf_your_token_here
VISUAL_SEARCH_MODE=huggingface
```
Get token: huggingface.co/settings/tokens (free account)

### Mode 3: Tag fallback (Zero config, always works)
```env
VISUAL_SEARCH_MODE=tags_only
```
Works without any API key — uses image filenames and product tags.

**After adding products, index them for visual search:**
```
POST /api/search/index-all   (admin only, call once)
```

---

## 🎤 Voice Search — No Setup Needed

Uses the browser's built-in Web Speech API.
- **Zero cost, zero API key**
- Works in: Chrome, Edge, Samsung Browser (most Android phones in Cameroon)
- Languages: English (en-US) and French (fr-FR) — auto-switches with app language

---

## 💬 In-App Chat — No Setup Needed

- Messages stored in PostgreSQL (chats + chat_messages tables)
- Auto-reply system simulates vendor responses
- Accessible from every product page: "💬 Chat with Seller"
- Vendor inbox in dashboard: "💬 Inbox" tab
- Buyers can see all conversations at GET /api/chats

---

## 📡 All API Endpoints (50+)

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/me
PUT    /api/auth/profile
POST   /api/auth/change-password
```

### Products
```
GET    /api/products              ?category=&search=&min_price=&max_price=&sort=&page=
GET    /api/products/categories
GET    /api/products/:slug
POST   /api/products              (vendor)
PUT    /api/products/:id          (vendor)
DELETE /api/products/:id          (vendor)
POST   /api/products/:id/reviews
```

### Cart & Orders
```
GET/POST/PUT/DELETE  /api/cart, /api/cart/items/:id
POST   /api/orders/checkout
GET    /api/orders                (my orders)
GET    /api/orders/all            (admin)
GET    /api/orders/:id
PUT    /api/orders/:id/cancel
PUT    /api/orders/:id/status     (admin/vendor)
```

### Payments
```
POST   /api/payments/initiate
GET    /api/payments/status/:txId
POST   /api/payments/momo/callback     (MTN webhook)
POST   /api/payments/orange/callback   (Orange webhook)
```

### Visual Search
```
POST   /api/search/visual         (upload image → matching products)
POST   /api/search/index/:id      (vendor: index product images)
POST   /api/search/index-all      (admin: bulk index)
GET    /api/search/stats          (admin: analytics)
```

### Chat
```
GET    /api/chats                 (my conversations — buyer)
GET    /api/chats/vendor-inbox    (vendor: all buyer messages)
GET    /api/chats/:vendorId       (get or create conversation)
POST   /api/chats/:vendorId/messages  (send message)
```

### Vendor & Addresses
```
POST/GET/PUT  /api/vendors/register, /profile, /dashboard, /products
GET           /api/vendors/:id
GET/POST/PUT/DELETE  /api/addresses, /addresses/:id
GET           /api/delivery-zones
POST/DELETE   /api/upload/image, /upload/images, /upload/:filename
```

---

## 🌍 Key Differentiators vs Amazon/Jumia

| Feature | Buy237 | Amazon | Jumia |
|---------|--------|--------|-------|
| MTN MoMo (primary) | ✅ | ❌ | ❌ |
| Orange Money | ✅ | ❌ | ❌ |
| Cash on Delivery | ✅ | ❌ | ✅ |
| Visual Search | ✅ | ✅ | ❌ |
| Voice Search (FR+EN) | ✅ | Partial | ❌ |
| In-App Vendor Chat | ✅ | ❌ | ❌ |
| Landmark addresses | ✅ | ❌ | ❌ |
| FCFA currency | ✅ | ❌ | ❌ |
| Available in Cameroon | ✅ | ❌ | ❌ (left 2019) |
| Wishlist (offline) | ✅ | ✅ | ✅ |
| Bilingual FR/EN | ✅ | Partial | ✅ |

---

## 🚀 Deploy to Production

### Backend → Railway (free tier)
1. Push to GitHub
2. Connect Railway to repo
3. Set all env vars in Railway dashboard
4. Deploy — automatic

### Frontend → Vercel (free)
```bash
# Build command: npm run build
# Set env: REACT_APP_API_URL=https://your-railway-app.up.railway.app/api
```

### Database → Supabase (free, permanent)
Already set up in step 1. Copy the connection string to `DATABASE_URL`.

---

Built with ❤️ for Cameroon 🇨🇲 — Buy237 v3.0
