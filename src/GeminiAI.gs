/**
 * Gemini AI Integration Module
 *
 * Handles AI-powered content summarization using Google's Gemini API
 */

// Use v1beta API with Gemini 2.0 Flash Experimental (current as of Jan 2026)
var GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

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

/**
 * Generates holistic collection synthesis from multiple Arena items
 * Analyzes all items together to identify relationships and create cohesive narrative
 * @param {Array} allItemsData - Array of {itemDetails, objectType, number, images} objects
 * @param {string} userPrompt - User's presentation intent
 * @return {Object} Collection synthesis with slides array
 */
function generateCollectionSynthesis(allItemsData, userPrompt) {
  try {
    var apiKey = getGeminiApiKey();

    if (!apiKey) {
      Logger.log('WARNING: No Gemini API key configured, using basic collection summary');
      Logger.log('Please configure your API key in Arena Slides > Settings > General');
      return generateBasicCollectionSummary(allItemsData);
    }

    Logger.log('API key found, proceeding with AI synthesis');

    // Get schema configuration
    var schema = getSchemaSettings();
    Logger.log('Schema loaded: ' + JSON.stringify(Object.keys(schema)));

    // Get AI detail level preference
    var detailLevel = PropertiesService.getUserProperties().getProperty(AI_DETAIL_LEVEL_KEY) || 'medium';
    Logger.log('Detail level: ' + detailLevel);

    // Build comprehensive collection context
    Logger.log('Building collection context for ' + allItemsData.length + ' items...');
    var collectionContext = buildCollectionContext(allItemsData, schema);
    Logger.log('Collection context built: ' + collectionContext.length + ' characters');
    Logger.log('First 500 chars of context: ' + collectionContext.substring(0, 500));

    // Generate collection synthesis prompt
    Logger.log('Generating synthesis prompt...');
    var prompt = generateCollectionSynthesisPrompt(collectionContext, userPrompt, detailLevel, allItemsData.length);
    Logger.log('Prompt generated: ' + prompt.length + ' characters');

    Logger.log('Sending collection synthesis request to Gemini...');

    // Call Gemini API
    var synthesis = callGeminiAPI(prompt, apiKey);
    Logger.log('Received synthesis from Gemini: ' + synthesis.length + ' characters');
    Logger.log('First 500 chars of synthesis: ' + synthesis.substring(0, 500));

    // Parse synthesis response
    Logger.log('Parsing synthesis response...');
    var result = parseCollectionSynthesisResponse(synthesis, allItemsData);
    Logger.log('Parsed ' + result.slides.length + ' slide(s) from synthesis');

    return result;

  } catch (error) {
    Logger.log('ERROR in collection synthesis: ' + error.message);
    Logger.log('Error stack: ' + error.stack);
    Logger.log('Falling back to basic collection summary');
    return generateBasicCollectionSummary(allItemsData);
  }
}

/**
 * Builds comprehensive collection context for AI analysis
 * @param {Array} allItemsData - Array of item data objects
 * @param {Object} schema - Schema configuration
 * @return {string} Formatted collection context
 */
function buildCollectionContext(allItemsData, schema) {
  var context = [];

  context.push('COLLECTION OVERVIEW:');
  context.push('Total Items: ' + allItemsData.length);

  // Categorize items by type
  var itemsByType = {
    items: [],
    changes: [],
    requests: [],
    quality: []
  };

  allItemsData.forEach(function(itemData) {
    var typeKey = itemData.objectType + 's';
    if (!itemsByType[typeKey]) {
      typeKey = 'items';
    }
    itemsByType[typeKey].push(itemData);
  });

  // Summary by type
  var typeSummary = [];
  if (itemsByType.items.length > 0) typeSummary.push(itemsByType.items.length + ' Items');
  if (itemsByType.changes.length > 0) typeSummary.push(itemsByType.changes.length + ' Changes (ECOs)');
  if (itemsByType.requests.length > 0) typeSummary.push(itemsByType.requests.length + ' Requests (ECRs)');
  if (itemsByType.quality.length > 0) typeSummary.push(itemsByType.quality.length + ' Quality Records');

  context.push('Breakdown: ' + typeSummary.join(', '));
  context.push('');

  // Add detailed information for each item
  context.push('DETAILED ITEM INFORMATION:');
  context.push('');

  allItemsData.forEach(function(itemData, index) {
    context.push('--- ITEM ' + (index + 1) + ' ---');
    context.push('Number: ' + itemData.number);
    context.push('Type: ' + itemData.objectType.toUpperCase());

    // Get formatted content using schema-filtered fields
    var itemContent = prepareItemContentForAI(itemData.itemDetails, itemData.objectType, schema);
    context.push(itemContent);

    // Add image info if available
    if (itemData.images && itemData.images.length > 0) {
      context.push('Images: ' + itemData.images.length + ' image(s) available');
    }

    context.push('');
  });

  return context.join('\n');
}

