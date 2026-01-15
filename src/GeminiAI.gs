/**
 * Gemini AI Integration Module
 *
 * Handles AI-powered content summarization using Google's Gemini API
 */

var GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

/**
 * Generates AI summary of Arena item content
 * @param {Object} itemDetails - Full Arena item details
 * @return {Object} Summary object with mainContent and detailedNotes
 */
function generateAISummary(itemDetails) {
  try {
    var apiKey = getGeminiApiKey();

    if (!apiKey) {
      Logger.log('No Gemini API key configured, using basic summary');
      return generateBasicSummary(itemDetails);
    }

    // Prepare content for AI
    var itemContent = prepareItemContentForAI(itemDetails);

    // Get AI detail level preference
    var detailLevel = PropertiesService.getUserProperties().getProperty(AI_DETAIL_LEVEL_KEY) || 'medium';

    // Generate prompt based on detail level
    var prompt = generatePrompt(itemContent, detailLevel);

    // Call Gemini API
    var summary = callGeminiAPI(prompt, apiKey);

    return parseSummaryResponse(summary);

  } catch (error) {
    Logger.log('AI summary generation error: ' + error.message);
    Logger.log('Falling back to basic summary');
    return generateBasicSummary(itemDetails);
  }
}

/**
 * Prepares Arena item content for AI processing
 * @param {Object} itemDetails - Arena item details
 * @return {string} Formatted content string
 */
function prepareItemContentForAI(itemDetails) {
  var content = [];

  // Handle both response formats
  var number = itemDetails.number || itemDetails.Number || 'N/A';
  var name = itemDetails.name || itemDetails.Name || 'N/A';
  var description = itemDetails.description || itemDetails.Description || 'N/A';
  var category = itemDetails.category ? (itemDetails.category.name || itemDetails.category.Name) : 'N/A';
  var lifecycle = itemDetails.lifecyclePhase ? (itemDetails.lifecyclePhase.name || itemDetails.lifecyclePhase.Name) : 'N/A';

  content.push('Item Number: ' + number);
  content.push('Item Name: ' + name);
  content.push('Description: ' + description);
  content.push('Category: ' + category);
  content.push('Lifecycle Phase: ' + lifecycle);

  // Add custom attributes if available
  var attributes = itemDetails.additionalAttributes || itemDetails.AdditionalAttributes || [];
  if (attributes.length > 0) {
    content.push('\nAdditional Attributes:');
    for (var i = 0; i < attributes.length; i++) {
      var attr = attributes[i];
      var attrName = attr.name || attr.Name;
      var attrValue = attr.value || attr.Value;
      content.push('  ' + attrName + ': ' + attrValue);
    }
  }

  return content.join('\n');
}

/**
 * Generates prompt for Gemini based on detail level
 * @param {string} itemContent - Item content
 * @param {string} detailLevel - Detail level (brief, medium, detailed)
 * @return {string} Prompt for AI
 */
function generatePrompt(itemContent, detailLevel) {
  var basePrompt = 'You are creating a presentation slide about a product/item from Arena PLM. ';

  var detailInstructions = {
    'brief': 'Create a concise, bullet-point summary (3-5 bullets) highlighting only the most critical information.',
    'medium': 'Create a clear summary with key points (5-7 bullets) covering the main aspects of this item.',
    'detailed': 'Create a comprehensive summary with detailed bullets (7-10 points) covering all important aspects and technical details.'
  };

  var instruction = detailInstructions[detailLevel] || detailInstructions['medium'];

  return basePrompt + instruction + '\n\nItem Information:\n' + itemContent + '\n\nProvide your response in this format:\n\nMAIN CONTENT:\n[Bullet points for slide]\n\nDETAILED NOTES:\n[Additional speaker notes]';
}

/**
 * Calls Gemini API
 * @param {string} prompt - The prompt to send
 * @param {string} apiKey - Gemini API key
 * @return {string} AI response
 */
function callGeminiAPI(prompt, apiKey) {
  var url = GEMINI_API_URL + '?key=' + apiKey;

  var payload = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }]
  };

  var options = {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  var responseCode = response.getResponseCode();

  if (responseCode !== 200) {
    throw new Error('Gemini API error ' + responseCode + ': ' + response.getContentText());
  }

  var result = JSON.parse(response.getContentText());

  if (!result.candidates || result.candidates.length === 0) {
    throw new Error('No response from Gemini API');
  }

  return result.candidates[0].content.parts[0].text;
}

/**
 * Parses AI summary response
 * @param {string} summary - Raw AI response
 * @return {Object} Parsed summary object
 */
function parseSummaryResponse(summary) {
  var mainContent = '';
  var detailedNotes = '';

  // Split by MAIN CONTENT and DETAILED NOTES markers
  var mainMatch = summary.match(/MAIN CONTENT:\s*([\s\S]*?)(?=DETAILED NOTES:|$)/i);
  var notesMatch = summary.match(/DETAILED NOTES:\s*([\s\S]*)/i);

  if (mainMatch) {
    mainContent = mainMatch[1].trim();
  } else {
    // If no markers, use first half as main content
    var lines = summary.split('\n');
    var midpoint = Math.floor(lines.length / 2);
    mainContent = lines.slice(0, midpoint).join('\n');
    detailedNotes = lines.slice(midpoint).join('\n');
  }

  if (notesMatch) {
    detailedNotes = notesMatch[1].trim();
  }

  return {
    mainContent: mainContent || summary,
    detailedNotes: detailedNotes
  };
}

/**
 * Generates basic summary without AI (fallback)
 * @param {Object} itemDetails - Arena item details
 * @return {Object} Summary object
 */
function generateBasicSummary(itemDetails) {
  var number = itemDetails.number || itemDetails.Number || 'N/A';
  var name = itemDetails.name || itemDetails.Name || 'N/A';
  var description = itemDetails.description || itemDetails.Description || 'No description available';
  var category = itemDetails.category ? (itemDetails.category.name || itemDetails.category.Name) : 'N/A';
  var lifecycle = itemDetails.lifecyclePhase ? (itemDetails.lifecyclePhase.name || itemDetails.lifecyclePhase.Name) : 'N/A';

  var mainContent = '• Item Number: ' + number + '\n' +
                    '• Category: ' + category + '\n' +
                    '• Lifecycle: ' + lifecycle + '\n' +
                    '• Description: ' + description;

  var detailedNotes = 'Item Name: ' + name + '\n' +
                      'Number: ' + number + '\n' +
                      'Category: ' + category + '\n' +
                      'Lifecycle Phase: ' + lifecycle + '\n\n' +
                      'Description:\n' + description;

  return {
    mainContent: mainContent,
    detailedNotes: detailedNotes
  };
}
