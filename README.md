# PTC Arena Slides

Automatically create Google Slides presentations from Arena PLM content using AI-powered summarization.

## Overview

PTC Arena Slides is a Google Apps Script add-on that integrates Arena PLM with Google Slides, allowing you to:

- 🔍 **Search Arena** for Items, Changes (ECOs), or Quality Records
- 🤖 **AI-Powered Summaries** using Google's Gemini AI to generate concise slide content
- 📊 **Automatic Slide Generation** directly in Google Slides
- ⚙️ **Configurable Settings** for personalized AI detail levels and slide templates

## Features

### Arena Integration
- Secure authentication with Arena PLM REST API
- Search by item number, name, or description
- Support for Items, Changes, and Quality Records
- Automatic session management and re-authentication

### AI-Powered Content
- Integration with Google Gemini AI for intelligent summarization
- Three detail levels: Brief, Medium, and Detailed
- Automatic extraction of key information from Arena items
- Fallback to basic summaries when AI is not configured

### Google Slides Integration
- Seamless integration with Google Slides
- Multiple slide template options
- Speaker notes generation with detailed information
- Batch slide creation from multiple Arena items

## Prerequisites

- Google Account with access to Google Slides
- Arena PLM account with API access
- Arena Workspace ID
- (Optional) Google Gemini API key for AI-powered summaries

## Installation

### 1. Set Up Google Apps Script Project

