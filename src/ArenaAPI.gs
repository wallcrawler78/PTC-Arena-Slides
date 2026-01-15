/**
 * Arena API Integration Module
 *
 * Handles all communication with Arena PLM REST API
 * Based on lessons learned from Arena Sheets DataCenter project
 */

var BASE_URL = 'https://api.arenasolutions.com/v1';

/**
 * Arena API Client Class
 */
var ArenaAPIClient = (function() {

  function ArenaAPIClient() {
    this.sessionId = getArenaSessionId();
  }

  /**
   * Makes an authenticated request to Arena API
   * @param {string} endpoint - API endpoint (e.g., '/items')
   * @param {Object} options - Request options
   * @return {Object} Parsed JSON response
   */
  ArenaAPIClient.prototype.makeRequest = function(endpoint, options) {
    options = options || {};
    var url = BASE_URL + endpoint;

    var headers = {
      'Content-Type': 'application/json',
      'arena_session_id': this.sessionId
    };

    var fetchOptions = {
      method: options.method || 'GET',
      headers: headers,
      muteHttpExceptions: true
    };

    if (options.payload) {
      fetchOptions.payload = JSON.stringify(options.payload);
    }

    var response = UrlFetchApp.fetch(url, fetchOptions);
    var responseCode = response.getResponseCode();

    // Handle session expiration (401)
    if (responseCode === 401) {
      Logger.log('Session expired, attempting re-login...');
      clearArenaSession();
      this.sessionId = getValidArenaSessionId();

      if (!this.sessionId) {
        throw new Error('Session expired. Please log in again.');
      }

      // Retry request with new session
      headers['arena_session_id'] = this.sessionId;
      fetchOptions.headers = headers;
      response = UrlFetchApp.fetch(url, fetchOptions);
      responseCode = response.getResponseCode();
    }

    // Handle errors
    if (responseCode === 400) {
      var error = JSON.parse(response.getContentText());
      throw new Error('Validation error: ' + (error.errors ? error.errors[0].message : error.message));
    }

    if (responseCode === 409) {
      throw new Error('Conflict: Resource already exists');
    }

    if (responseCode !== 200 && responseCode !== 201) {
      throw new Error('API error ' + responseCode + ': ' + response.getContentText());
    }

    return JSON.parse(response.getContentText());
  };

  /**
   * Gets all items from Arena with pagination
   * @param {Object} filters - Optional filters
   * @return {Array} Array of items
   */
  ArenaAPIClient.prototype.getAllItems = function(filters) {
    var allItems = [];
    var offset = 0;
    var limit = 400; // Arena's max per request

    while (true) {
      var endpoint = '/items?limit=' + limit + '&offset=' + offset + '&responseview=full';
      var response = this.makeRequest(endpoint, { method: 'GET' });

      // Handle both response formats (results vs Results)
      var items = response.results || response.Results || [];
      allItems = allItems.concat(items);

      if (items.length < limit) {
        break; // No more results
      }

      offset += limit;
    }

    return allItems;
  };

  /**
   * Gets a single item by GUID
   * @param {string} guid - Item GUID
   * @return {Object} Item object
   */
  ArenaAPIClient.prototype.getItem = function(guid) {
    var endpoint = '/items/' + guid + '?responseview=full';
    return this.makeRequest(endpoint, { method: 'GET' });
  };

  /**
   * Gets a single change (ECO) by GUID
   * @param {string} guid - Change GUID
   * @return {Object} Change object
   */
  ArenaAPIClient.prototype.getChange = function(guid) {
    var endpoint = '/changes/' + guid + '?responseview=full';
    return this.makeRequest(endpoint, { method: 'GET' });
  };

  /**
   * Gets a single quality record by GUID
   * @param {string} guid - Quality record GUID
   * @return {Object} Quality record object
   */
  ArenaAPIClient.prototype.getQualityRecord = function(guid) {
    // Try multiple possible endpoints for quality details
    var possibleEndpoints = [
      '/qualityprocesses/' + guid + '?responseview=full',
      '/quality/processes/' + guid + '?responseview=full',
      '/ncrs/' + guid + '?responseview=full'
    ];

    for (var i = 0; i < possibleEndpoints.length; i++) {
      try {
        return this.makeRequest(possibleEndpoints[i], { method: 'GET' });
      } catch (error) {
        if (i === possibleEndpoints.length - 1) {
          // Last endpoint failed, throw error
          throw error;
        }
        // Try next endpoint
      }
    }
  };

  /**
   * Gets file attachments for an item
   * @param {string} guid - Item GUID
   * @return {Array} Array of file objects
   */
  ArenaAPIClient.prototype.getItemFiles = function(guid) {
    try {
      var endpoint = '/items/' + guid + '/files';
      var response = this.makeRequest(endpoint, { method: 'GET' });
      return response.results || response.Results || [];
    } catch (error) {
      Logger.log('Error fetching files for item ' + guid + ': ' + error.message);
      return [];
    }
  };

  /**
   * Gets file content/download URL
   * @param {string} itemGuid - Item GUID
   * @param {string} fileGuid - File GUID
   * @return {Object} File content or URL information
   */
  ArenaAPIClient.prototype.getFileContent = function(itemGuid, fileGuid) {
    try {
      var endpoint = '/items/' + itemGuid + '/files/' + fileGuid + '/content';
      // This returns the actual file content or a download URL
      return this.makeRequest(endpoint, { method: 'GET' });
    } catch (error) {
      Logger.log('Error fetching file content: ' + error.message);
      return null;
    }
  };

  /**
   * Searches for items by number
   * @param {string} itemNumber - Item number to search for
   * @return {Object|null} Item object or null if not found
   */
  ArenaAPIClient.prototype.findItemByNumber = function(itemNumber) {
    var allItems = this.getAllItems();

    for (var i = 0; i < allItems.length; i++) {
      var item = allItems[i];
      var number = item.number || item.Number;
      if (number === itemNumber) {
        return item;
      }
    }

    return null;
  };

  /**
   * Searches items by name or description
   * @param {string} searchTerm - Search term
   * @return {Array} Array of matching items
   */
  ArenaAPIClient.prototype.searchItems = function(searchTerm) {
    var allItems = this.getAllItems();
    var results = [];
    var lowerSearchTerm = searchTerm.toLowerCase();

    for (var i = 0; i < allItems.length; i++) {
      var item = allItems[i];
      var name = (item.name || item.Name || '').toLowerCase();
      var number = (item.number || item.Number || '').toLowerCase();
      var description = (item.description || item.Description || '').toLowerCase();

      if (name.indexOf(lowerSearchTerm) !== -1 ||
          number.indexOf(lowerSearchTerm) !== -1 ||
          description.indexOf(lowerSearchTerm) !== -1) {
        results.push(item);
      }
    }

    return results;
  };

  /**
   * Gets changes (ECOs) from Arena
   * @return {Array} Array of changes
   */
  ArenaAPIClient.prototype.getChanges = function() {
    var endpoint = '/changes?limit=100';
    var response = this.makeRequest(endpoint, { method: 'GET' });
    return response.results || response.Results || [];
  };

  /**
   * Gets quality records from Arena
   * Note: Arena's quality endpoint structure varies by workspace configuration
   * Common endpoints: /qualityprocesses, /quality/processes, /ncrs
   * @return {Array} Array of quality records
   */
  ArenaAPIClient.prototype.getQualityRecords = function() {
    // Try multiple possible endpoints for quality records
    var possibleEndpoints = [
      '/qualityprocesses?limit=100',
      '/quality/processes?limit=100',
      '/ncrs?limit=100',
      '/quality?limit=100'
    ];

    for (var i = 0; i < possibleEndpoints.length; i++) {
      try {
        Logger.log('Trying quality endpoint: ' + possibleEndpoints[i]);
        var response = this.makeRequest(possibleEndpoints[i], { method: 'GET' });
        var results = response.results || response.Results || [];
        Logger.log('Found ' + results.length + ' quality records at: ' + possibleEndpoints[i]);
        return results;
      } catch (error) {
        Logger.log('Endpoint ' + possibleEndpoints[i] + ' failed: ' + error.message);
        // Continue to next endpoint
      }
    }

    // If all endpoints fail, return empty array with warning
    Logger.log('Warning: No quality endpoint found. Quality search is not available.');
    throw new Error('Quality records are not available in your Arena workspace. Please search for Items or Changes instead.');
  };

  return ArenaAPIClient;
})();

