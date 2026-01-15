# Schema Configuration Guide

## Overview

The Schema Configuration feature allows you to customize which Arena PLM fields are included in AI summaries and provide custom instructions for how Gemini should analyze each object type (Items, Changes, Quality Records).

**NEW: Dynamic Schema Discovery** - Fields are automatically discovered from your Arena workspace, reflecting your actual configuration including custom fields!

## Benefits

- **Reduce noise**: Only include relevant fields, reducing Gemini token usage and cost
- **Improve relevance**: Focus AI on the data that matters most for your presentations
- **Custom guidance**: Tell Gemini exactly how to interpret and present your Arena data
- **Object-specific**: Different configurations for Items, Changes (ECOs), and Quality Records

## How to Access

1. Open Google Slides
2. Go to **Arena Slides → Settings**
3. Click the **Schema** tab

## Dynamic Schema Discovery

### What It Does
Instead of using a hardcoded list of fields, Arena Slides now **automatically discovers** the actual fields from your Arena workspace by:
1. Fetching sample items, changes, and quality records from Arena
2. Analyzing their structure to extract field names
3. Including **custom fields** specific to your workspace
4. Excluding system fields (GUIDs, timestamps, etc.)

### First-Time Setup
When you first open Settings → Schema:
1. Fields are **automatically loaded** from Arena
2. All discovered fields are **selected by default**
3. You see the actual fields from your workspace

### Refresh Fields Button
Click **"🔄 Refresh Fields from Arena"** to:
- Discover new fields added to Arena
- Remove fields that no longer exist
- Update field lists for all object types
- **Preserve your selections** for fields that still exist

**When to Refresh:**
- After adding custom fields in Arena
- After Arena administrator updates field configuration
- If fields appear to be missing or outdated
- Periodically to ensure sync with Arena

### How Refresh Works
1. **Discovers Current Schema**: Fetches latest objects from Arena
2. **Extracts Field Names**: Analyzes object structure
3. **Preserves Selections**: Keeps your checkboxes for existing fields
4. **Adds New Fields**: New fields appear unchecked (you can select them)
5. **Removes Old Fields**: Fields no longer in Arena are removed

**Example:**
- You have fields A, B, C selected
- You add custom field D in Arena
- Click "Refresh Fields"
- Result: A, B, C still selected; D appears unchecked (available to select)

## Discovered Fields

### What Gets Discovered
**✅ Included:**
- Standard Arena fields (number, name, description, etc.)
- Custom fields specific to your workspace
- Common nested objects (category, lifecyclePhase, owner, etc.)
- Arrays and primitive values

**❌ Excluded:**
- System GUIDs (guid, Guid)
- Internal URLs (url, URL)
- Creation metadata (createdBy, createdDateTime)
- Modification metadata (modifiedBy, modifiedDateTime)
- Other system-managed fields

### Field Types by Object

**Items Typically Include:**
- Identification: number, name, description
- Classification: category, lifecyclePhase, revisionNumber
- Ownership: owner, creator
- Dates: effectivityDate, creationDateTime
- Attributes: cost, uom, procurementType, offTheShelf
- Custom fields: Any workspace-specific fields

**Changes (ECOs) Typically Include:**
- Identification: number, title, description
- Status: status, routingStatus, severity
- Classification: category, effectivityType
- Ownership: creator, owner
- Dates: submittedDateTime, targetImplementationDate, implementationDate
- Impact: impactedItems, reason
- Custom fields: Change-specific workspace fields

**Quality Records Typically Include:**
- Identification: number, title, description
- Status: status, severity, disposition
- Problem: problemDescription, rootCause
- Actions: containmentAction, correctiveAction, preventiveAction
- Dates: creationDateTime, closureDate
- Impact: impactedItems
- Custom fields: Quality-specific workspace fields

## Configuration Options

### For Each Object Type (Items, Changes, Quality):

#### 1. Field Selection
- **Select All / Deselect All buttons**: Quick selection controls
- **Checkboxes**: Select specific fields to include in AI prompts
- **Default**: All fields are selected initially

**Example Fields:**
- **Items**: number, name, description, category, lifecyclePhase, owner, cost, etc.
- **Changes**: number, title, status, severity, targetImplementationDate, impactedItems, etc.
- **Quality**: number, description, rootCause, containmentAction, correctiveAction, etc.

#### 2. Custom Instructions
Text area where you provide specific guidance for Gemini on how to analyze and present data.

**Example Instructions:**

**For Items:**
```
Pay attention to item number, description, owner, revision, lifecycle, and cost.
If multiple items, present in a table grouped by lifecycle stage and ordered by creation date.
```

**For Changes (ECOs):**
```
Pay special attention to created date, target due date, status, and severity.
Focus on what changed, why it changed, and the business impact.
Highlight any items affected by the change.
```

