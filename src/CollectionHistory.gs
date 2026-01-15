/**
 * Collection History Management
 *
 * Manages saved collections for quick access to previously created item lists
 */

var COLLECTION_HISTORY_KEY = 'collection_history';
var MAX_SAVED_COLLECTIONS = 5;

/**
 * Saves a collection to history
 * @param {Array} items - Array of Arena items
 * @param {string} name - Optional custom name
 * @return {Object} Result with success status
 */
function saveCollectionToHistory(items, name) {
  try {
    if (!items || items.length === 0) {
      return { success: false, message: 'No items to save' };
    }

    var history = getCollectionHistory();

    // Generate automatic name if not provided
    if (!name || name.trim() === '') {
      name = generateCollectionName(items);
    }

    // Create collection entry
    var collection = {
      name: name,
      timestamp: new Date().toISOString(),
      itemCount: items.length,
      items: items.map(function(item) {
        // Store minimal data to save space
        return {
          guid: item.guid || item.Guid,
          number: item.number || item.Number,
          name: item.name || item.Name,
          description: (item.description || item.Description || '').substring(0, 100) // Truncate
        };
      })
    };

    // Add to beginning of history
    history.unshift(collection);

    // Keep only last MAX_SAVED_COLLECTIONS
    if (history.length > MAX_SAVED_COLLECTIONS) {
      history = history.slice(0, MAX_SAVED_COLLECTIONS);
    }

    // Save back to properties
    var userProps = PropertiesService.getUserProperties();
    userProps.setProperty(COLLECTION_HISTORY_KEY, JSON.stringify(history));

    Logger.log('Saved collection: ' + name + ' (' + items.length + ' items)');

    return {
      success: true,
      message: 'Collection saved: ' + name
    };

  } catch (error) {
    Logger.log('Error saving collection: ' + error.message);
    return {
      success: false,
      message: 'Error saving collection: ' + error.message
    };
  }
}

/**
 * Gets collection history
 * @return {Array} Array of saved collections
 */
function getCollectionHistory() {
  try {
    var userProps = PropertiesService.getUserProperties();
    var historyJson = userProps.getProperty(COLLECTION_HISTORY_KEY);

    if (!historyJson) {
      return [];
    }

    return JSON.parse(historyJson);
  } catch (error) {
    Logger.log('Error loading collection history: ' + error.message);
    return [];
  }
}

/**
 * Loads a specific collection by index
 * @param {number} index - Index in history array
 * @return {Object} Collection object with items
 */
function loadCollection(index) {
  try {
    var history = getCollectionHistory();

    if (index < 0 || index >= history.length) {
      return { success: false, message: 'Invalid collection index' };
    }

    var collection = history[index];

    return {
      success: true,
      name: collection.name,
      items: collection.items,
      timestamp: collection.timestamp
    };

  } catch (error) {
    Logger.log('Error loading collection: ' + error.message);
    return {
      success: false,
      message: 'Error loading collection: ' + error.message
    };
  }
}

/**
 * Deletes a collection from history
 * @param {number} index - Index to delete
 * @return {Object} Result with success status
 */
function deleteCollectionFromHistory(index) {
  try {
    var history = getCollectionHistory();

    if (index < 0 || index >= history.length) {
      return { success: false, message: 'Invalid collection index' };
    }

    var deleted = history.splice(index, 1)[0];

    // Save updated history
    var userProps = PropertiesService.getUserProperties();
    userProps.setProperty(COLLECTION_HISTORY_KEY, JSON.stringify(history));

    return {
      success: true,
      message: 'Deleted collection: ' + deleted.name
    };

  } catch (error) {
    Logger.log('Error deleting collection: ' + error.message);
    return {
      success: false,
      message: 'Error: ' + error.message
    };
  }
}

/**
 * Generates an automatic name for a collection
 * @param {Array} items - Collection items
 * @return {string} Generated name
 */
function generateCollectionName(items) {
  var now = new Date();
  var dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'MMM dd, HH:mm');

  // Try to create a descriptive name from item types
  var types = {};
  items.forEach(function(item) {
    var number = item.number || item.Number || '';

    if (number.indexOf('ECO') === 0) {
      types['ECOs'] = (types['ECOs'] || 0) + 1;
    } else if (number.indexOf('NCMR') === 0 || number.indexOf('NCR') === 0) {
      types['Quality'] = (types['Quality'] || 0) + 1;
    } else {
      types['Items'] = (types['Items'] || 0) + 1;
    }
  });

  // Build description
  var parts = [];
  for (var type in types) {
    parts.push(types[type] + ' ' + type);
  }

  var description = parts.length > 0 ? parts.join(', ') : items.length + ' items';

  return description + ' - ' + dateStr;
}

/**
 * Clears all collection history
 */
function clearCollectionHistory() {
  var userProps = PropertiesService.getUserProperties();
  userProps.deleteProperty(COLLECTION_HISTORY_KEY);
  return { success: true, message: 'Collection history cleared' };
}

/**
 * Renames a collection
 * @param {number} index - Index of collection to rename
 * @param {string} newName - New name for the collection
 * @return {Object} Result with success status
 */
function renameCollection(index, newName) {
  try {
    var history = getCollectionHistory();

    if (index < 0 || index >= history.length) {
      return { success: false, message: 'Invalid collection index' };
    }

    if (!newName || newName.trim() === '') {
      return { success: false, message: 'Name cannot be empty' };
    }

    history[index].name = newName.trim();

    // Save updated history
    var userProps = PropertiesService.getUserProperties();
    userProps.setProperty(COLLECTION_HISTORY_KEY, JSON.stringify(history));

    return {
      success: true,
      message: 'Collection renamed to: ' + newName
    };

  } catch (error) {
    Logger.log('Error renaming collection: ' + error.message);
    return {
      success: false,
      message: 'Error: ' + error.message
    };
  }
}

/**
 * Loads a collection and opens the search dialog with those items
 * @param {number} index - Index of collection to load
 * @return {Object} Result with success status
 */
function loadCollectionAndOpenSearch(index) {
  try {
    var collection = loadCollection(index);

    if (!collection.success) {
      return collection;
    }

    // Store items in cache for search dialog to pick up
    var cache = CacheService.getUserCache();
    cache.put('loaded_collection', JSON.stringify(collection.items), 600);
    cache.put('loaded_collection_name', collection.name, 600);

    // Open search dialog
    showSearchDialog();

    return {
      success: true,
      message: 'Collection loaded'
    };

  } catch (error) {
    Logger.log('Error loading collection for search: ' + error.message);
    return {
      success: false,
      message: 'Error: ' + error.message
    };
  }
}
