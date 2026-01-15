# Image Attachments in Slides

## Overview

Arena Slides automatically detects and includes image attachments from Arena items in your presentation slides. When generating slides, the system looks for image files attached to items and embeds them directly into the slides.

## Features

- **Automatic Detection**: Finds all image attachments for items
- **Smart Filtering**: Only includes image file types (JPG, PNG, GIF, BMP, WEBP)
- **Authentication**: Securely downloads images using your Arena session
- **Layout Optimization**: Automatically adjusts slide layout for images
- **Metadata Tracking**: Records image information in speaker notes

## Supported Object Types

### Items ✅
- **Images Included**: YES
- **Use Case**: Product photos, CAD thumbnails, reference images
- **Example**: Part 900-00011 with product photo attached

### Changes (ECOs) ❌
- **Images Included**: NO
- **Reason**: ECOs typically reference item images, not contain their own
- **Workaround**: Include related items in collection

### Quality Records ❌
- **Images Included**: NO
- **Reason**: Quality records reference items with images
- **Workaround**: Include affected items in collection

## How It Works

### Automatic Process

1. **Generate Slides**: Click "Generate from Collection" or "Generate from Selection"
2. **Item Detection**: System identifies items in your selection
3. **Image Search**: For each item, Arena API is queried for file attachments
4. **Image Filter**: Only image files are selected (based on file extension)
5. **Download**: First image is downloaded with authentication
6. **Insertion**: Image is embedded into the slide
7. **Layout**: Text area resized to accommodate image

### Slide Layout

**Standard Slide (no image):**
```
┌──────────────────────────────────┐
│ Title: 900-00011: Widget         │
├──────────────────────────────────┤
│ • Bullet point 1                 │
│ • Bullet point 2                 │
│ • Bullet point 3                 │
│ • Bullet point 4                 │
│ • Bullet point 5                 │
└──────────────────────────────────┘
```

**With Image:**
```
┌──────────────────────────────────┐
│ Title: 900-00011: Widget         │
├─────────────────┬────────────────┤
│ • Bullet 1      │                │
│ • Bullet 2      │    [IMAGE]     │
│ • Bullet 3      │                │
│ • Bullet 4      │                │
└─────────────────┴────────────────┘
```

- **Text Area**: Left side, 350 points wide
- **Image Area**: Right side, 300x225 points
- **Position**: Image at (400, 150) from top-left

## Image Selection

### Multiple Images
If an item has multiple images:
- **First image only** is included in the slide
- **All images** are noted in speaker notes
- **Future enhancement**: Option to include multiple images

### Priority
When multiple images exist, first image found is used based on:
1. Arena API order (typically upload order)
2. File name (alphabetical if same timestamp)

## Supported Image Formats

✅ **Supported:**
- JPG / JPEG
- PNG
- GIF
- BMP
- WEBP

❌ **Not Supported:**
- PDF documents
- CAD files (STEP, IGES, etc.)
- Office documents
- Video files
- Other non-image formats

## Requirements

### For Images to Appear
- ✅ Item must be in Arena
- ✅ Item must have file attachments
- ✅ At least one attachment must be an image file
- ✅ You must have Arena access to view the file
- ✅ Arena session must be valid
- ✅ File must be accessible (not restricted)

### Permissions
- **Read Access**: You must have permission to view the item
- **File Access**: You must have permission to view attachments
- **Network Access**: Script must access Arena API

## Troubleshooting

### Image Not Appearing

**Problem**: Slide generated but no image
**Possible Causes:**
1. Item has no image attachments
2. File is not an image format
3. Arena session expired
4. Insufficient permissions
5. Network error during download

**Solutions:**
1. Check Arena - verify item has image attachments
2. Check file extension - must be JPG, PNG, GIF, BMP, or WEBP
3. Re-login to Arena (Arena Slides → Login to Arena)
4. Verify you have file view permissions in Arena
5. Check execution log for specific errors

### Image Quality Issues

**Problem**: Image appears pixelated or blurry
**Cause**: Original image resolution is low
**Solution**: Upload higher resolution images to Arena

**Problem**: Image aspect ratio is distorted
**Cause**: Image resized to fit standard dimensions
**Solution**: This is expected behavior; original stored in Arena

### Image Loading Slow

