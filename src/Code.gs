/**
 * PTC Arena Slides - Main Entry Point
 *
 * This Google Apps Script allows users to search Arena PLM for items, changes, or quality records,
 * and automatically generate Google Slides presentations using Gemini AI to summarize content.
 */

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
 * Generates slides from selected Arena items
 * @param {Array} selectedItems - Array of Arena item objects
 * @return {Object} Result with success status and message
 */
function generateSlidesFromArenaItems(selectedItems) {
  try {
    if (!selectedItems || selectedItems.length === 0) {
      return { success: false, message: 'No items selected' };
    }

    var presentation = SlidesApp.getActivePresentation();
    var slidesCreated = 0;

    for (var i = 0; i < selectedItems.length; i++) {
      var item = selectedItems[i];

      // Get detailed item information from Arena
      var itemDetails = getArenaItemDetails(item.guid);

      // Generate AI summary using Gemini
      var summary = generateAISummary(itemDetails);

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
