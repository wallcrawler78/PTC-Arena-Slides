/**
 * PTC Arena Slides - Main Entry Point
 *
 * This Google Apps Script allows users to search Arena PLM for items, changes, or quality records,
 * and automatically generate Google Slides presentations using Gemini AI to summarize content.
 */

/**
 * Authorization test function - Run this first to grant permissions
 * This function requests all necessary permissions for the script to work
 *
 * CRITICAL: This MUST be run from the Apps Script editor to trigger permissions!
 *
 * HOW TO RUN:
 * 1. In Apps Script editor, select "authorizeScript" from function dropdown
 * 2. Click Run button (▶️)
 * 3. A dialog WILL pop up asking for permissions - YOU MUST SEE THIS!
 * 4. Click "Review Permissions"
 * 5. Select your account
 * 6. Click "Advanced" then "Go to Arena Slides (unsafe)"
 * 7. Click "Allow"
 * 8. Check the Execution Log - should see "Authorization successful!"
 */
function authorizeScript() {
  Logger.log('Starting authorization check...');
  Logger.log('This will trigger permission dialogs - you MUST complete them!');
  Logger.log('');

  try {
    // 1. Trigger UrlFetchApp permission (REQUIRED for Arena API)
    Logger.log('Testing UrlFetchApp permission...');
    var testResponse = UrlFetchApp.fetch('https://www.google.com', {
      muteHttpExceptions: true
    });
    Logger.log('✅ UrlFetchApp permission granted! (HTTP ' + testResponse.getResponseCode() + ')');

    // 2. Trigger SlidesApp permission (REQUIRED for creating slides)
    // This is the critical one that was missing!
    Logger.log('Testing SlidesApp permission...');

    // Try to get presentation - this will trigger auth dialog
    try {
      var presentation = SlidesApp.getActivePresentation();
      Logger.log('✅ SlidesApp permission granted! Presentation ID: ' + presentation.getId());
    } catch (e) {
      // If we're running from editor without active presentation, that's OK
      // The permission dialog should still trigger
      Logger.log('Note: No active presentation (expected if running from editor)');
      Logger.log('✅ SlidesApp permission should be granted');

      // Try an alternative that doesn't require active presentation
      // This will still trigger the permission
      SlidesApp.PredefinedLayout.BLANK;
      Logger.log('✅ SlidesApp API accessible');
    }

    // 3. Trigger Properties permission (for storing credentials)
    Logger.log('Testing PropertiesService permission...');
    var props = PropertiesService.getUserProperties();
    props.setProperty('test_auth', 'success');
    props.deleteProperty('test_auth');
    Logger.log('✅ PropertiesService permission granted!');

    Logger.log('');
    Logger.log('====================================');
    Logger.log('✅ AUTHORIZATION SUCCESSFUL!');
    Logger.log('====================================');
    Logger.log('All required permissions have been granted.');
    Logger.log('');
    Logger.log('IMPORTANT: If you did NOT see a permission dialog,');
    Logger.log('you may need to run this from your Google Slides:');
    Logger.log('1. Go to your Slides presentation');
    Logger.log('2. Extensions > Apps Script');
    Logger.log('3. Run authorizeScript from there');
    Logger.log('');
    Logger.log('Otherwise, you are ready to use Arena Slides!');
    Logger.log('====================================');

    return 'Authorization successful! Check the logs above.';

  } catch (error) {
    Logger.log('');
    Logger.log('❌ AUTHORIZATION ERROR');
    Logger.log('Error: ' + error.message);
    Logger.log('');
    Logger.log('If you did not see a permission dialog, that is the problem!');
    Logger.log('');
    Logger.log('TO FIX: Run this function from your Google Slides:');
    Logger.log('1. Open your Google Slides presentation');
    Logger.log('2. Go to Extensions > Apps Script');
    Logger.log('3. Select authorizeScript and click Run');
    Logger.log('4. Complete the permission flow that appears');
    Logger.log('');

    throw error;
  }
}

/**
 * Alternative authorization - Run this from Google Slides
 * Open Slides > Extensions > Apps Script, then run this
 */
