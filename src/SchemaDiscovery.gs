/**
 * Schema Discovery Module
 *
 * Discovers actual field schemas from Arena by fetching sample objects
 * and extracting their field structure dynamically
 */

/**
 * Discovers field schema for all object types from Arena
 * @return {Object} Schema object with fields for items, changes, quality
 */
function discoverArenaSchema() {
  try {
    var schema = {
      items: { fields: [], lastUpdated: new Date().toISOString() },
      changes: { fields: [], lastUpdated: new Date().toISOString() },
      quality: { fields: [], lastUpdated: new Date().toISOString() }
    };

    var client = new ArenaAPIClient();

    // Discover Items schema
    try {
      Logger.log('Discovering Items schema...');
      var items = client.getAllItems();
      if (items && items.length > 0) {
        schema.items.fields = extractFieldNames(items[0]);
        Logger.log('Items: Found ' + schema.items.fields.length + ' fields');
      }
    } catch (error) {
      Logger.log('Error discovering Items schema: ' + error.message);
      schema.items.fields = getDefaultItemFields();
    }

    // Discover Changes schema
    try {
      Logger.log('Discovering Changes schema...');
      var changes = client.getChanges();
      if (changes && changes.length > 0) {
        schema.changes.fields = extractFieldNames(changes[0]);
        Logger.log('Changes: Found ' + schema.changes.fields.length + ' fields');
      }
    } catch (error) {
      Logger.log('Error discovering Changes schema: ' + error.message);
      schema.changes.fields = getDefaultChangeFields();
    }

    // Discover Quality schema
    try {
      Logger.log('Discovering Quality schema...');
      var quality = client.getQualityRecords();
      if (quality && quality.length > 0) {
        schema.quality.fields = extractFieldNames(quality[0]);
        Logger.log('Quality: Found ' + schema.quality.fields.length + ' fields');
      }
    } catch (error) {
      Logger.log('Error discovering Quality schema: ' + error.message);
      schema.quality.fields = getDefaultQualityFields();
    }

    return {
      success: true,
      schema: schema
    };

  } catch (error) {
    Logger.log('Schema discovery error: ' + error.message);
    return {
      success: false,
      message: 'Error discovering schema: ' + error.message,
      schema: getDefaultSchema()
    };
  }
}

/**
 * Extracts field names from an Arena object
 * @param {Object} obj - Arena object (item, change, or quality record)
 * @return {Array} Array of field names
 */
function extractFieldNames(obj) {
  if (!obj) return [];

  var fields = [];
  var excludedFields = [
    'guid', 'Guid', 'url', 'URL', 'createdBy', 'CreatedBy',
    'modifiedBy', 'ModifiedBy', 'createdDateTime', 'CreatedDateTime',
    'modifiedDateTime', 'ModifiedDateTime', 'effectiveDateTime', 'EffectiveDateTime'
  ];

  // Extract top-level fields
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      // Skip excluded system fields
      if (excludedFields.indexOf(key) !== -1) {
        continue;
      }

      // Skip if it's a complex object (unless it's a common one we want)
      var value = obj[key];
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Include common nested objects like category, lifecyclePhase
        var commonNestedFields = ['category', 'lifecyclePhase', 'owner', 'creator', 'status'];
        if (commonNestedFields.indexOf(key) !== -1 || commonNestedFields.indexOf(key.toLowerCase()) !== -1) {
          fields.push(key);
        }
      } else {
        // Include primitive values and arrays
        fields.push(key);
      }
    }
  }

  // Sort alphabetically for consistency
  fields.sort(function(a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  });

  return fields;
}

/**
 * Gets default item fields (fallback)
 */
function getDefaultItemFields() {
  return [
    'number', 'name', 'description', 'category', 'lifecyclePhase', 'revisionNumber',
    'owner', 'effectivityDate', 'procurementType', 'uom', 'offTheShelf', 'cost'
  ];
}

/**
 * Gets default change fields (fallback)
 */
function getDefaultChangeFields() {
  return [
    'number', 'title', 'description', 'status', 'category', 'severity', 'effectivityType',
    'creator', 'submittedDateTime', 'targetImplementationDate', 'implementationDate',
    'routingStatus', 'impactedItems', 'reason'
  ];
}

/**
 * Gets default quality fields (fallback)
 */
function getDefaultQualityFields() {
  return [
    'number', 'title', 'description', 'status', 'category', 'severity', 'problemDescription',
    'rootCause', 'containmentAction', 'correctiveAction', 'preventiveAction',
    'closureDate', 'impactedItems', 'disposition'
  ];
}

/**
 * Merges discovered schema with user preferences
 * Preserves user selections for fields that still exist
 * @param {Object} discoveredSchema - Newly discovered schema
 * @param {Object} userPreferences - Current user schema preferences
 * @return {Object} Merged schema with preserved selections
 */
function mergeSchemaWithPreferences(discoveredSchema, userPreferences) {
  var merged = {
    items: { fields: [], instructions: '' },
    changes: { fields: [], instructions: '' },
    quality: { fields: [], instructions: '' }
  };

  ['items', 'changes', 'quality'].forEach(function(type) {
    // Get discovered available fields
    var availableFields = discoveredSchema[type] ? discoveredSchema[type].fields : [];

    // Get user's previously selected fields
    var selectedFields = userPreferences[type] ? userPreferences[type].fields : [];

    // Preserve selections for fields that still exist
    merged[type].fields = availableFields.filter(function(field) {
      // If no previous preferences, select all fields by default
      if (!selectedFields || selectedFields.length === 0) {
        return true;
      }
      // Otherwise, keep field if it was previously selected
      return selectedFields.indexOf(field) !== -1;
    });

    // Preserve instructions
    merged[type].instructions = userPreferences[type] ? userPreferences[type].instructions : '';
  });

  return merged;
}

/**
 * Refreshes schema and merges with user preferences
 * @return {Object} Result with merged schema
 */
function refreshSchemaWithPreferences() {
  try {
    // Get current user preferences
    var currentPreferences = getSchemaSettings();

    // Discover current Arena schema
    var discoveryResult = discoverArenaSchema();

    if (!discoveryResult.success) {
      return {
        success: false,
        message: discoveryResult.message,
        schema: currentPreferences // Return current preferences on error
      };
    }

    // Merge discovered schema with user preferences
    var mergedSchema = mergeSchemaWithPreferences(discoveryResult.schema, currentPreferences);

    // Save merged schema
    saveSchemaSettings(mergedSchema);

    return {
      success: true,
      message: 'Schema refreshed successfully',
      schema: mergedSchema,
      discoveredSchema: discoveryResult.schema // Also return discovered for comparison
    };

  } catch (error) {
    Logger.log('Error refreshing schema: ' + error.message);
    return {
      success: false,
      message: 'Error: ' + error.message,
      schema: getSchemaSettings()
    };
  }
}
