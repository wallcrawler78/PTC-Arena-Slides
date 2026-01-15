# Collection Management v2.0

## Overview

Collection Management allows you to save, organize, and reuse sets of Arena items for quick access. Instead of running the same searches repeatedly, save your collections and load them instantly.

## Features

### Visual Collection Manager
- **Dedicated UI**: Modern, user-friendly interface for managing collections
- **Visual List**: See all your collections at a glance with metadata
- **Quick Actions**: Edit, rename, delete, and load collections with one click

### Collection Information
Each saved collection displays:
- **Name**: Custom or auto-generated name
- **Item Count**: Total number of items in the collection
- **Timestamp**: When the collection was created
- **Preview**: First few item numbers for quick identification

## How to Access

**From Main Menu:**
1. Go to **Arena Slides → Manage Collections**
2. The Collection Manager dialog opens

**From Search Dialog:**
1. After searching and adding items to your collection
2. Click the **📚 Load Saved** button in the collection banner
3. Or click **💾 Save** to save the current collection

## Managing Collections

### Save a Collection

**Method 1: From Search Dialog**
1. Search for items and add them to your collection
2. Click **💾 Save** in the collection banner
3. Enter a custom name (or leave blank for auto-name)
4. Click OK

**Method 2: Auto-Save**
Collections are automatically named based on content:
- Example: "3 Items, 2 ECOs - Jan 15, 10:30"
- Shows types and timestamp

### Load a Collection

**From Collection Manager:**
1. Click **📂 Load** button on any collection
2. Confirm to load
3. Search dialog opens with items pre-loaded into collection
4. Ready to generate slides or add more items

**From Search Dialog:**
1. Click **📚 Load Saved** button
2. See list of available collections
3. Click **📂 Load** on desired collection

### Rename a Collection

1. Open Collection Manager
2. Click the **✏️ Edit** button on a collection
3. The name becomes editable
4. Type the new name
5. Click **💾 Save** to confirm
6. Or click **✖️ Cancel** to revert

### Delete a Collection

**Delete Individual:**
1. Open Collection Manager
2. Click the **🗑️ Delete** button on a collection
3. Confirm deletion
4. Collection is permanently removed

**Delete All:**
1. Open Collection Manager
2. Click **Clear All** button at bottom
3. Confirm deletion of all collections
4. All collections are permanently removed

## Collection Limits

- **Maximum Saved**: 5 collections
- **Storage**: Oldest collections are removed when limit reached
- **Auto-cleanup**: Collections older than limit are automatically purged

## Use Cases

### Quality Investigation Workflow
1. Search for NCMR by number
2. Add to collection
3. Search for affected items
4. Add to same collection
5. Search for related ECO
6. Add to collection
7. Save as "NCMR-123 Investigation"
8. Load anytime for updates

### Weekly Status Reports
1. Search for items in "Production" lifecycle
2. Add all to collection
3. Search for ECOs with status "Approved This Week"
4. Add to collection
5. Save as "Weekly Status - Week of [date]"
6. Load each week and refresh slides

### Design Review Prep
1. Search for items by category
2. Select items for review
3. Add to collection
4. Search for related ECOs
5. Add to collection
6. Save as "Design Review - [Project Name]"
7. Load before each review meeting

### Product Line Analysis
1. Search items by category "Widgets"
2. Filter by lifecycle
3. Add to collection
4. Save as "Widget Product Line"
5. Load monthly to track changes

## Collection Storage

### What's Stored
- **Item GUID**: Unique identifier
- **Item Number**: Part number/change number
- **Item Name**: Title
- **Description**: Truncated to 100 characters

### What's NOT Stored
- Full item details (fetched fresh on load)
- Images
- File attachments
- Custom attributes
- BOM data

### Why This Approach
- **Efficient**: Minimal storage usage
- **Fresh Data**: Always get latest info when loading
- **Fast**: Quick load times
- **Reliable**: GUIDs ensure correct items

## Tips & Best Practices

### Naming Conventions
Use descriptive names that include:
- **Project/Part**: "Widget 2.0 Investigation"
- **Date**: "Q1 2025 Review Items"
- **Purpose**: "Customer Presentation - Acme Corp"
- **Status**: "Pending Changes - Week 3"

### Organization
- Keep collections focused on specific topics
- Delete old collections you no longer need
- Use consistent naming patterns
- Save collections after completing searches

### Workflow Integration
- **Before Meetings**: Load saved collection, refresh slides
- **Investigation Updates**: Load collection, add new findings, re-save
- **Recurring Reports**: Load collection, refresh data, regenerate

### Performance
- Smaller collections load faster
- Consider breaking large collections into focused sets
- Delete unused collections to maintain performance

## Troubleshooting

### Collection Won't Load
- **Cause**: Items may have been deleted in Arena
- **Solution**: Collection loads available items only
- **Prevention**: Verify items exist before saving

### Collection List is Empty
- **Cause**: No collections have been saved
- **Solution**: Create searches and save collections
- **Note**: Collections are user-specific

### Can't Edit Collection Name
- **Cause**: Dialog may not be responding
- **Solution**: Click Edit button, ensure input field appears
- **Workaround**: Delete and create new collection

### Collection Disappeared
- **Cause**: Exceeded 5 collection limit
- **Solution**: Manage collections, delete old ones
- **Prevention**: Regularly clean up unused collections

## Technical Details

### Storage Location
- Collections stored in Google User Properties
- Scoped to your Google account
- Persistent across sessions
- Maximum storage: ~500KB total

### Data Structure
```javascript
{
  name: "Collection Name",
  timestamp: "2026-01-15T12:00:00.000Z",
  itemCount: 5,
  items: [
    {
      guid: "ABC123",
      number: "900-00001",
      name: "Widget Assembly",
      description: "Main assembly for..."
    }
  ]
}
```

### Cache Mechanism
- Collections loaded via cache when opening search dialog
- Cache expires after 10 minutes
- Ensures fresh data between dialogs

## Future Enhancements

Planned features for future versions:
- Export collections to Excel/CSV
- Share collections with team members
- Collection tags and categories
- Search within collections
- Collection analytics and statistics
- Automated collection refresh schedules

---

**Related Documentation:**
- [QUICK_START.md](QUICK_START.md) - Getting started guide
- [SCHEMA_CONFIGURATION.md](SCHEMA_CONFIGURATION.md) - Field configuration
