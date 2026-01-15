# Schema Configuration Guide

## Overview

The Schema Configuration feature allows you to customize which Arena PLM fields are included in AI summaries and provide custom instructions for how Gemini should analyze each object type (Items, Changes, Quality Records).

## Benefits

- **Reduce noise**: Only include relevant fields, reducing Gemini token usage and cost
- **Improve relevance**: Focus AI on the data that matters most for your presentations
- **Custom guidance**: Tell Gemini exactly how to interpret and present your Arena data
- **Object-specific**: Different configurations for Items, Changes (ECOs), and Quality Records

## How to Access

1. Open Google Slides
2. Go to **Arena Slides → Settings**
3. Click the **Schema** tab

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
