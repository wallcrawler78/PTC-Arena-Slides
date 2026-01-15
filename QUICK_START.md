# Quick Start Guide - PTC Arena Slides

Get up and running with Arena Slides in 10 minutes!

## Prerequisites Check

Before starting, make sure you have:
- ✅ Google Account
- ✅ Arena PLM account with email, password, and Workspace ID
- ✅ Node.js installed (`node --version`)
- ✅ Git installed (`git --version`)

## 5-Minute Setup

### Step 1: Install Clasp (1 minute)

```bash
npm install -g @google/clasp
clasp login
```

### Step 2: Clone & Deploy (2 minutes)

```bash
# Clone the repository
git clone https://github.com/wallcrawler78/PTC-Arena-Slides.git
cd PTC-Arena-Slides

# Create new Google Apps Script project
clasp create --type slides --title "Arena Slides"

# Push code to Google
clasp push
```

### Step 3: Authorize (1 minute)

```bash
# Open the script in browser
clasp open
```

In the Apps Script editor:
1. Select `onOpen` function
2. Click **Run** (▶️)
3. Click **Review Permissions** → **Advanced** → **Go to Arena Slides**
4. Click **Allow**

### Step 4: Configure (1 minute)

Open your Google Slides presentation:
1. Refresh the page
2. Click **Arena Slides > Login to Arena**
3. Enter:
   - Email: your.email@company.com
   - Password: your Arena password
   - Workspace ID: [your workspace number]
4. Click **Login**

### Step 5: Create Your First Slide (30 seconds)

1. Click **Arena Slides > Search Arena Items**
2. Search for an item (e.g., enter an item number)
3. Select one or more results
4. Click **Generate Slides**

Done! 🎉

## Optional: Add Gemini AI (2 minutes)

For AI-powered summaries:

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **Create API Key**
3. Copy the key
4. In Google Slides: **Arena Slides > Settings**
5. Paste API key
6. Click **Save Settings**

Now your slides will have AI-generated content!

## Troubleshooting

### Menu doesn't appear
- Refresh the Google Slides page
- Make sure you completed Step 3 (authorization)

### Login fails
- Verify email, password, and Workspace ID
- Check with your Arena administrator

### Need more help?
- See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions
- See [README.md](README.md) for full documentation
- Open an issue on GitHub

## Next Steps

- Explore different search types (Items, Changes, Quality)
- Try different AI detail levels in Settings
- Customize slide templates
- Check out [ARCHITECTURE.md](Docs/ARCHITECTURE.md) to understand how it works

---

**Total Time**: ~10 minutes
**Difficulty**: Easy
**Result**: Fully functional Arena → Slides integration with AI!
