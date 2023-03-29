'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var ACTIVE = 'active';
var IDLE = 'idle';

var DEFAULT_INITIAL_STATE = ACTIVE;

var DEFAULT_ACTIVITY_EVENTS = ['click', 'mousemove', 'keydown', 'DOMMouseScroll', 'mousewheel', 'mousedown', 'touchstart', 'touchmove', 'focus'];

var DEFAULT_INACTIVITY_EVENTS = ['blur', 'visibilitychange'];

var DEFAULT_IGNORED_EVENTS_WHEN_IDLE = ['mousemove'];

var hidden = void 0,
  visibilityChangeEvent = void 0;
if (typeof document.hidden !== 'undefined') {
  hidden = 'hidden';
  visibilityChangeEvent = 'visibilitychange';
} else {
  var prefixes = ['webkit', 'moz', 'ms'];
  for (var i = 0; i < prefixes.length; i++) {
    var prefix = prefixes[i];
    if (typeof document[prefix + 'Hidden'] !== 'undefined') {
      hidden = prefix + 'Hidden';
      visibilityChangeEvent = prefix + 'visibilitychange';
      break;
    }
  }
}

/**
 * Creates an activity detector instance
 *
 * @param  {Object}   options
 * @param  {string[]} options.activityEvents        Events which force a
 *   transition to 'active'
 * @param  {string[]} options.inactivityEvents      Events which force a
 *   transition to 'idle'
 * @param  {string[]} options.ignoredEventsWhenIdle Events that are ignored in
 *   'idle' state
 * @param  {number}   options.timeToIdle            Inactivity time in ms to
 *   transition to 'idle'
 * @param  {string}   options.initialState          One of 'active' or 'idle'
 * @param  {boolean}  options.autoInit
 * @return {Object}   activity detector instance
 */
var activityDetector = function activityDetector() {
  var _listeners;

  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
    _ref$activityEvents = _ref.activityEvents,
    activityEvents = _ref$activityEvents === undefined ? DEFAULT_ACTIVITY_EVENTS : _ref$activityEvents,
    _ref$inactivityEvents = _ref.inactivityEvents,
    inactivityEvents = _ref$inactivityEvents === undefined ? DEFAULT_INACTIVITY_EVENTS : _ref$inactivityEvents,
    _ref$ignoredEventsWhe = _ref.ignoredEventsWhenIdle,
    ignoredEventsWhenIdle = _ref$ignoredEventsWhe === undefined ? DEFAULT_IGNORED_EVENTS_WHEN_IDLE : _ref$ignoredEventsWhe,
    _ref$timeToIdle = _ref.timeToIdle,
    timeToIdle = _ref$timeToIdle === undefined ? 30000 : _ref$timeToIdle,
    _ref$initialState = _ref.initialState,
    initialState = _ref$initialState === undefined ? DEFAULT_INITIAL_STATE : _ref$initialState,
    _ref$autoInit = _ref.autoInit,
    autoInit = _ref$autoInit === undefined ? true : _ref$autoInit;

  var listeners = (_listeners = {}, _defineProperty(_listeners, ACTIVE, []), _defineProperty(_listeners, IDLE, []), _listeners);
  var state = void 0;
  var timer = void 0;

  var setState = function setState(newState) {
    clearTimeout(timer);
    if (newState === ACTIVE) {
      timer = setTimeout(function () {
        return setState(IDLE);
      }, timeToIdle);
    }
    if (state !== newState) {
      state = newState;
      listeners[state].forEach(function (l) {
        return l();
      });
    }
  };

  var handleUserActivityEvent = function handleUserActivityEvent(event) {
    if (state === ACTIVE || ignoredEventsWhenIdle.indexOf(event.type) < 0) {
      setState(ACTIVE);
    }
  };

  var handleUserInactivityEvent = function handleUserInactivityEvent() {
    setState(IDLE);
  };

  var handleVisibilityChangeEvent = function handleVisibilityChangeEvent() {
    setState(document[hidden] ? IDLE : ACTIVE);
  };

  /**
   * Starts the activity detector with the given state.
   * @param {string} firstState 'idle' or 'active'
   */
  var init = function init() {
    var firstState = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : DEFAULT_INITIAL_STATE;

    setState(firstState === ACTIVE ? ACTIVE : IDLE);
    activityEvents.forEach(function (eventName) {
      return window.addEventListener(eventName, handleUserActivityEvent);
    });

    inactivityEvents.filter(function (eventName) {
      return eventName !== 'visibilitychange';
    }).forEach(function (eventName) {
      return window.addEventListener(eventName, handleUserInactivityEvent);
    });

    if (inactivityEvents.indexOf('visibilitychange') >= 0 && visibilityChangeEvent) {
      document.addEventListener(visibilityChangeEvent, handleVisibilityChangeEvent);
    }
  };

  /**
   * Register an event listener for the required event
   * @param {string} eventName 'active' or 'idle'
   * @param {Function} listener
   */
  var on = function on(eventName, listener) {
    listeners[eventName].push(listener);
    var off = function off() {
      var index = listeners[eventName].indexOf(listener);
      if (index >= 0) {
        listeners[eventName].splice(index, 1);
      }
    };
    return off;
  };

  /**
   * Stops the activity detector and clean the listeners
   */
  var stop = function stop() {
    listeners[ACTIVE] = [];
    listeners[IDLE] = [];

    clearTimeout(timer);

    activityEvents.forEach(function (eventName) {
      return window.removeEventListener(eventName, handleUserActivityEvent);
    });

    inactivityEvents.forEach(function (eventName) {
      return window.removeEventListener(eventName, handleUserInactivityEvent);
    });

    if (visibilityChangeEvent) {
      document.removeEventListener(visibilityChangeEvent, handleVisibilityChangeEvent);
    }
  };

  if (autoInit) {
    init(initialState);
  }

  return { on: on, stop: stop, init: init };
};

exports.activityDetector = activityDetector;