/**
 * Login to Arena
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} workspaceId - Workspace ID
 * @return {Object} Result object
 */
function loginToArena(email, password, workspaceId) {
  try {
    var loginUrl = 'https://api.arenasolutions.com/v1/login';

    var payload = {
      email: email,
      password: password,
      workspaceId: workspaceId
    };

    var options = {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(loginUrl, options);
    var responseCode = response.getResponseCode();

    if (responseCode !== 200) {
      var error = JSON.parse(response.getContentText());
      return {
        success: false,
        message: 'Login failed: ' + (error.message || 'Invalid credentials')
      };
    }

    var result = JSON.parse(response.getContentText());
    var sessionId = result.arenaSessionId || result.ArenaSessionId;

    // Store credentials
    saveArenaCredentials(email, sessionId, workspaceId);

    return {
      success: true,
      message: 'Successfully logged in to Arena'
    };

  } catch (error) {
    Logger.log('Login error: ' + error.message);
    return {
      success: false,
      message: 'Error: ' + error.message
    };
  }
}

/**
 * Gets detailed Arena item information
 * @param {string} guid - Item GUID
 * @param {string} type - Optional type hint: 'item', 'change', 'quality'
 * @return {Object} Detailed item information
 */
function getArenaItemDetails(guid, type) {
  var client = new ArenaAPIClient();

  // If type is specified, use appropriate endpoint
  if (type === 'change') {
    return client.getChange(guid);
  } else if (type === 'quality') {
    return client.getQualityRecord(guid);
  }

  // Default to item endpoint
  return client.getItem(guid);
}

/**
 * Searches Arena for items
 * @param {string} searchTerm - Search term
 * @param {string} searchType - Type of search (items, changes, quality)
 * @return {Array} Search results
 */
function searchArena(searchTerm, searchType) {
  try {
    var client = new ArenaAPIClient();

    switch (searchType) {
      case 'items':
        Logger.log('Searching items for: ' + searchTerm);
        return client.searchItems(searchTerm);

      case 'changes':
        Logger.log('Searching changes for: ' + searchTerm);
        var changes = client.getChanges();
        return filterBySearchTerm(changes, searchTerm);

      case 'quality':
        Logger.log('Searching quality records for: ' + searchTerm);
        try {
          var quality = client.getQualityRecords();
          return filterBySearchTerm(quality, searchTerm);
        } catch (qualityError) {
          // Quality endpoint not available - provide helpful error
          throw new Error('Quality Records search is not available in your Arena workspace.\n\n' +
                         'This could be because:\n' +
                         '• Your workspace doesn\'t have quality processes enabled\n' +
                         '• The quality API endpoint structure is different\n\n' +
                         'Please try searching for "Items" or "Changes" instead.');
        }

      default:
        return client.searchItems(searchTerm);
    }
  } catch (error) {
    Logger.log('Search error: ' + error.message);
    Logger.log('Search type: ' + searchType);
    Logger.log('Search term: ' + searchTerm);
    throw error;
  }
}

/**
 * Filters results by search term
 * @param {Array} items - Items to filter
 * @param {string} searchTerm - Search term
 * @return {Array} Filtered items
 */
function filterBySearchTerm(items, searchTerm) {
  var results = [];
  var lowerSearchTerm = searchTerm.toLowerCase();

  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var itemStr = JSON.stringify(item).toLowerCase();

    if (itemStr.indexOf(lowerSearchTerm) !== -1) {
      results.push(item);
    }
  }

  return results;
}

/**
 * Gets image attachments for an Arena item
 * @param {string} itemGuid - Item GUID
 * @return {Array} Array of image file objects with download info
 */
function getItemImages(itemGuid) {
  try {
    var client = new ArenaAPIClient();
    var files = client.getItemFiles(itemGuid);

    if (!files || files.length === 0) {
      return [];
    }

    // Filter for image files
    var imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    var images = [];

    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      var fileName = file.title || file.Title || file.name || file.Name || '';
      var extension = fileName.split('.').pop().toLowerCase();

      if (imageExtensions.indexOf(extension) !== -1) {
        images.push({
          guid: file.guid || file.Guid,
          name: fileName,
          title: file.title || file.Title || fileName,
          extension: extension,
          size: file.size || file.Size || 0,
          edition: file.edition || file.Edition
        });
      }
    }

    Logger.log('Found ' + images.length + ' image(s) for item ' + itemGuid);
    return images;

  } catch (error) {
    Logger.log('Error getting item images: ' + error.message);
    return [];
  }
}
