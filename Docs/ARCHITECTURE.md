# Arena Slides - Architecture Documentation

This document provides a technical overview of the Arena Slides application architecture, design decisions, and implementation details.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Component Design](#component-design)
4. [Data Flow](#data-flow)
5. [Security Architecture](#security-architecture)
6. [API Integration](#api-integration)
7. [Error Handling](#error-handling)
8. [Performance Considerations](#performance-considerations)

## System Overview

Arena Slides is a Google Apps Script add-on that bridges three services:

1. **Arena PLM** - Source of product/item data
2. **Google Gemini AI** - Content summarization and generation
3. **Google Slides** - Presentation creation and management

### Technology Stack

- **Runtime**: Google Apps Script (V8)
- **Language**: JavaScript (ES6+)
- **UI Framework**: HTML5 + CSS3 (sandboxed)
- **APIs**:
  - Arena REST API v1
  - Google Gemini API (generativelanguage.googleapis.com)
  - Google Slides API (via Apps Script built-in service)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Google Slides (Client)                   │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Custom    │  │  Search UI   │  │   Settings UI    │  │
│  │    Menu     │  │   (HTML)     │  │     (HTML)       │  │
│  └──────┬──────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                │                    │             │
└─────────┼────────────────┼────────────────────┼─────────────┘
          │                │                    │
          ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│              Google Apps Script (Server)                    │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    Code.gs                           │  │
│  │  • onOpen() - Menu creation                          │  │
│  │  • showXXXDialog() - UI controllers                  │  │
│  │  • generateSlidesFromArenaItems() - Main workflow    │  │
│  └───────┬──────────────────────────────────────────────┘  │
│          │                                                  │
│  ┌───────┴──────────┬──────────────┬──────────────────┐    │
│  │                  │              │                  │    │
│  ▼                  ▼              ▼                  ▼    │
│ ┌──────────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐    │
│ │ ArenaAPI │  │Settings │  │ GeminiAI │  │  Slides  │    │
│ │   .gs    │  │  .gs    │  │   .gs    │  │   API    │    │
│ └────┬─────┘  └────┬────┘  └────┬─────┘  └────┬─────┘    │
│      │             │            │             │            │
└──────┼─────────────┼────────────┼─────────────┼────────────┘
       │             │            │             │
       ▼             ▼            ▼             ▼
┌──────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐
│  Arena   │  │Properties│  │ Gemini  │  │  Google  │
│ PLM API  │  │ Service  │  │   API   │  │  Slides  │
│          │  │ (Storage)│  │         │  │   Doc    │
└──────────┘  └──────────┘  └─────────┘  └──────────┘
```

## Component Design

### 1. Code.gs - Main Controller

**Responsibilities**:
- Menu creation and UI initialization
- Workflow orchestration
- Dialog management
- Slide generation coordination

**Key Functions**:

```javascript
onOpen()                           // Creates custom menu on presentation open
showSearchDialog()                 // Displays search UI
showSettingsDialog()               // Displays settings UI
showLoginDialog()                  // Displays login UI
generateSlidesFromArenaItems()     // Main workflow: Arena → AI → Slides
createSlideWithContent()           // Creates individual slides
```

**Design Pattern**: Controller pattern - coordinates between UI, data, and business logic

### 2. ArenaAPI.gs - Arena Integration Layer

**Responsibilities**:
- Arena API authentication
- HTTP request/response handling
- Data retrieval and search
- Session management

**Key Components**:

```javascript
ArenaAPIClient                     // Main API client class
├─ makeRequest()                   // Generic API request handler
├─ getAllItems()                   // Fetch items with pagination
├─ getItem(guid)                   // Get single item details
├─ findItemByNumber()              // Search by item number
├─ searchItems()                   // Full-text search
└─ getChanges() / getQualityRecords()  // Specialized retrievers

loginToArena()                     // Authentication function
```

**Design Patterns**:
- **Client class**: Encapsulates API communication
- **Retry logic**: Auto re-login on session expiration
- **Defensive programming**: Handles both response formats (results/Results)

**Authentication Flow**:

```
1. User enters credentials
2. POST /v1/login with email, password, workspaceId
3. Receive arenaSessionId
4. Store in PropertiesService
5. Include in all subsequent requests as header
6. On 401, attempt re-login
```

### 3. Settings.gs - Configuration Management

**Responsibilities**:
- Secure credential storage
- Settings persistence
- Session validation
- User preference management

**Storage Architecture**:

```javascript
PropertiesService.getUserProperties()
├─ arena_email              // User's Arena email
├─ arena_session_id         // Active session ID
├─ arena_workspace_id       // Workspace identifier
├─ gemini_api_key          // Gemini API key
├─ slide_template_preference // Default template
└─ ai_detail_level         // AI verbosity setting
```

**Key Functions**:

```javascript
saveArenaCredentials()     // Store login credentials
getArenaSessionId()        // Retrieve session
isArenaSessionValid()      // Validate session
saveGeminiApiKey()         // Store API key
getAppSettings()           // Load all settings
```

**Security Features**:
- User-scoped storage (not shared across users)
- No password storage (only session ID)
- API keys stored securely in Properties Service
- Automatic session cleanup on logout

### 4. GeminiAI.gs - AI Integration Layer

**Responsibilities**:
- Content preparation for AI
- Gemini API communication
- Prompt engineering
- Response parsing
- Fallback handling

**Processing Pipeline**:

```
Arena Item Data
    ↓
prepareItemContentForAI()      // Format for AI consumption
    ↓
generatePrompt()               // Create detail-level-specific prompt
    ↓
callGeminiAPI()                // Send to Gemini
    ↓
parseSummaryResponse()         // Extract main content & notes
    ↓
Return {mainContent, detailedNotes}
```

**Prompt Engineering**:

The system uses different prompts based on detail level:

- **Brief**: "Create a concise, bullet-point summary (3-5 bullets)..."
- **Medium**: "Create a clear summary with key points (5-7 bullets)..."
- **Detailed**: "Create a comprehensive summary (7-10 points)..."

**Fallback Strategy**:

```
Try Gemini API
  ↓
If fails or no API key
  ↓
generateBasicSummary()         // Use Arena data directly
```

### 5. HTML UI Components

**Architecture**: Client-Server Model

#### LoginDialog.html

**Features**:
- Form validation
- Asynchronous login
- Loading states
- Error display

**Communication**:
```javascript
Client (HTML)                  Server (Code.gs)
     │                               │
     ├──── google.script.run ───────▶│
     │     loginToArena()            │
     │                               │
     │◀──── Success/Failure ─────────┤
     │     {success, message}        │
```

#### SearchDialog.html

**Features**:
- Real-time search
- Multi-select results
- Result preview
- Batch operations

**State Management**:
```javascript
var searchResults = [];         // All results from server
var selectedItems = new Set();  // Currently selected indices
```

#### SettingsDialog.html

**Features**:
- Multi-section configuration
- Real-time status display
- Preference management
- Validation

## Data Flow

### Complete Slide Generation Flow

```
1. USER ACTION
   └─ Click "Search Arena Items"

2. SEARCH PHASE
   Client: SearchDialog.html
   └─ User enters search term
   └─ Clicks "Search"
   └─ google.script.run.searchArena(term, type)

   Server: ArenaAPI.gs
   └─ ArenaAPIClient.searchItems()
   └─ Returns results[]

   Client: SearchDialog.html
   └─ Display results
   └─ User selects items
   └─ Clicks "Generate Slides"

3. GENERATION PHASE
   Client: SearchDialog.html
   └─ google.script.run.generateSlidesFromArenaItems(selected)

   Server: Code.gs
   └─ For each selected item:
       ├─ getArenaItemDetails(guid)     [ArenaAPI.gs]
       ├─ generateAISummary(details)    [GeminiAI.gs]
       │   ├─ prepareItemContentForAI()
       │   ├─ generatePrompt()
       │   ├─ callGeminiAPI()           [External: Gemini]
       │   └─ parseSummaryResponse()
       └─ createSlideWithContent()      [Code.gs]
           └─ SlidesApp.appendSlide()   [Built-in API]

4. COMPLETION
   Server: Code.gs
   └─ Return {success: true, message: "..."}

   Client: SearchDialog.html
   └─ Display success message
   └─ Close dialog
```

## Security Architecture

### Credential Storage

**PropertiesService Layers**:

```
PropertiesService
├─ getUserProperties()           // User-scoped (recommended)
│  └─ Isolated per user
│  └─ Not shared across users
│  └─ Persists across sessions
│
├─ getScriptProperties()         // Script-scoped (not used)
│  └─ Shared across all users
│  └─ Not suitable for credentials
│
└─ getDocumentProperties()       // Document-scoped (not used)
   └─ Shared with document
   └─ Not suitable for credentials
```

**What We Store**:
- ✅ Arena session ID (temporary, expires)
- ✅ Arena email (non-sensitive)
- ✅ Workspace ID (non-sensitive)
- ✅ Gemini API key (encrypted by Google)
- ❌ Passwords (NEVER stored)

### API Communication

**Arena API**:
- HTTPS only
- Session-based auth
- Headers: `arena_session_id`
- Auto re-login on 401

**Gemini API**:
- HTTPS only
- API key in URL parameter
- Rate-limited by Google
- Free tier quotas apply

### OAuth Scopes

Required scopes (defined in `appsscript.json`):

```json
{
  "oauthScopes": [
    "https://www.googleapis.com/auth/presentations",         // Slides access
    "https://www.googleapis.com/auth/script.external_request", // API calls
    "https://www.googleapis.com/auth/userinfo.email",        // User identity
    "https://www.googleapis.com/auth/script.container.ui"    // UI dialogs
  ]
}
```

## API Integration

### Arena API

**Base URL**: `https://api.arenasolutions.com/v1`

**Key Endpoints**:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/login` | Authenticate user |
| GET | `/items` | List all items |
| GET | `/items/{guid}` | Get item details |
| GET | `/changes` | List changes (ECOs) |
| GET | `/quality` | List quality records |

**Response Handling**:

Arena API inconsistently uses capitalization:
```javascript
// Handle both formats
var results = response.results || response.Results || [];
var guid = item.guid || item.Guid;
var name = item.name || item.Name;
```

**Pagination**:

```javascript
var limit = 400;  // Arena's max
var offset = 0;

while (true) {
  var endpoint = '/items?limit=' + limit + '&offset=' + offset;
  var response = makeRequest(endpoint);
  var items = response.results || [];

  allItems = allItems.concat(items);

  if (items.length < limit) break;
  offset += limit;
}
```

### Gemini API

**Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`

**Request Format**:

```json
{
  "contents": [{
    "parts": [{
      "text": "Your prompt here..."
    }]
  }]
}
```

**Response Format**:

```json
{
  "candidates": [{
    "content": {
      "parts": [{
        "text": "AI generated response..."
      }]
    }
  }]
}
```

## Error Handling

### Error Handling Strategy

**Levels**:

1. **API Level** (ArenaAPI.gs, GeminiAI.gs)
   - Catch HTTP errors
   - Log technical details
   - Throw user-friendly errors

2. **Controller Level** (Code.gs)
   - Try-catch around workflows
   - Log errors with context
   - Return {success: false, message: "..."}

3. **UI Level** (HTML)
   - Display error messages
   - Re-enable UI controls
   - Provide actionable guidance

**Example**:

```javascript
// API Level
function makeRequest(endpoint, options) {
  try {
    var response = UrlFetchApp.fetch(url, options);
    if (responseCode !== 200) {
      throw new Error('API error ' + responseCode);
    }
    return JSON.parse(response.getContentText());
  } catch (error) {
    Logger.log('Arena API error: ' + error.message);
    throw new Error('Failed to connect to Arena: ' + error.message);
  }
}

// Controller Level
function generateSlidesFromArenaItems(selectedItems) {
  try {
    // ... workflow
    return {success: true, message: "Created " + count + " slides"};
  } catch (error) {
    Logger.log('Error generating slides: ' + error.message);
    Logger.log('Stack: ' + error.stack);
    return {success: false, message: 'Error: ' + error.message};
  }
}

// UI Level (HTML)
google.script.run
  .withSuccessHandler(function(result) {
    if (result.success) {
      alert(result.message);
    } else {
      alert('Error: ' + result.message);
    }
  })
  .withFailureHandler(function(error) {
    alert('Error: ' + error.message);
  })
  .generateSlidesFromArenaItems(items);
```

## Performance Considerations

### Bottlenecks

1. **Arena API Calls**
   - Slow (500ms - 2s per request)
   - Solution: Pagination, batch operations

2. **Gemini API Calls**
   - Variable (1-5s per request)
   - Solution: Parallel processing (future), caching

3. **Google Slides Operations**
   - Moderate (100-500ms per slide)
   - Solution: Batch creation where possible

### Optimization Strategies

**Current**:
- Search once, use results multiple times
- Defensive caching (via local variables)
- Minimize API calls

**Future Improvements**:
- Cache frequently accessed items (CacheService)
- Parallel Gemini API calls (if Apps Script supports)
- Incremental slide generation with progress updates
- Background processing for large batches

### Quotas and Limits

**Google Apps Script**:
- Execution time: 6 minutes max
- URL Fetch: 20,000 calls/day (consumer)
- Properties: 500 KB total

**Arena API**:
- Rate limits: Varies by plan
- Pagination: 400 items max per request

**Gemini API**:
- Free tier: 60 requests/minute
- Rate limits: Check current quota in AI Studio

---

## Future Enhancements

### Planned Features

1. **Caching Layer**
   - Cache Arena items in CacheService
   - TTL-based invalidation
   - Reduce API calls by 80%

2. **Template Customization**
   - User-defined slide layouts
   - Custom prompt templates
   - Branding options

3. **Batch Processing**
   - Progress indicators
   - Async processing for large sets
   - Pause/resume capability

4. **Advanced AI Features**
   - Multi-language support
   - Custom tone/style
   - Comparative analysis across items

5. **Export Options**
   - PDF generation
   - PPTX download
   - Sharing presets

---

**Document Version**: 1.0
**Last Updated**: January 2026
**Maintained By**: Arena Slides Development Team