/**
 * Generates collection synthesis prompt
 * @param {string} collectionContext - Full collection context
 * @param {string} userPrompt - User's presentation intent
 * @param {string} detailLevel - Detail level (brief, medium, detailed)
 * @param {number} totalItems - Total number of items
 * @return {string} Collection synthesis prompt
 */
function generateCollectionSynthesisPrompt(collectionContext, userPrompt, detailLevel, totalItems) {
  // Map detail level to description
  var detailLevelMap = {
    'brief': 'Concise executive summary',
    'medium': 'Balanced technical overview',
    'detailed': 'Comprehensive analysis'
  };
  var detailDescription = detailLevelMap[detailLevel] || detailLevelMap['medium'];

  var prompt = 'You are an AI assistant creating a cohesive presentation from a collection of Arena PLM items.\n\n' +
    'CRITICAL INSTRUCTION: You must analyze this collection HOLISTICALLY. Do not treat each item independently.\n' +
    'Instead, identify relationships, common themes, workflows, and narratives that connect these items together.\n\n' +
    'ARENA PLM CONTEXT:\n' +
    '- Arena is a Product Lifecycle Management system for managing product data, changes, and quality\n' +
    '- Items: Parts, assemblies, documents (identified by item numbers like "900-00001")\n' +
    '- Changes (ECOs): Engineering Change Orders that modify items (identified by "ECO-" prefix)\n' +
    '- Requests (ECRs): Change requests proposing improvements (identified by "ECR-" prefix)\n' +
    '- Quality Records: NCMRs, CAPAs, CARs documenting nonconformances and corrective actions\n\n' +
    'COMMON PATTERNS TO IDENTIFY:\n' +
    '1. CHANGE WORKFLOWS: ECRs → ECOs → affected Items (trace the change journey)\n' +
    '2. QUALITY WORKFLOWS: Quality issue → ECO correction → updated Items\n' +
    '3. PRODUCT FAMILIES: Related items (assemblies and components)\n' +
    '4. LIFECYCLE STAGES: Items at different phases (design, production, obsolete)\n' +
    '5. CROSS-FUNCTIONAL IMPACT: How changes affect multiple items or categories\n\n' +
    'USER\'S PRESENTATION GOAL:\n' +
    userPrompt + '\n\n' +
    collectionContext + '\n\n' +
    'YOUR TASK:\n' +
    'Analyze this collection and create a holistic presentation synthesis that:\n\n' +
    '1. IDENTIFIES RELATIONSHIPS:\n' +
    '   - Which ECOs affect which Items?\n' +
    '   - Which Quality records led to which changes?\n' +
    '   - Which items are related (assembly/component, product family)?\n' +
    '   - What is the timeline or sequence of events?\n\n' +
    '2. CREATES NARRATIVE:\n' +
    '   - What is the overall story this collection tells?\n' +
    '   - What common themes emerge?\n' +
    '   - What is the business/technical context?\n\n' +
    '3. STRUCTURES PRESENTATION:\n' +
    '   - How should this be presented coherently?\n' +
    '   - Should it be one overview slide or multiple thematic slides?\n' +
    '   - What grouping makes the most sense?\n\n' +
    'DETAIL LEVEL: ' + detailDescription + '\n\n' +
    'FORMAT YOUR RESPONSE AS:\n\n' +
    'SYNTHESIS:\n' +
    '[Provide 2-3 paragraphs describing the holistic view of this collection, the relationships you identified, and the narrative]\n\n' +
    'PRESENTATION STRUCTURE:\n' +
    '[Describe how you recommend structuring the slides - e.g., "Single overview slide", "Three slides grouped by theme", etc.]\n\n' +
    'SLIDES:\n' +
    '[For each slide you recommend, provide:]\n\n' +
    'SLIDE 1: [Title]\n' +
    'MAIN CONTENT:\n' +
    '[Bullet points for this slide]\n\n' +
    'DETAILED NOTES:\n' +
    '[Speaker notes for this slide]\n\n' +
    'SLIDE 2: [Title]\n' +
    '...continue for each recommended slide...\n\n' +
    'Remember: Focus on the RELATIONSHIPS and HOLISTIC VIEW, not individual item summaries.';

  return prompt;
}