**For Quality Records:**
```
Pay special focus to the description, root cause, and containment fields.
Emphasize corrective actions and measures to prevent recurrence.
Include disposition and closure status.
```

## How It Works

### 1. Field Filtering
When you generate slides, only the selected fields are sent to Gemini:
- Reduces API token usage
- Focuses AI on relevant data
- Improves summary quality

### 2. Custom Instructions Integration
Your custom instructions are automatically incorporated into the AI prompt:
```
REQUIREMENTS:
- Focus on information relevant to: [User's presentation goal]
- This is a CHANGE (ECO): Emphasize what changed, why, and impact
- CUSTOM INSTRUCTIONS: [Your custom instructions here]
```

### 3. Object Type Detection
The system automatically detects object types:
- **ECO-*** or **ECO*** → Changes
- **CAR-***, **NCMR-***, **NCR-*** → Quality Records
- **Everything else** → Items

## Best Practices

### 1. Start with Defaults
- Begin with all fields selected
- Generate a few slides to see what Gemini includes
- Refine by deselecting irrelevant fields

### 2. Focus on Key Fields
**Essential fields to keep:**
- Identification: number, name/title
- Status: lifecyclePhase, status
- Descriptive: description
- Contextual: category, owner, dates

**Fields to consider removing:**
- Internal IDs (unless needed)
- Metadata fields (createdBy, modifiedBy)
- System fields (unless relevant)

### 3. Write Clear Instructions
Good instructions are:
- **Specific**: "Focus on root cause" not "analyze quality"
- **Actionable**: "Present in a table" not "organize nicely"
- **Relevant**: Tied to your presentation goals

### 4. Test and Iterate
1. Configure schema settings
2. Generate test slides
3. Review AI summaries
4. Adjust field selections and instructions
5. Regenerate (use Refresh Slides)

## Example Use Cases

### Executive Summary Presentation
**Items:**
- Fields: number, name, category, lifecyclePhase, cost
- Instructions: "Focus on high-level status and cost implications. Group by lifecycle."

### Technical Design Review
**Items:**
- Fields: number, name, description, revisionNumber, owner, specifications
- Instructions: "Provide detailed technical specifications. Include revision history if relevant."

### Quality Investigation Report
**Quality:**
- Fields: number, description, problemDescription, rootCause, correctiveAction, preventiveAction
- Instructions: "Emphasize 8D methodology. Clearly separate problem, root cause, and solutions."

### Change Impact Analysis
**Changes:**
- Fields: number, title, severity, impactedItems, targetImplementationDate, reason
- Instructions: "Focus on business impact and timeline. List all affected items with their part numbers."

## Troubleshooting

### Schema Won't Load
**Problem**: Fields don't appear in Schema tab
**Possible Causes:**
1. Not logged into Arena
2. Arena session expired
3. No items/changes/quality in workspace
4. Network error

**Solutions:**
1. Login: Arena Slides → Login to Arena
2. Check workspace has data (at least one item, change, or quality record)
3. Click "Refresh Fields from Arena" manually
4. Check execution log for specific errors

### Custom Fields Missing
**Problem**: Custom field doesn't appear in field list
**Possible Causes:**
1. Field was added after last refresh
2. Field not applied to object type
3. Field is system-managed

**Solutions:**
1. Click "Refresh Fields from Arena"
2. Verify field exists on that object type in Arena
3. Check field is not a calculated or system field

### Refresh Takes Long Time
**Problem**: Refresh button shows "Refreshing..." for a while
**Cause**: Normal - Arena API is being queried for each object type
**Expected Duration**: 10-30 seconds depending on workspace size
**Solution**: Wait for completion; check status message

### Fields Disappeared After Refresh
**Problem**: Some fields no longer appear after refresh
**Cause**: Fields were removed or renamed in Arena configuration
**Solution**:
1. Check Arena admin panel - were fields deleted?
2. If renamed, new name will appear (select it)
3. If deleted, they're correctly removed

### AI summaries are too brief
- Increase Detail Level in General Settings (Brief → Medium → Detailed)
- Add more fields to include richer data
- Adjust custom instructions to request more detail

### AI summaries ignore custom instructions
- Make instructions more specific and directive
- Use imperative language ("Focus on...", "Emphasize...", "List...")
- Check that relevant fields are selected

### Generated slides are inconsistent
- Ensure consistent field selection across object types
- Use similar instruction patterns for all types
- Review and standardize your presentation prompt

## Saving Changes

Click **Save Settings** to persist your schema configuration. Changes apply to:
- New slides generated after saving
- Slides refreshed with "Refresh Slides" menu option

## Resetting to Defaults

To reset schema configuration:
1. Click **Select All** for each object type
2. Clear custom instructions textareas
3. Click **Save Settings**

---

**Related Documentation:**
- [QUICK_START.md](QUICK_START.md) - Getting started guide
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical architecture