**Problem**: Slide generation takes longer with images
**Cause**: Images downloaded from Arena during generation
**Solution**: This is expected; larger images take longer

**Optimization Tips:**
- Use smaller image files in Arena (< 2MB)
- Use JPG format for photos (better compression)
- Generate slides with fewer items at a time

## Speaker Notes

### Image Metadata
Speaker notes automatically include:
- Number of images found
- Name of included image
- Image GUID for reference

**Example:**
```
[Speaker Notes Content]

---
[Arena Slides Metadata - Do Not Delete]
GUID: ABC123XYZ
Type: item
Images: 3 (product_photo.jpg)
Last Updated: 2026-01-15T12:00:00.000Z
```

## Use Cases

### Product Documentation
**Scenario**: Create presentation showing product parts
**Setup**:
1. Attach product photos to items in Arena
2. Search for items by category
3. Add to collection
4. Generate slides
**Result**: Each slide shows item details + product photo

### Design Reviews
**Scenario**: Present CAD models and specifications
**Setup**:
1. Attach CAD screenshots/renders to items
2. Search by project or lifecycle
3. Generate presentation
**Result**: Visual design review with images

### Quality Investigations
**Scenario**: Show defective parts in investigation report
**Setup**:
1. Attach defect photos to items
2. Include items in NCMR investigation collection
3. Generate slides
**Result**: Visual evidence in presentation

### Customer Presentations
**Scenario**: Product catalog or capabilities presentation
**Setup**:
1. Ensure all items have marketing photos
2. Create collection of showcase items
3. Generate slides with customer prompt
**Result**: Professional product presentation

## Best Practices

### Image Management in Arena
1. **Consistent Naming**: Use descriptive file names
   - Good: "widget_2.0_front_view.jpg"
   - Bad: "IMG_1234.jpg"

2. **Primary Image First**: Upload the main image first
   - Arena Slides uses first image found
   - Rename/re-upload if needed to change order

3. **Optimal Resolution**: Balance quality and file size
   - Recommended: 1920x1440 or smaller
   - Slides use 300x225, so higher resolution wasted

4. **File Format**: Use appropriate format
   - Photos: JPG (smaller file size)
   - Graphics/diagrams: PNG (better clarity)
   - Animations: GIF (if needed)

### Presentation Design
1. **Text Brevity**: With images, use fewer bullet points
   - 3-4 bullets max when image present
   - Let image tell part of the story

2. **Consistent Images**: Use similar style across items
   - Same background
   - Same lighting/angle
   - Same resolution

3. **Image Quality**: Verify images before generating
   - Preview in Arena first
   - Check resolution and clarity
   - Replace low-quality images

## Technical Details

### API Endpoints Used
```
GET /items/{guid}/files
GET /items/{guid}/files/{fileGuid}/content
```

### Download Process
1. Fetch file list for item
2. Filter for image extensions
3. Request file content (returns download URL)
4. Download image with Arena session authentication
5. Convert to blob
6. Insert into slide

### Error Handling
- **File not found**: Skip image, continue with slide
- **Download failed**: Log error, continue with slide
- **Invalid format**: Skip image, continue with slide
- **All errors logged**: Check execution log for details

### Performance Impact
- **Without Images**: ~2-3 seconds per slide
- **With Images**: ~4-6 seconds per slide
- **Large Images**: Up to 10 seconds per slide

## Future Enhancements

Planned features:
- **Multiple Images**: Gallery or carousel
- **Image Position**: Left, right, top, bottom options
- **Image Size**: Small, medium, large options
- **Image Filtering**: Select specific images to include
- **Image Editing**: Crop, rotate, adjust in slides
- **Thumbnails**: Preview images before generation
- **Batch Download**: Pre-fetch all images for faster generation

## Limitations

### Current Limitations
- Only first image included per item
- Fixed image size and position
- No image editing capabilities
- No preview before generation
- Images only for Items (not ECOs or Quality)

### Workarounds
- **Multiple Images**: Create multiple slides for same item
- **Image Position**: Manually reposition after generation
- **Image Size**: Manually resize after generation
- **ECO Images**: Include related items in collection

---

**Related Documentation:**
- [QUICK_START.md](QUICK_START.md) - Getting started
- [COLLECTION_MANAGEMENT.md](COLLECTION_MANAGEMENT.md) - Managing collections
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical architecture
