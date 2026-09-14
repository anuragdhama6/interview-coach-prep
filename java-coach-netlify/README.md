# ☕ Java Interview Coach — Netlify Deploy Guide

## What This Does
Hosts your Java interview chatbot on a free public URL.
Anyone can open it and use it — no login, no signup, no API key needed from users.
Your Groq API key stays hidden on the server.

---

## Deploy in 10 Minutes

### Step 1 — Get Free Groq API Key (2 mins)
1. Go to https://console.groq.com
2. Sign up free — no credit card needed
3. Click **API Keys** → **Create API Key**
4. Copy the key (starts with `gsk_...`)

### Step 2 — Push to GitHub (3 mins)
1. Go to https://github.com → Sign up/in free
2. Click **New repository**
3. Name: `java-interview-coach`
4. Click **Create repository**
5. Upload ALL files from this ZIP into the repo
   (drag and drop on GitHub web UI — upload all folders too)

### Step 3 — Deploy on Netlify (5 mins)
1. Go to https://netlify.com → Sign up with GitHub (free)
2. Click **Add new site** → **Import an existing project**
3. Choose **GitHub** → select `java-interview-coach` repo
4. Build settings:
   - Build command: (leave empty)
   - Publish directory: `public`
5. Click **Deploy site**
6. Go to **Site settings** → **Environment variables** → **Add variable**:
   - Key: `GROQ_API_KEY`
   - Value: your key from Step 1
7. Go to **Deploys** → **Trigger deploy** → **Deploy site**

### Step 4 — Get Your URL
Netlify gives you a URL like:
```
https://java-interview-coach.netlify.app
```
Share this with anyone. They open it and start using it immediately.
No login. No signup. Completely free.

---

## File Structure
```
java-interview-coach/
├── public/
│   └── index.html          ← full chatbot UI
├── netlify/
│   └── functions/
│       └── chat.js         ← serverless function (hides your API key)
├── netlify.toml            ← Netlify config
└── README.md               ← this file
```

## Customise Your URL
In Netlify → Site settings → Site information → Change site name
e.g. `java-interview-coach` → `https://java-interview-coach.netlify.app`

## Free Tier Limits
- Groq: 14,400 requests/day — more than enough
- Netlify: 125,000 function calls/month — handles hundreds of users daily
- Both: completely free, no credit card

## Sharing
Just share the Netlify URL. Works on mobile and desktop.