/**
 * Parses collection synthesis response from AI
 * @param {string} synthesis - Raw AI synthesis response
 * @param {Array} allItemsData - Original item data for reference
 * @return {Object} Parsed synthesis with slides array
 */
function parseCollectionSynthesisResponse(synthesis, allItemsData) {
  var result = {
    synthesis: '',
    presentationStructure: '',
    slides: []
  };

  // Extract synthesis section
  var synthesisMatch = synthesis.match(/SYNTHESIS:\s*([\s\S]*?)(?=PRESENTATION STRUCTURE:|SLIDES:|$)/i);
  if (synthesisMatch) {
    result.synthesis = synthesisMatch[1].trim();
  }

  // Extract presentation structure
  var structureMatch = synthesis.match(/PRESENTATION STRUCTURE:\s*([\s\S]*?)(?=SLIDES:|$)/i);
  if (structureMatch) {
    result.presentationStructure = structureMatch[1].trim();
  }

  // Extract slides
  var slidesSection = synthesis.match(/SLIDES:\s*([\s\S]*)/i);
  if (slidesSection) {
    var slidesText = slidesSection[1];

    // Split by SLIDE N: pattern
    var slideMatches = slidesText.split(/SLIDE \d+:/i);

    for (var i = 1; i < slideMatches.length; i++) {
      var slideText = slideMatches[i];

      // Extract title (first line)
      var lines = slideText.trim().split('\n');
      var title = lines[0].trim();

      // Extract main content
      var mainMatch = slideText.match(/MAIN CONTENT:\s*([\s\S]*?)(?=DETAILED NOTES:|$)/i);
      var mainContent = mainMatch ? mainMatch[1].trim() : '';

      // Extract detailed notes
      var notesMatch = slideText.match(/DETAILED NOTES:\s*([\s\S]*?)(?=SLIDE \d+:|$)/i);
      var detailedNotes = notesMatch ? notesMatch[1].trim() : '';

      result.slides.push({
        title: title,
        mainContent: mainContent,
        detailedNotes: detailedNotes
      });
    }
  }

  // Fallback: if no slides found, create one overview slide
  if (result.slides.length === 0) {
    result.slides.push({
      title: 'Collection Overview',
      mainContent: result.synthesis || synthesis,
      detailedNotes: result.presentationStructure || ''
    });
  }

  return result;
}

/**
 * Generates basic collection summary without AI (fallback)
 * @param {Array} allItemsData - Array of item data objects
 * @return {Object} Basic collection summary
 */
function generateBasicCollectionSummary(allItemsData) {
  var mainContent = 'Collection Summary:\n';
  mainContent += '• Total Items: ' + allItemsData.length + '\n';

  var itemNumbers = allItemsData.map(function(itemData) {
    return itemData.number;
  }).join(', ');

  mainContent += '• Items: ' + itemNumbers;

  var detailedNotes = 'Collection includes:\n';
  allItemsData.forEach(function(itemData) {
    var name = itemData.itemDetails.title || itemData.itemDetails.Title ||
               itemData.itemDetails.name || itemData.itemDetails.Name || 'Untitled';
    detailedNotes += itemData.number + ': ' + name + '\n';
  });

  return {
    synthesis: 'Basic collection of ' + allItemsData.length + ' Arena items',
    presentationStructure: 'Single overview slide',
    slides: [{
      title: 'Arena Collection',
      mainContent: mainContent,
      detailedNotes: detailedNotes
    }]
  };
}
