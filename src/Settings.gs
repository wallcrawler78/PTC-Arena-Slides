/**
 * Settings and Credential Management Module
 *
 * Handles secure storage and retrieval of user credentials and settings
 */

// Arena Credentials
var ARENA_EMAIL_KEY = 'arena_email';
var ARENA_SESSION_ID_KEY = 'arena_session_id';
var ARENA_WORKSPACE_ID_KEY = 'arena_workspace_id';
var ARENA_SESSION_TIMESTAMP_KEY = 'arena_session_timestamp';
var ARENA_SESSION_CACHE_KEY = 'arena_session_valid_cache';
var ARENA_SESSION_CACHE_TIMESTAMP_KEY = 'arena_session_cache_timestamp';

// Gemini API Settings
var GEMINI_API_KEY = 'gemini_api_key';

// Application Settings
var SLIDE_TEMPLATE_PREF_KEY = 'slide_template_preference';
var AI_DETAIL_LEVEL_KEY = 'ai_detail_level';

/**
 * Saves Arena credentials securely
 * @param {string} email - User email
 * @param {string} sessionId - Arena session ID
 * @param {string} workspaceId - Workspace ID
 */
function saveArenaCredentials(email, sessionId, workspaceId) {
  var userProps = PropertiesService.getUserProperties();
  var timestamp = new Date().getTime();

  userProps.setProperties({
    'arena_email': email,
    'arena_session_id': sessionId,
    'arena_workspace_id': workspaceId,
    'arena_session_timestamp': timestamp.toString()
  });

  // Cache the valid state
  cacheSessionValidState(true);

  Logger.log('Arena credentials saved for: ' + email + ' at ' + new Date(timestamp).toISOString());
}

/**
 * Gets Arena session ID
 * @return {string|null} Session ID or null
 */
function getArenaSessionId() {
  return PropertiesService.getUserProperties().getProperty(ARENA_SESSION_ID_KEY);
}

/**
 * Gets Arena email
 * @return {string|null} Email or null
 */
function getArenaEmail() {
  return PropertiesService.getUserProperties().getProperty(ARENA_EMAIL_KEY);
}

/**
 * Gets Arena workspace ID
 * @return {string|null} Workspace ID or null
 */
function getArenaWorkspaceId() {
  return PropertiesService.getUserProperties().getProperty(ARENA_WORKSPACE_ID_KEY);
}

/**
 * Clears Arena credentials (logout)
 */
function clearArenaCredentials() {
  var userProps = PropertiesService.getUserProperties();
  userProps.deleteProperty(ARENA_EMAIL_KEY);
  userProps.deleteProperty(ARENA_SESSION_ID_KEY);
  userProps.deleteProperty(ARENA_WORKSPACE_ID_KEY);
  userProps.deleteProperty(ARENA_SESSION_TIMESTAMP_KEY);
  userProps.deleteProperty(ARENA_SESSION_CACHE_KEY);
  userProps.deleteProperty(ARENA_SESSION_CACHE_TIMESTAMP_KEY);

  Logger.log('Cleared all Arena credentials and session cache');
}

/**
 * Clears just the session ID (for re-login)
 */
function clearArenaSession() {
  var userProps = PropertiesService.getUserProperties();
  userProps.deleteProperty(ARENA_SESSION_ID_KEY);
  userProps.deleteProperty(ARENA_SESSION_TIMESTAMP_KEY);
  userProps.deleteProperty(ARENA_SESSION_CACHE_KEY);
  userProps.deleteProperty(ARENA_SESSION_CACHE_TIMESTAMP_KEY);
}

/**
 * Checks if Arena session is valid (makes API call)
 * Use isArenaSessionValidCached() for menu building to avoid constant API calls
 * @return {boolean} True if session is valid
 */
function isArenaSessionValid() {
  var sessionId = getArenaSessionId();
  if (!sessionId) {
    cacheSessionValidState(false);
    return false;
  }

  try {
    // Make a lightweight API call to test session
    var client = new ArenaAPIClient();
    client.makeRequest('/items?limit=1', { method: 'GET' });

    // Cache the successful validation
    cacheSessionValidState(true);
    return true;
  } catch (e) {
    Logger.log('Session validation failed: ' + e.message);

    // Cache the failed validation
    cacheSessionValidState(false);
    return false;
  }
}

/**
 * Checks if Arena session is valid using cached result (5 minute cache)
 * Use this for menu building and non-critical checks to avoid constant API calls
 * @return {boolean} True if session is likely valid
 */
function isArenaSessionValidCached() {
  var sessionId = getArenaSessionId();
  if (!sessionId) return false;

  var userProps = PropertiesService.getUserProperties();
  var cachedValue = userProps.getProperty(ARENA_SESSION_CACHE_KEY);
  var cacheTimestamp = userProps.getProperty(ARENA_SESSION_CACHE_TIMESTAMP_KEY);

  // Check if cache exists and is less than 5 minutes old
  if (cachedValue && cacheTimestamp) {
    var now = new Date().getTime();
    var cacheAge = now - parseInt(cacheTimestamp);
    var CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

    if (cacheAge < CACHE_DURATION) {
      Logger.log('Using cached session validation: ' + cachedValue + ' (age: ' + Math.floor(cacheAge/1000) + 's)');
      return cachedValue === 'true';
    }
  }

  // Cache expired or doesn't exist, do full validation
  Logger.log('Session cache expired or missing, performing full validation');
  return isArenaSessionValid();
}

/**
 * Caches the session validation state
 * @param {boolean} isValid - Whether session is valid
 */