1. Create a new Google Slides presentation or open an existing one
2. Go to **Extensions > Apps Script**
3. Install clasp (Google's Apps Script CLI):
   ```bash
   npm install -g @google/clasp
   ```

### 2. Clone and Deploy

1. Clone this repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/PTC-Arena-Slides.git
   cd PTC-Arena-Slides
   ```

2. Login to clasp:
   ```bash
   clasp login
   ```

3. Create a new Apps Script project or link to existing:
   ```bash
   clasp create --type slides --title "Arena Slides"
   ```

   Or link to an existing script:
   ```bash
   # Get script ID from your Google Slides: Extensions > Apps Script > Settings
   # Copy .clasp.json.example to .clasp.json and add your script ID
   cp .clasp.json.example .clasp.json
   # Edit .clasp.json and replace YOUR_SCRIPT_ID_HERE with your actual script ID
   ```

4. Push the code to Google Apps Script:
   ```bash
   clasp push
   ```

5. Open the script in your browser:
   ```bash
   clasp open
   ```

### 3. Enable Required APIs

In the Apps Script editor:
1. Click on **Project Settings** (gear icon)
2. Scroll to **Google Cloud Platform (GCP) Project**
3. Click on the project number to open GCP Console
4. Enable the following APIs:
   - Google Slides API
   - (Already enabled by default)

## Configuration

### Arena PLM Setup

1. Open your Google Slides presentation
2. Go to **Arena Slides > Login to Arena**
3. Enter your credentials:
   - **Email**: Your Arena account email
   - **Password**: Your Arena account password
   - **Workspace ID**: Your Arena workspace identifier (numeric)

   > **Note**: Your Workspace ID can be found in Arena's settings or URL when logged in

### Gemini AI Setup (Optional but Recommended)

1. Get a free Gemini API key:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Click **Create API Key**
   - Copy the generated key

2. Configure in Arena Slides:
   - Go to **Arena Slides > Settings**
   - Paste your API key in the **Gemini API Key** field
   - Select your preferred **AI Detail Level**
   - Click **Save Settings**

> **Note**: Without a Gemini API key, the add-on will use basic summaries instead of AI-generated content.

## Usage

### Quick Start

1. **Login to Arena**
   - Open your presentation
   - Go to **Arena Slides > Login to Arena**
   - Enter your credentials

2. **Search for Items**
   - Go to **Arena Slides > Search Arena Items**
   - Enter a search term (item number, name, or description)
   - Select search type (Items, Changes, or Quality)
   - Click **Search**

3. **Generate Slides**
   - Select one or more items from the search results
   - Click **Generate Slides**
   - New slides will be automatically created with AI-generated content

### Settings

Access settings via **Arena Slides > Settings**:

- **Gemini API Key**: Your Google Gemini API key for AI summaries
- **AI Detail Level**:
  - **Brief**: 3-5 bullet points
  - **Medium**: 5-7 bullet points (recommended)
  - **Detailed**: 7-10 bullet points
- **Default Slide Template**: Layout for generated slides
  - Title and Body (default)
  - Title Only
  - Section Header
  - Two Columns

## Project Structure

```
PTC-Arena-Slides/
├── src/
│   ├── Code.gs                 # Main entry point and menu
│   ├── ArenaAPI.gs             # Arena PLM API integration
│   ├── Settings.gs             # Settings and credential management
│   ├── GeminiAI.gs             # Gemini AI integration
│   ├── LoginDialog.html        # Login UI
│   ├── SearchDialog.html       # Search and selection UI
│   ├── SettingsDialog.html     # Settings UI
│   └── appsscript.json         # Apps Script manifest
├── Docs/
│   ├── Google-and-Arena-working-together.md  # Arena API guide
│   └── LESSONS_LEARNED.md                     # Development lessons
├── .gitignore
├── .clasp.json.example         # Clasp configuration template
└── README.md                   # This file
```

## API Documentation

### Arena API

The project uses Arena PLM's REST API v1. Key endpoints:

- `POST /v1/login` - Authentication
- `GET /v1/items` - List/search items
- `GET /v1/items/{guid}` - Get item details
- `GET /v1/changes` - List changes (ECOs)
- `GET /v1/quality` - List quality records

See [Arena API Documentation](https://developer.arenasolutions.com/) for more details.

### Gemini API

Uses Google's Gemini Pro model for content generation:

- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`
- See [Gemini API Documentation](https://ai.google.dev/docs) for more details

## Security

- **Credentials Storage**: All credentials are stored securely using Google Apps Script's `PropertiesService`
- **User-Specific**: Credentials are stored per-user, never shared across users
- **No Hardcoding**: Never commit credentials or API keys to version control
- **Session Management**: Arena sessions are automatically refreshed when expired

## Troubleshooting

### Login Issues

**Problem**: "Login failed: Invalid credentials"
- **Solution**: Verify your email, password, and workspace ID are correct
- Check that your Arena account has API access enabled

**Problem**: "Session expired"
- **Solution**: The add-on will automatically attempt to re-login, but you may need to login again manually

### Search Issues

**Problem**: "No results found"
- **Solution**: Try broader search terms or check the search type (Items vs Changes vs Quality)

**Problem**: Search takes a long time
- **Solution**: Arena API can be slow with large datasets. Be patient, especially on first search.

### AI Summary Issues

**Problem**: Getting basic summaries instead of AI-generated content
- **Solution**: Verify your Gemini API key is configured in Settings

**Problem**: "Gemini API error"
- **Solution**: Check that your API key is valid and has not exceeded quota limits

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development

### Local Development

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/PTC-Arena-Slides.git
cd PTC-Arena-Slides

# Install clasp
npm install -g @google/clasp

# Login to Google
clasp login

# Link to your script
cp .clasp.json.example .clasp.json
# Edit .clasp.json with your script ID

# Push changes
clasp push

# Open in browser
clasp open
```

### Deployment

```bash
# Push code to Apps Script
clasp push

# Create a new version
clasp deploy
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Google Apps Script](https://developers.google.com/apps-script)
- Powered by [Google Gemini AI](https://ai.google.dev/)
- Integrates with [Arena PLM](https://www.arenasolutions.com/)
- Created with [Claude Code](https://claude.com/claude-code)

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact your organization's Arena administrator for Arena-specific questions
- Visit [Google AI Studio](https://makersuite.google.com/) for Gemini API support

---

**Version**: 1.0.0
**Last Updated**: January 2026
