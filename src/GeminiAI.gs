/**
 * Gemini AI Integration Module
 *
 * Handles AI-powered content summarization using Google's Gemini API
 */

var GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

/**
 * Generates AI summary with user context and Arena PLM knowledge
 * @param {Object} itemDetails - Full Arena item details
 * @param {string} userPrompt - User's presentation intent
 * @param {number} itemIndex - Current item index (1-based)
 * @param {number} totalItems - Total number of items
 * @param {string} objectType - Optional object type (item, change, quality)
 * @return {Object} Summary object with mainContent and detailedNotes
 */
function generateAISummaryWithContext(itemDetails, userPrompt, itemIndex, totalItems, objectType) {
  try {
    var apiKey = getGeminiApiKey();

    if (!apiKey) {
      Logger.log('No Gemini API key configured, using basic summary');
      return generateBasicSummary(itemDetails);
    }

    // Detect object type if not provided
    if (!objectType) {
      objectType = detectObjectType(itemDetails);
    }

    // Get schema configuration
    var schema = getSchemaSettings();

    // Prepare content for AI with Arena context (filtered by schema)
    var itemContent = prepareItemContentForAI(itemDetails, objectType, schema);

    // Get AI detail level preference
    var detailLevel = PropertiesService.getUserProperties().getProperty(AI_DETAIL_LEVEL_KEY) || 'medium';

    // Generate context-aware prompt
    var prompt = generateContextAwarePrompt(itemContent, userPrompt, detailLevel, itemIndex, totalItems, objectType, schema);

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
 * Legacy function for backward compatibility
 * @deprecated Use generateAISummaryWithContext instead
 */
function generateAISummary(itemDetails) {
  var defaultPrompt = 'Provide a technical summary suitable for engineering review.';
  return generateAISummaryWithContext(itemDetails, defaultPrompt, 1, 1);
}

/**
 * Prepares Arena item content for AI processing (filtered by schema)
 * @param {Object} itemDetails - Arena item details
 * @param {string} objectType - Object type (item, change, quality)
 * @param {Object} schema - Schema configuration
 * @return {string} Formatted content string
 */
function prepareItemContentForAI(itemDetails, objectType, schema) {
  var content = [];

  // Get selected fields for this object type
  var objectSchema = schema[objectType + 's'] || schema.items; // 'items', 'changes', 'quality'
  var selectedFields = objectSchema.fields || [];

  // If no fields selected, include all
  if (selectedFields.length === 0) {
    return JSON.stringify(itemDetails, null, 2);
  }

  // Extract and format only selected fields
  selectedFields.forEach(function(field) {
    var value = extractFieldValue(itemDetails, field);
    if (value !== null && value !== undefined && value !== 'N/A') {
      var label = formatFieldLabel(field);
      content.push(label + ': ' + value);
    }
  });

  // Add custom attributes if they exist and are relevant
  var attributes = itemDetails.additionalAttributes || itemDetails.AdditionalAttributes || [];
  if (attributes.length > 0 && selectedFields.indexOf('additionalAttributes') !== -1) {
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
 * Extracts field value from item details (handles nested objects and both casings)
 * @param {Object} itemDetails - Item details object
 * @param {string} field - Field name
 * @return {string} Field value or 'N/A'
 */
function extractFieldValue(itemDetails, field) {
  // Try both camelCase and PascalCase
  var value = itemDetails[field] || itemDetails[field.charAt(0).toUpperCase() + field.slice(1)];

  if (value === null || value === undefined) {
    return 'N/A';
  }

  // Handle nested objects (like category, lifecyclePhase)
  if (typeof value === 'object' && value !== null) {
    return value.name || value.Name || JSON.stringify(value);
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.length + ' item(s)';
  }

  // Handle dates
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    var date = new Date(value);
    return date.toLocaleDateString();
  }

  return String(value);
}

/**
 * Formats field name for display
 * @param {string} field - Field name in camelCase
 * @return {string} Formatted label
 */
function formatFieldLabel(field) {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, function(str) { return str.toUpperCase(); });
}

/**
 * Detects object type from item details
 * @param {Object} itemDetails - Item details
 * @return {string} Object type (item, change, quality, request)
 */
function detectObjectType(itemDetails) {
  var number = itemDetails.number || itemDetails.Number || '';

  if (number.indexOf('ECO') === 0) {
    return 'change';
  } else if (number.indexOf('ECR') === 0) {
    return 'request';
  } else if (number.indexOf('CAR') === 0 || number.indexOf('NCMR') === 0 || number.indexOf('NCR') === 0) {
    return 'quality';
  }

  return 'item';
}

/**
 * Generates context-aware prompt with Arena PLM knowledge and user intent
 * @param {string} itemContent - Item content
 * @param {string} userPrompt - User's presentation intent
 * @param {string} detailLevel - Detail level (brief, medium, detailed)
 * @param {number} itemIndex - Current item number
 * @param {number} totalItems - Total items in presentation
 * @param {string} objectType - Object type (item, change, quality)
 * @param {Object} schema - Schema configuration
 * @return {string} Context-aware prompt for AI
 */
function generateContextAwarePrompt(itemContent, userPrompt, detailLevel, itemIndex, totalItems, objectType, schema) {
  // Arena PLM Context
  var arenaContext = `You are an AI assistant helping create a presentation from Arena PLM data.

ARENA PLM CONTEXT:
- Arena is a Product Lifecycle Management system used for managing items, changes, and quality processes
- Items include: Parts, assemblies, documents, and other product components
- Key Arena concepts:
  * Item Number: Unique identifier (e.g., "900-00001", "ECO-000123", "NCMR-456")
  * Lifecycle Phase: Status like "Design", "Production", "Obsolete"
  * Category: Classification of the item type
  * Revisions: Version history (Working revision is editable, released revisions are locked)
  * Changes (ECOs): Engineering Change Orders that formally document modifications
  * Quality Records (NCMRs/CAPAs): Nonconformance reports and corrective actions
  * BOM: Bill of Materials showing assemblies and components

USER'S PRESENTATION GOAL:
${userPrompt}

SLIDE POSITION: This is slide ${itemIndex} of ${totalItems} in the presentation.
`;

  // Detail level instructions
  var detailInstructions = {
    'brief': 'Create a concise, executive-level summary (3-5 bullets) focusing on key takeaways relevant to the presentation goal.',
    'medium': 'Create a balanced summary (5-7 bullets) with important details that support the presentation narrative.',
    'detailed': 'Create a comprehensive technical summary (7-10 bullets) with full context and details for deep understanding.'
  };

  var instruction = detailInstructions[detailLevel] || detailInstructions['medium'];

  // Get custom instructions from schema
  var objectSchema = schema[objectType + 's'] || schema.items; // 'items', 'changes', 'quality'
  var customInstructions = objectSchema.instructions || '';

  // Build object-specific requirements
  var objectTypeInstructions = '';
  if (objectType === 'quality') {
    objectTypeInstructions = '- This is a QUALITY RECORD (NCMR/CAPA): Emphasize problem description, root cause, containment actions, corrective actions, and preventive measures\n';
  } else if (objectType === 'change') {
    objectTypeInstructions = '- This is a CHANGE (ECO): Emphasize what changed, why it changed, the impact, status, and timeline\n';
  } else if (objectType === 'request') {
    objectTypeInstructions = '- This is a REQUEST (ECR): Emphasize the problem or opportunity being addressed, business justification, priority, status, and expected outcome\n';
  } else {
    objectTypeInstructions = '- This is an ITEM: Emphasize purpose, specifications, current status, lifecycle phase, and key attributes\n';
  }

  var fullPrompt = arenaContext + '\n' +
    'TASK:\n' +
    instruction + '\n\n' +
    'ARENA ITEM DATA:\n' +
    itemContent + '\n\n' +
    'REQUIREMENTS:\n' +
    '- Focus on information relevant to: ' + userPrompt + '\n' +
    objectTypeInstructions +
    '- Use clear, professional language appropriate for the audience\n' +
    '- Highlight key technical details, status, and implications\n';

  // Add custom instructions if provided
  if (customInstructions) {
    fullPrompt += '- CUSTOM INSTRUCTIONS: ' + customInstructions + '\n';
  }

  fullPrompt += '\nFORMAT:\n' +
    'Provide your response in this exact format:\n\n' +
    'MAIN CONTENT:\n' +
    '[Bullet points for the slide - these will be displayed prominently]\n\n' +
    'DETAILED NOTES:\n' +
    '[Additional speaker notes and context - these will be in presenter notes]';

  return fullPrompt;
}

/**
 * Legacy prompt generator for backward compatibility
 * @deprecated Use generateContextAwarePrompt instead
 */
function generatePrompt(itemContent, detailLevel) {
  var defaultPrompt = 'Provide a technical summary suitable for engineering review.';
  return generateContextAwarePrompt(itemContent, defaultPrompt, detailLevel, 1, 1);
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
