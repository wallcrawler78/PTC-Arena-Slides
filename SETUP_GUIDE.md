# Arena Slides - Complete Setup Guide

This guide walks you through the complete setup process for Arena Slides, from installation to your first generated slide.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Arena Configuration](#arena-configuration)
4. [Gemini AI Configuration](#gemini-ai-configuration)
5. [First Use](#first-use)
6. [Advanced Configuration](#advanced-configuration)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have:

- [ ] Google Account with access to Google Slides
- [ ] Arena PLM account with the following:
  - [ ] Email and password
  - [ ] Workspace ID (numeric identifier)
  - [ ] API access enabled (contact your Arena admin if unsure)
- [ ] Node.js installed (for clasp CLI)
- [ ] Git installed

## Initial Setup

### Step 1: Install Clasp

Clasp is Google's command-line tool for Apps Script:

```bash
npm install -g @google/clasp
```

Verify installation:
```bash
clasp --version
```

### Step 2: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/PTC-Arena-Slides.git
cd PTC-Arena-Slides
```

### Step 3: Login to Google

```bash
clasp login
```

This will open a browser window:
1. Select your Google account
2. Click **Allow** to grant clasp access
3. You should see "Logged in!" in your terminal

### Step 4: Create or Link Apps Script Project

**Option A: Create a New Project**

```bash
clasp create --type slides --title "Arena Slides"
```

This will:
- Create a new Google Slides presentation
- Create an Apps Script project attached to it
- Generate a `.clasp.json` file with the script ID

**Option B: Link to Existing Presentation**

If you want to use an existing Google Slides presentation:

1. Open your presentation
2. Go to **Extensions > Apps Script**
3. In the Apps Script editor, click **Project Settings** (gear icon)
4. Copy the **Script ID**
5. Create `.clasp.json`:
   ```bash
   cp .clasp.json.example .clasp.json
   ```
6. Edit `.clasp.json` and replace `YOUR_SCRIPT_ID_HERE` with your actual Script ID

### Step 5: Push Code to Apps Script

```bash
clasp push
```

If prompted "Manifest file has been updated. Do you want to push and overwrite?", type **`y`** and press Enter.

### Step 6: Open in Browser

```bash
clasp open
```

This opens the Apps Script editor. You should see all the `.gs` and `.html` files.

### Step 7: First Run Authorization

1. In the Apps Script editor, select **Code.gs**
2. Select the `onOpen` function from the dropdown
3. Click **Run** (▶️ button)
4. Click **Review Permissions**
5. Choose your Google account
6. Click **Advanced** > **Go to Arena Slides (unsafe)**
   - This is safe - it's your own code
7. Click **Allow**

### Step 8: Test in Google Slides

1. Return to your Google Slides presentation
2. Refresh the page
3. You should see a new menu: **Arena Slides**

Congratulations! The installation is complete!

## Arena Configuration

### Finding Your Workspace ID

**Method 1: From Arena URL**
1. Login to Arena PLM
2. Look at the URL in your browser
3. The Workspace ID is the number in the URL:
   ```
   https://app.bom.com/WORKSPACE_ID/...
   ```

**Method 2: From Arena Settings**
1. Login to Arena PLM
2. Go to **Settings**
3. Look for **Workspace Information** or **Account Settings**
4. The Workspace ID should be listed there

**Method 3: Ask Your Arena Administrator**
- Your IT or PLM administrator can provide the Workspace ID

### First Login

1. In Google Slides, click **Arena Slides > Login to Arena**
2. Enter your information:
   - **Email**: your.email@company.com
   - **Password**: Your Arena password
   - **Workspace ID**: The numeric ID from above
3. Click **Login**
4. You should see "Successfully logged in to Arena"

### Verify Login

1. Click **Arena Slides > Settings**
2. Under "Arena Connection", you should see:
   - Status: **Connected** (green)
   - Your email address
   - Your workspace ID

## Gemini AI Configuration

Arena Slides can generate AI-powered summaries using Google's Gemini API. This is optional but highly recommended.

### Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Choose **Create API key in new project** (or select existing project)
5. Copy the generated API key
   - It looks like: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXX`

### Configure in Arena Slides

1. In Google Slides, click **Arena Slides > Settings**
2. Under "Gemini AI Configuration":
   - Paste your API key in the **Gemini API Key** field
   - Select your preferred **AI Detail Level**:
     - **Brief**: 3-5 bullet points (good for overview slides)
     - **Medium**: 5-7 bullet points (recommended)
     - **Detailed**: 7-10 bullet points (comprehensive)
3. Click **Save Settings**

### Without Gemini API

If you don't configure a Gemini API key, Arena Slides will still work! It will generate basic summaries using the Arena item data directly, without AI enhancement.

## First Use

Let's create your first slide!

### Step 1: Search for an Item

1. Click **Arena Slides > Search Arena Items**
2. In the search dialog:
   - Enter a search term (e.g., part number, name, or description)
   - Select **Items** from the dropdown (or Changes/Quality)
   - Click **Search**

### Step 2: Select Items

1. Review the search results
2. Click on one or more items to select them
   - Selected items will be highlighted in blue
   - You can select multiple items
3. The bottom of the dialog shows "X items selected"

### Step 3: Generate Slides

1. Click **Generate Slides**
2. Wait for processing (may take 10-30 seconds per item)
3. New slides will be automatically added to your presentation!

### Step 4: Review Generated Slides

Each generated slide includes:
- **Title**: Item number and name
- **Body**: AI-generated summary (or basic summary)
- **Speaker Notes**: Detailed information about the item

## Advanced Configuration

### Slide Templates

Change the default slide template in **Settings**:

- **Title and Body**: Standard slide with title and content area (default)
- **Title Only**: Just a title, useful for section headers
- **Section Header**: Large title slide for breaking up presentations
- **Two Columns**: Split content into two columns

### AI Detail Levels

Adjust how much detail the AI includes:

- **Brief (3-5 bullets)**: Best for high-level overviews or executive summaries
- **Medium (5-7 bullets)**: Balanced detail, good for most presentations
- **Detailed (7-10 bullets)**: Comprehensive information, best for technical reviews

### Customizing the Code

The code is organized into modules:

- **Code.gs**: Main entry point, menu creation
- **ArenaAPI.gs**: Arena API integration
- **Settings.gs**: Credential and settings management
- **GeminiAI.gs**: AI integration
- **HTML files**: User interface dialogs

To customize:
1. Make changes in the Apps Script editor
2. Save (Ctrl+S / Cmd+S)
3. Refresh your Google Slides presentation

Or using clasp:
1. Edit files locally
2. Run `clasp push`
3. Refresh your Google Slides presentation

## Troubleshooting

### "Menu doesn't appear"

**Solution**:
1. Refresh the Google Slides page
2. Make sure you authorized the script (see Step 7 of Initial Setup)
3. Try running `onOpen()` manually in the Apps Script editor

### "Not Logged In" error

**Solution**:
1. Click **Arena Slides > Login to Arena**
2. Re-enter your credentials
3. Verify your email, password, and workspace ID are correct

### "Session expired" error

**Solution**:
- Arena sessions expire after ~6 hours
- Simply login again via **Arena Slides > Login to Arena**

### "No results found"

**Possible causes**:
1. Search term doesn't match any items
   - Try broader search terms
   - Try searching just the item number
2. Wrong search type selected
   - Make sure "Items" is selected if searching for items
3. API access issues
   - Contact your Arena administrator

### "Gemini API error"

**Possible causes**:
1. Invalid API key
   - Verify the key in Settings
   - Generate a new key if needed
2. API quota exceeded
   - Free tier has limits (60 requests per minute)
   - Wait and try again, or upgrade your Gemini plan
3. Network issues
   - Check your internet connection

### Slides not generating

**Check**:
1. Open **Apps Script editor** (clasp open)
2. Click **Executions** (left sidebar, clock icon)
3. Look for errors in recent executions
4. Check the logs for detailed error messages

### Need More Help?

1. Check the logs:
   ```bash
   clasp logs
   ```
2. Review error messages in Apps Script **Executions**
3. Open an issue on GitHub with:
   - Steps to reproduce
   - Error messages
   - Screenshot if applicable

## Next Steps

Now that you're set up:

1. **Explore Search Options**
   - Try searching for Changes (ECOs)
   - Try searching for Quality Records
   - Use different search terms

2. **Experiment with Settings**
   - Try different AI detail levels
   - Try different slide templates

3. **Customize**
   - Modify the code to fit your workflow
   - Add custom fields from Arena
   - Adjust the AI prompts

4. **Share**
   - Share your presentation with colleagues
   - They can use the same Arena Slides menu if they have Arena access

---

**Happy Presenting!** 🎉

If you have questions or run into issues, refer to the [README](README.md) or open an issue on GitHub.
