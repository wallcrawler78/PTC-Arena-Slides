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
 * IMPORTANT: When you click Run, a dialog will pop up asking for permissions.
 * You MUST click "Review Permissions" and complete the authorization flow!
 *
 * HOW TO RUN:
 * 1. In Apps Script editor, select "authorizeScript" from function dropdown
 * 2. Click Run button (▶️)
 * 3. A dialog will pop up - click "Review Permissions"
 * 4. Select your account
 * 5. Click "Advanced" then "Go to Arena Slides (unsafe)"
 * 6. Click "Allow"
 * 7. Check the Execution Log below - should see "Authorization successful!"
 */
function authorizeScript() {
  // This function triggers authorization for all required scopes
  // When first run, Google will show an authorization dialog - you must complete it!

  Logger.log('Starting authorization check...');

  // Trigger UrlFetchApp permission (REQUIRED for Arena API)
  Logger.log('Testing UrlFetchApp permission...');
  var testResponse = UrlFetchApp.fetch('https://www.google.com', {
    muteHttpExceptions: true
  });
  Logger.log('✅ UrlFetchApp permission granted! (HTTP ' + testResponse.getResponseCode() + ')');

  // Trigger Properties permission (for storing credentials)
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
  Logger.log('You can now use Arena Slides!');
  Logger.log('');
  Logger.log('Next steps:');
  Logger.log('1. Go to your Google Slides presentation');
  Logger.log('2. Refresh the page');
  Logger.log('3. Click Arena Slides > Login to Arena');
  Logger.log('====================================');

  return 'Authorization successful! Check the logs above.';
}

/**
 * Creates custom menu when presentation opens
 */
function onOpen() {
  var ui = SlidesApp.getUi();

  ui.createMenu('Arena Slides')
    .addItem('Search Arena Items', 'showSearchDialog')
    .addSeparator()
    .addItem('Settings', 'showSettingsDialog')
    .addItem('Login to Arena', 'showLoginDialog')
    .addItem('Logout', 'clearArenaCredentials')
    .addSeparator()
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
 * Shows the about dialog
 */
function showAboutDialog() {
  var ui = SlidesApp.getUi();
  ui.alert(
    'About Arena Slides',
    'Arena Slides v1.0.0\n\n' +
    'Automatically create presentation slides from Arena PLM content using AI.\n\n' +
    'Features:\n' +
    '• Search Arena for Items, Changes, or Quality Records\n' +
    '• AI-powered content summarization with Gemini\n' +
    '• Automatic slide generation in Google Slides\n\n' +
    'Created with Claude Code',
    ui.ButtonSet.OK
  );
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
      var itemDetails = getArenaItemDetails(itemGuid);

      // Generate AI summary using Gemini with user context
      var summary = generateAISummaryWithContext(itemDetails, userPrompt, i + 1, selectedItems.length);

      // Create slide with content
      createSlideWithContent(presentation, item, summary);
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
 * Creates a slide with Arena item content
 * @param {Presentation} presentation - The presentation object
 * @param {Object} item - Arena item object
 * @param {Object} summary - AI-generated summary
 */
function createSlideWithContent(presentation, item, summary) {
  var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);

  // Set title
  var shapes = slide.getShapes();
  var titleShape = shapes[0];
  titleShape.getText().setText(item.number + ': ' + item.name);

  // Set body with AI summary
  var bodyShape = shapes[1];
  var bodyText = bodyShape.getText();
  bodyText.setText(summary.mainContent || 'No content available');

  // Add additional information as speaker notes if available
  if (summary.detailedNotes) {
    slide.getNotesPage().getSpeakerNotesShape().getText().setText(summary.detailedNotes);
  }
}
