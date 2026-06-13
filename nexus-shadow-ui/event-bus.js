var EventBus = {
  listeners: {},

  on: function (event, callback) {
    if (!EventBus.listeners[event]) EventBus.listeners[event] = [];
    EventBus.listeners[event].push(callback);
  },

  off: function (event, callback) {
    if (!EventBus.listeners[event]) return;
    EventBus.listeners[event] = EventBus.listeners[event].filter(function (cb) {
      return cb !== callback;
    });
  },

  emit: function (event, data) {
    if (!EventBus.listeners[event]) return;
    for (var i = 0; i < EventBus.listeners[event].length; i++) {
      try {
        EventBus.listeners[event][i](data);
      } catch (e) {
        console.error("EventBus error:", event, e);
      }
    }
  },

  history: [],
  maxHistory: 200,

  pushEvent: function (type, data) {
    var entry = {
      type: type,
      data: data,
      timestamp: new Date().toISOString(),
      time: String(new Date().getHours()).padStart(2, "0") + ":" +
        String(new Date().getMinutes()).padStart(2, "0") + ":" +
        String(new Date().getSeconds()).padStart(2, "0")
    };
    EventBus.history.push(entry);
    if (EventBus.history.length > EventBus.maxHistory) {
      EventBus.history.shift();
    }
    EventBus.emit("any", entry);
    EventBus.emit(type, entry);
  },

  getHistory: function (type) {
    if (!type) return EventBus.history.slice();
    return EventBus.history.filter(function (e) { return e.type === type; });
  },

  clearHistory: function () {
    EventBus.history = [];
  }
};