function authorizeSlidesFromPresentation() {
  Logger.log('Authorizing from within Google Slides presentation...');

  // This should work since we have active presentation context
  var presentation = SlidesApp.getActivePresentation();
  Logger.log('✅ SlidesApp access granted!');
  Logger.log('Presentation ID: ' + presentation.getId());
  Logger.log('Presentation Name: ' + presentation.getName());

  // Test UrlFetchApp
  var testResponse = UrlFetchApp.fetch('https://www.google.com', {
    muteHttpExceptions: true
  });
  Logger.log('✅ UrlFetchApp access granted!');

  // Test Properties
  PropertiesService.getUserProperties().setProperty('test', 'ok');
  PropertiesService.getUserProperties().deleteProperty('test');
  Logger.log('✅ PropertiesService access granted!');

  Logger.log('');
  Logger.log('====================================');
  Logger.log('✅ ALL PERMISSIONS GRANTED!');
  Logger.log('====================================');
  Logger.log('Arena Slides is now fully authorized.');
  Logger.log('Refresh your Slides and try using Arena Slides menu.');

  return 'Success!';
}

/**
 * Creates custom menu when presentation opens
 */
function onOpen() {
  var ui = SlidesApp.getUi();

  ui.createMenu('Arena Slides')
    .addItem('Search Arena Items', 'showSearchDialog')
    .addItem('Manage Collections', 'showCollectionManager')
    .addItem('Refresh Slides', 'refreshSlides')
    .addSeparator()
    .addItem('Settings', 'showSettingsDialog')
    .addItem('Login to Arena', 'showLoginDialog')
    .addItem('Logout', 'clearArenaCredentials')
    .addSeparator()
    .addItem('Help', 'showHelpDialog')
    .addItem('About', 'showAboutDialog')
    .addToUi();
}

/**
 * Shows the main search dialog for finding Arena items
 */
function showSearchDialog() {
  // Check if user is logged in first
  if (!isArenaSessionValid()) {
    SlidesApp.getUi().alert(
      'Not Logged In',
      'Please login to Arena first using Arena Slides > Login to Arena',
      SlidesApp.getUi().ButtonSet.OK
    );
    return;
  }

  var html = HtmlService.createHtmlOutputFromFile('SearchDialog')
    .setWidth(600)
    .setHeight(500);
  SlidesApp.getUi().showModalDialog(html, 'Search Arena');
}

/**
 * Shows the settings dialog
 */
function showSettingsDialog() {
  var html = HtmlService.createHtmlOutputFromFile('SettingsDialog')
    .setWidth(500)
    .setHeight(400);
  SlidesApp.getUi().showModalDialog(html, 'Arena Slides Settings');
}

/**
 * Shows the login dialog
 */
function showLoginDialog() {
  var html = HtmlService.createHtmlOutputFromFile('LoginDialog')
    .setWidth(400)
    .setHeight(350);
  SlidesApp.getUi().showModalDialog(html, 'Login to Arena');
}

/**
 * Shows the help dialog
 */
function showHelpDialog() {
  var html = HtmlService.createHtmlOutputFromFile('HelpDialog')
    .setWidth(700)
    .setHeight(600);
  SlidesApp.getUi().showModalDialog(html, 'Arena Slides - Help');
}

/**
 * Shows the about dialog
 */
function showAboutDialog() {
  var html = HtmlService.createHtmlOutputFromFile('AboutDialog')
    .setWidth(500)
    .setHeight(350);
  SlidesApp.getUi().showModalDialog(html, 'About Arena Slides');
}

/**
 * Shows the collection manager dialog
 */
function showCollectionManager() {
  var html = HtmlService.createHtmlOutputFromFile('CollectionManagerDialog')
    .setWidth(700)
    .setHeight(600);
  SlidesApp.getUi().showModalDialog(html, 'Manage Collections');
}

/**
 * Stores selected items temporarily for the prompt dialog
 * Using Cache to pass data between dialogs
 */
var TEMP_ITEMS_KEY = 'temp_selected_items';

/**
 * Prepares to generate slides - stores items and shows prompt dialog
 * Called from SearchDialog
 * @param {Array} selectedItems - Array of Arena item objects
 */
