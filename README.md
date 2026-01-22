# tension-lab

## Setup

### 1. Stripe Products
1. Create Stripe products and copy the Price IDs (starts with `price_`).
2. Update the `data-price-id` values in `store.html`.
3. If you have a Stripe Shipping Rate, copy its ID (starts with `shr_`).

### 2. Local Development

**Option A: Express Server (for testing)**
1. Copy `server/env.sample` to `server/.env` and fill in values.
2. Install and run:
   ```bash
   cd server
   npm install
   npm start
   ```
3. Open `store.html` from a local server (e.g., `python3 -m http.server 5500`).

**Option B: Netlify Dev (recommended)**
1. Install Netlify CLI: `npm install -g netlify-cli`
2. Install function dependencies:
   ```bash
   cd netlify/functions
   npm install
   ```
3. Create `.env` file in project root with:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   CLIENT_URL=http://localhost:8888
   SHIPPING_RATE_ID=shr_...
   ALLOWED_PRICE_IDS=price_1...,price_2...
   ```
4. Run: `netlify dev`
5. Site will be available at `http://localhost:8888`

### 3. Deploy to Netlify

#### Method 1: Netlify Dashboard (Easiest)

1. **Push your code to GitHub** (if not already)

2. **Go to [Netlify](https://app.netlify.com)** and sign in

3. **Add new site** → **Import an existing project** → Select your GitHub repo

4. **Build settings** (usually auto-detected):
   - Build command: (leave empty - static site)
   - Publish directory: `.` (root)

5. **Environment variables** (Site settings → Environment variables):
   - `STRIPE_SECRET_KEY` = `sk_live_YOUR_KEY`
   - `CLIENT_URL` = `https://your-site-name.netlify.app`
   - `SHIPPING_RATE_ID` = `shr_YOUR_SHIPPING_RATE_ID`
   - `ALLOWED_PRICE_IDS` = `price_1...,price_2...` (optional, comma-separated)

6. **Deploy site** → Click "Deploy site"

7. **Install function dependencies**:
   - Go to **Site settings** → **Functions**
   - Or add a build command: `cd netlify/functions && npm install`

#### Method 2: Netlify CLI

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login**:
   ```bash
   netlify login
   ```

3. **Initialize site**:
   ```bash
   netlify init
   ```

4. **Set environment variables**:
   ```bash
   netlify env:set STRIPE_SECRET_KEY "sk_live_YOUR_KEY"
   netlify env:set CLIENT_URL "https://your-site-name.netlify.app"
   netlify env:set SHIPPING_RATE_ID "shr_YOUR_SHIPPING_RATE_ID"
   netlify env:set ALLOWED_PRICE_IDS "price_1...,price_2..."
   ```

5. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

Your site will be live at `https://your-site-name.netlify.app` (or your custom domain).

## Environment Variables

### Local Development
Create `.env` file in project root:
- `STRIPE_SECRET_KEY`
- `CLIENT_URL` (e.g., `http://localhost:8888`)
- `SHIPPING_RATE_ID`
- `ALLOWED_PRICE_IDS` (comma-separated, optional)

### Netlify (Production)
Set in Netlify Dashboard: **Site settings → Environment variables**
- `STRIPE_SECRET_KEY`
- `CLIENT_URL` (your Netlify site URL)
- `SHIPPING_RATE_ID`
- `ALLOWED_PRICE_IDS` (comma-separated, optional)