function cacheSessionValidState(isValid) {
  var userProps = PropertiesService.getUserProperties();
  var timestamp = new Date().getTime();

  userProps.setProperties({
    'arena_session_valid_cache': isValid.toString(),
    'arena_session_cache_timestamp': timestamp.toString()
  });
}

/**
 * Gets session age in minutes
 * @return {number} Session age in minutes, or -1 if no session
 */
function getSessionAgeMinutes() {
  var timestamp = PropertiesService.getUserProperties().getProperty(ARENA_SESSION_TIMESTAMP_KEY);
  if (!timestamp) return -1;

  var now = new Date().getTime();
  var age = now - parseInt(timestamp);
  return Math.floor(age / (60 * 1000));
}

/**
 * Gets valid Arena session ID, re-logging in if needed
 * @return {string|null} Valid session ID or null
 */
function getValidArenaSessionId() {
  if (isArenaSessionValid()) {
    return getArenaSessionId();
  }

  // Try to re-login with stored credentials
  var email = getArenaEmail();
  var workspaceId = getArenaWorkspaceId();

  if (!email || !workspaceId) {
    return null;
  }

  // Note: We can't auto re-login without password
  // User will need to login again
  return null;
}

/**
 * Saves Gemini API key
 * @param {string} apiKey - Gemini API key
 */
function saveGeminiApiKey(apiKey) {
  PropertiesService.getUserProperties().setProperty(GEMINI_API_KEY, apiKey);
}

/**
 * Gets Gemini API key
 * @return {string|null} API key or null
 */
function getGeminiApiKey() {
  return PropertiesService.getUserProperties().getProperty(GEMINI_API_KEY);
}

/**
 * Saves application settings
 * @param {Object} settings - Settings object
 */
function saveAppSettings(settings) {
  var userProps = PropertiesService.getUserProperties();

  if (settings.slideTemplate) {
    userProps.setProperty(SLIDE_TEMPLATE_PREF_KEY, settings.slideTemplate);
  }

  if (settings.aiDetailLevel) {
    userProps.setProperty(AI_DETAIL_LEVEL_KEY, settings.aiDetailLevel);
  }

  if (settings.geminiApiKey) {
    saveGeminiApiKey(settings.geminiApiKey);
  }
}

/**
 * Gets application settings
 * @return {Object} Settings object
 */
function getAppSettings() {
  var userProps = PropertiesService.getUserProperties();

  return {
    slideTemplate: userProps.getProperty(SLIDE_TEMPLATE_PREF_KEY) || 'title_and_body',
    aiDetailLevel: userProps.getProperty(AI_DETAIL_LEVEL_KEY) || 'medium',
    geminiApiKey: getGeminiApiKey() || '',
    arenaEmail: getArenaEmail() || '',
    arenaWorkspaceId: getArenaWorkspaceId() || ''
  };
}

/**
 * Gets current login status
 * @return {Object} Status object with login information
 */
function getLoginStatus() {
  var email = getArenaEmail();
  var sessionId = getArenaSessionId();
  var isValid = isArenaSessionValid();

  return {
    isLoggedIn: !!sessionId && isValid,
    email: email || '',
    workspaceId: getArenaWorkspaceId() || ''
  };
}

/**
 * Saves login info for "Remember me" feature
 * @param {string} email - User email
 * @param {string} workspaceId - Workspace ID
 */
function saveLoginInfo(email, workspaceId) {
  var userProps = PropertiesService.getUserProperties();
  userProps.setProperties({
    'saved_arena_email': email,
    'saved_arena_workspace_id': workspaceId
  });
}

/**
 * Gets saved login info
 * @return {Object} Saved email and workspaceId
 */
function getSavedLoginInfo() {
  var userProps = PropertiesService.getUserProperties();
  return {
    email: userProps.getProperty('saved_arena_email') || '',
    workspaceId: userProps.getProperty('saved_arena_workspace_id') || ''
  };
}

/**
 * Clears saved login info
 */
function clearLoginInfo() {
  var userProps = PropertiesService.getUserProperties();
  userProps.deleteProperty('saved_arena_email');
  userProps.deleteProperty('saved_arena_workspace_id');
}

/**
 * Saves schema configuration (field selections and instructions)
 * @param {Object} schema - Schema configuration object
 */
function saveSchemaSettings(schema) {
  var userProps = PropertiesService.getUserProperties();
  userProps.setProperty('schema_config', JSON.stringify(schema));
  Logger.log('Schema settings saved');
}

/**
 * Gets schema configuration
 * @return {Object} Schema configuration object
 */
function getSchemaSettings() {
  try {
    var userProps = PropertiesService.getUserProperties();
    var schemaJson = userProps.getProperty('schema_config');

    if (!schemaJson) {
      // No saved schema - return empty with note that discovery is needed
      Logger.log('No saved schema found - will need to discover from Arena');
      return {
        items: { fields: [], instructions: '' },
        changes: { fields: [], instructions: '' },
        requests: { fields: [], instructions: '' },
        quality: { fields: [], instructions: '' }
      };
    }

    return JSON.parse(schemaJson);
  } catch (error) {
    Logger.log('Error loading schema settings: ' + error.message);
    return {
      items: { fields: [], instructions: '' },
      changes: { fields: [], instructions: '' },
      requests: { fields: [], instructions: '' },
      quality: { fields: [], instructions: '' }
    };
  }
}

/**
 * Saves all settings (general + schema) in one call
 * @param {Object} settings - General settings
 * @param {Object} schema - Schema configuration
 */
function saveAllSettings(settings, schema) {
  saveAppSettings(settings);
  saveSchemaSettings(schema);
}