function prepareToGenerateSlides(selectedItems) {
  try {
    if (!selectedItems || selectedItems.length === 0) {
      throw new Error('No items selected');
    }

    // Store items in cache temporarily
    var cache = CacheService.getUserCache();
    cache.put(TEMP_ITEMS_KEY, JSON.stringify(selectedItems), 600); // 10 minutes
    Logger.log('Stored ' + selectedItems.length + ' items in cache');

    // Show prompt dialog
    var html = HtmlService.createHtmlOutputFromFile('PresentationPromptDialog')
      .setWidth(650)
      .setHeight(550);
    SlidesApp.getUi().showModalDialog(html, 'Describe Your Presentation');

    return { success: true };
  } catch (error) {
    Logger.log('Error preparing to generate: ' + error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Retrieves temporarily stored items from cache
 * Called from PresentationPromptDialog
 * @return {Array} Array of Arena item objects
 */
function getTempSelectedItems() {
  try {
    var cache = CacheService.getUserCache();
    var cachedData = cache.get(TEMP_ITEMS_KEY);

    if (!cachedData) {
      Logger.log('No items found in cache');
      return [];
    }

    var items = JSON.parse(cachedData);
    Logger.log('Retrieved ' + items.length + ' items from cache');
    return items;
  } catch (error) {
    Logger.log('Error retrieving items from cache: ' + error.message);
    return [];
  }
}

/**
 * Retrieves loaded collection from cache
 * Called from SearchDialog on startup
 * @return {Object} Object with items array and name
 */
function getLoadedCollection() {
  try {
    var cache = CacheService.getUserCache();
    var itemsData = cache.get('loaded_collection');
    var nameData = cache.get('loaded_collection_name');

    if (!itemsData) {
      return null;
    }

    var items = JSON.parse(itemsData);
    var name = nameData || 'Loaded Collection';

    Logger.log('Retrieved loaded collection: ' + name + ' (' + items.length + ' items)');

    // Clear cache after reading
    cache.remove('loaded_collection');
    cache.remove('loaded_collection_name');

    return {
      items: items,
      name: name
    };
  } catch (error) {
    Logger.log('Error retrieving loaded collection: ' + error.message);
    return null;
  }
}

/**
 * Generates slides with user's presentation intent
 * Called from PresentationPromptDialog
 * @param {Array} selectedItems - Array of Arena item objects
 * @param {string} userPrompt - User's description of presentation intent
 * @return {Object} Result with success status and message
 */
function generateSlidesWithPrompt(selectedItems, userPrompt) {
  try {
    if (!selectedItems || selectedItems.length === 0) {
      return { success: false, message: 'No items selected' };
    }

    if (!userPrompt || userPrompt.trim() === '') {
      return { success: false, message: 'Please provide presentation intent' };
    }

    Logger.log('Generating slides with user prompt: ' + userPrompt);
    Logger.log('Number of items: ' + selectedItems.length);

    var presentation = SlidesApp.getActivePresentation();
    var slidesCreated = 0;

    for (var i = 0; i < selectedItems.length; i++) {
      var item = selectedItems[i];

      // Get detailed item information from Arena
      var itemGuid = item.guid || item.Guid;
      var itemNumber = item.number || item.Number || '';

      // Detect object type from number prefix
      var objectType = 'item'; // default
      if (itemNumber.indexOf('ECO-') === 0 || itemNumber.indexOf('ECO') === 0) {
        objectType = 'change';
      } else if (itemNumber.indexOf('ECR-') === 0 || itemNumber.indexOf('ECR') === 0) {
        objectType = 'request';
      } else if (itemNumber.indexOf('CAR-') === 0 || itemNumber.indexOf('NCMR-') === 0 || itemNumber.indexOf('NCR-') === 0) {
        objectType = 'quality';
      }

      Logger.log('Fetching details for ' + itemNumber + ' (type: ' + objectType + ', GUID: ' + itemGuid + ')');
      var itemDetails = getArenaItemDetails(itemGuid, objectType);

      // Get images for items (not for ECOs, ECRs, or Quality records)
      var images = [];
      if (objectType === 'item') {
        images = getItemImages(itemGuid);
        Logger.log('Found ' + images.length + ' image(s) for ' + itemNumber);
      }

      // Generate AI summary using Gemini with user context
      var summary = generateAISummaryWithContext(itemDetails, userPrompt, i + 1, selectedItems.length, objectType);

      // Create slide with content and images
      createSlideWithContent(presentation, item, summary, objectType, images);
      slidesCreated++;
    }

    return {
      success: true,
      message: 'Successfully created ' + slidesCreated + ' slide(s)'
    };

  } catch (error) {
    Logger.log('Error generating slides: ' + error.message);
    Logger.log('Stack: ' + error.stack);
    return {
      success: false,
      message: 'Error: ' + error.message
    };
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use generateSlidesWithPrompt instead
 */
function generateSlidesFromArenaItems(selectedItems) {
  // Provide a default generic prompt
  var defaultPrompt = 'Provide a comprehensive technical summary of these Arena PLM items.';
  return generateSlidesWithPrompt(selectedItems, defaultPrompt);
}

/**
 * Refreshes slides with latest data from Arena
 * Reads metadata from speaker notes to identify Arena items
 */
function refreshSlides() {
  try {
    // Check if user is logged in
    if (!isArenaSessionValid()) {
      SlidesApp.getUi().alert(
        'Not Logged In',
        'Please login to Arena first using Arena Slides > Login to Arena',
        SlidesApp.getUi().ButtonSet.OK
      );
      return;
    }

    var presentation = SlidesApp.getActivePresentation();
    var slides = presentation.getSlides();

    // Find slides with Arena metadata (or Arena-style titles for legacy slides)
    var arenaSlides = [];
    for (var i = 0; i < slides.length; i++) {
      var slide = slides[i];
      var notes = slide.getNotesPage().getSpeakerNotesShape().getText().asString();

      // Check if this slide has Arena metadata (new style)
      if (notes.indexOf('[Arena Slides Metadata') !== -1) {
        var metadata = extractMetadata(notes);
        if (metadata.guid && metadata.type) {
          arenaSlides.push({
            slide: slide,
            guid: metadata.guid,
            type: metadata.type,
            slideNumber: i + 1,
            hasMetadata: true
          });
        }
      } else {
        // Check for legacy slides by title pattern (NUMBER: Name)
        var shapes = slide.getShapes();
        if (shapes.length > 0) {
          var title = shapes[0].getText().asString();
          var legacyInfo = detectLegacyArenaSlide(title);
          if (legacyInfo) {
            arenaSlides.push({
              slide: slide,
              number: legacyInfo.number,
              type: legacyInfo.type,
              slideNumber: i + 1,
              hasMetadata: false,
              isLegacy: true
            });
          }
        }
      }
    }

    if (arenaSlides.length === 0) {
      SlidesApp.getUi().alert(
        'No Arena Slides Found',
        'No slides with Arena content were found in this presentation.\n\n' +
        'Create slides using Arena Slides > Search Arena Items first.',
        SlidesApp.getUi().ButtonSet.OK
      );
      return;
    }

    // Confirm refresh
    var ui = SlidesApp.getUi();
    var response = ui.alert(
      'Refresh Slides',
      'Found ' + arenaSlides.length + ' slide(s) with Arena content.\n\n' +
      'Refresh all slides with the latest data from Arena?',
      ui.ButtonSet.YES_NO
    );

    if (response !== ui.Button.YES) {
      return;
    }

    // Refresh each slide
    var successCount = 0;
    var errorCount = 0;

    for (var i = 0; i < arenaSlides.length; i++) {
      var arenaSlide = arenaSlides[i];

      try {
        var itemDetails;

        if (arenaSlide.isLegacy) {
          // Legacy slide - fetch by number
          Logger.log('Refreshing legacy slide ' + arenaSlide.slideNumber + ' (Number: ' + arenaSlide.number + ')');
          itemDetails = fetchItemByNumber(arenaSlide.number, arenaSlide.type);
        } else {
          // Modern slide - fetch by GUID
          Logger.log('Refreshing slide ' + arenaSlide.slideNumber + ' (GUID: ' + arenaSlide.guid + ')');
          itemDetails = getArenaItemDetails(arenaSlide.guid, arenaSlide.type);
        }

        if (!itemDetails) {
          Logger.log('Could not find item for slide ' + arenaSlide.slideNumber);
          errorCount++;
          continue;
        }

        // Extract basic info for creating simple item object
        var item = {
          guid: itemDetails.guid || itemDetails.Guid,
          number: itemDetails.number || itemDetails.Number,
          name: itemDetails.name || itemDetails.Name
        };

        // Generate AI summary (use generic prompt for refresh)
        var userPrompt = 'Provide a comprehensive technical summary of this Arena PLM item, focusing on current status and key information.';
        var summary = generateAISummaryWithContext(itemDetails, userPrompt, i + 1, arenaSlides.length, arenaSlide.type);

        // Update slide content (this will add metadata to legacy slides)
        updateSlideContent(arenaSlide.slide, item, summary, arenaSlide.type);
        successCount++;

      } catch (error) {
        Logger.log('Error refreshing slide ' + arenaSlide.slideNumber + ': ' + error.message);
        errorCount++;
      }
    }

    // Show results
    var message = 'Refresh complete!\n\n' +
                  'Successfully updated: ' + successCount + ' slide(s)\n';
    if (errorCount > 0) {
      message += 'Errors: ' + errorCount + ' slide(s)\n\n' +
                 'Check execution log for details.';
    }

    ui.alert('Slides Refreshed', message, ui.ButtonSet.OK);

  } catch (error) {
    Logger.log('Error in refreshSlides: ' + error.message);
    SlidesApp.getUi().alert('Error refreshing slides: ' + error.message);
  }
}

/**
 * Extracts metadata from speaker notes
 * @param {string} notes - Speaker notes text
 * @return {Object} Metadata object with guid and type
 */
function extractMetadata(notes) {
  var metadata = { guid: null, type: null };

  // Extract GUID
  var guidMatch = notes.match(/GUID:\s*([^\n]+)/);
  if (guidMatch) {
    metadata.guid = guidMatch[1].trim();
  }

  // Extract Type
  var typeMatch = notes.match(/Type:\s*([^\n]+)/);
  if (typeMatch) {
    metadata.type = typeMatch[1].trim();
  }

  return metadata;
}

/**
 * Detects if a slide title represents an Arena item (legacy format)
 * @param {string} title - Slide title text
 * @return {Object|null} Object with number and type, or null if not Arena slide
 */
function detectLegacyArenaSlide(title) {
  // Pattern: "NUMBER: Name" where NUMBER is Arena item number
  var match = title.match(/^([A-Z0-9\-]+):\s*(.+)/);
  if (!match) {
    return null;
  }

  var number = match[1];
  var type = 'item'; // default

  // Detect type from number prefix
  if (number.indexOf('ECO-') === 0 || number.indexOf('ECO') === 0) {
    type = 'change';
  } else if (number.indexOf('ECR-') === 0 || number.indexOf('ECR') === 0) {
    type = 'request';
  } else if (number.indexOf('CAR-') === 0 || number.indexOf('NCMR-') === 0 || number.indexOf('NCR-') === 0) {
    type = 'quality';
  }

  return {
    number: number,
    type: type
  };
}

/**
 * Fetches Arena item by number (for legacy slides without GUID)
 * @param {string} number - Item number
 * @param {string} type - Object type (item, change, quality)
 * @return {Object|null} Item details or null if not found
 */
function fetchItemByNumber(number, type) {
  try {
    var client = new ArenaAPIClient();

    switch (type) {
      case 'change':
        var changes = client.getChanges();
        for (var i = 0; i < changes.length; i++) {
          var changeNum = changes[i].number || changes[i].Number;
          if (changeNum === number) {
            // Get full details
            var guid = changes[i].guid || changes[i].Guid;
            return client.getChange(guid);
          }
        }
        break;

      case 'quality':
        var quality = client.getQualityRecords();
        for (var i = 0; i < quality.length; i++) {
          var qualNum = quality[i].number || quality[i].Number;
          if (qualNum === number) {
            // Get full details
            var guid = quality[i].guid || quality[i].Guid;
            return client.getQualityRecord(guid);
          }
        }
        break;

      default: // item
        var items = client.getAllItems();
        for (var i = 0; i < items.length; i++) {
          var itemNum = items[i].number || items[i].Number;
          if (itemNum === number) {
            // Get full details
            var guid = items[i].guid || items[i].Guid;
            return client.getItem(guid);
          }
        }
        break;
    }

    return null;
  } catch (error) {
    Logger.log('Error fetching item by number: ' + error.message);
    throw error;
  }
}

/**
 * Updates an existing slide with new content
 * @param {Slide} slide - The slide to update
 * @param {Object} item - Arena item object
 * @param {Object} summary - AI-generated summary
 * @param {string} objectType - Type of object
 */
function updateSlideContent(slide, item, summary, objectType) {
  // Update title
  var shapes = slide.getShapes();
  if (shapes.length > 0) {
    var titleShape = shapes[0];
    titleShape.getText().setText(item.number + ': ' + item.name);
  }

  // Update body
  if (shapes.length > 1) {
    var bodyShape = shapes[1];
    bodyShape.getText().setText(summary.mainContent || 'No content available');
  }

  // Update speaker notes with new metadata
  var itemGuid = item.guid || item.Guid;
  var metadata = '\n\n---\n[Arena Slides Metadata - Do Not Delete]\n' +
                 'GUID: ' + itemGuid + '\n' +
                 'Type: ' + objectType + '\n' +
                 'Last Updated: ' + new Date().toISOString();

  var notesText = (summary.detailedNotes || '') + metadata;
  slide.getNotesPage().getSpeakerNotesShape().getText().setText(notesText);
}

/**
 * Creates a slide with Arena item content
 * @param {Presentation} presentation - The presentation object
 * @param {Object} item - Arena item object
 * @param {Object} summary - AI-generated summary
 * @param {string} objectType - Type of object (item, change, quality)
 * @param {Array} images - Array of image file objects (optional)
 */
function createSlideWithContent(presentation, item, summary, objectType, images) {
  var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);

  // Set title
  var shapes = slide.getShapes();
  var titleShape = shapes[0];
  titleShape.getText().setText(item.number + ': ' + item.name);

  // Set body with AI summary
  var bodyShape = shapes[1];
  var bodyText = bodyShape.getText();
  bodyText.setText(summary.mainContent || 'No content available');

  // Add image if available
  if (images && images.length > 0) {
    try {
      addImageToSlide(slide, item, images[0], bodyShape);
    } catch (imageError) {
      Logger.log('Could not add image to slide: ' + imageError.message);
      // Continue without image
    }
  }

  // Store metadata in speaker notes for refresh capability
  var itemGuid = item.guid || item.Guid;
  var imageInfo = '';
  if (images && images.length > 0) {
    imageInfo = 'Images: ' + images.length + ' (' + images[0].name + ')\n';
  }

  var metadata = '\n\n---\n[Arena Slides Metadata - Do Not Delete]\n' +
                 'GUID: ' + itemGuid + '\n' +
                 'Type: ' + objectType + '\n' +
                 imageInfo +
                 'Last Updated: ' + new Date().toISOString();

  var notesText = (summary.detailedNotes || '') + metadata;
  slide.getNotesPage().getSpeakerNotesShape().getText().setText(notesText);
}

/**
 * Adds an image to a slide
 * @param {Slide} slide - The slide object
 * @param {Object} item - Arena item object
 * @param {Object} imageInfo - Image file information
 * @param {Shape} bodyShape - Body text shape to adjust size
 */
function addImageToSlide(slide, item, imageInfo, bodyShape) {
  try {
    // Get the item GUID
    var itemGuid = item.guid || item.Guid;

    // Fetch the image file from Arena
    var client = new ArenaAPIClient();
    var fileContent = client.getFileContent(itemGuid, imageInfo.guid);

    if (!fileContent) {
      Logger.log('No file content returned for image');
      return;
    }

    // Arena returns download URL in the response
    var downloadUrl = fileContent.url || fileContent.URL || fileContent.downloadUrl;

    if (!downloadUrl) {
      Logger.log('No download URL found in file content response');
      return;
    }

    // Fetch the image data
    var imageBlob = UrlFetchApp.fetch(downloadUrl, {
      headers: {
        'arena_session_id': getArenaSessionId()
      },
      muteHttpExceptions: true
    }).getBlob();

    // Resize body text box to make room for image
    // Standard slide is 720 x 540 points
    bodyShape.setWidth(350); // Left side for text
    bodyShape.setLeft(50);

    // Insert image on the right side
    var imageWidth = 300;
    var imageHeight = 225;
    var imageLeft = 400;
    var imageTop = 150;

    slide.insertImage(imageBlob, imageLeft, imageTop, imageWidth, imageHeight);

    Logger.log('Successfully added image to slide: ' + imageInfo.name);

  } catch (error) {
    Logger.log('Error adding image to slide: ' + error.message);
    throw error;
  }
}
