/* ============================================
   NEXUS SHADOW — app.js  (single-file rewrite)
   ============================================ */

var AlertManager = {
  show: function (msg, type) {
    var c = document.getElementById("alert-container");
    if (!c) return;
    var el = document.createElement("div");
    el.className = "alert alert-" + (type || "info");
    el.textContent = msg;
    c.appendChild(el);
    setTimeout(function () { el.classList.add("alert-show"); }, 10);
    setTimeout(function () { el.classList.remove("alert-show"); setTimeout(function () { el.remove(); }, 400); }, 3500);
  }
};

var DeviceManager = {
  myLat: null,
  myLng: null,
  interval: null,
  init: function () {
    DeviceManager.interval = setInterval(function () {
      var el = document.getElementById("device-count");
      if (el) el.textContent = String(Math.floor(Math.random() * 5) + 14);
      var lat = document.getElementById("device-lat");
      var lng = document.getElementById("device-lng");
      if (lat && DeviceManager.myLat !== null) lat.textContent = DeviceManager.myLat.toFixed(6);
      if (lng && DeviceManager.myLng !== null) lng.textContent = DeviceManager.myLng.toFixed(6);
    }, 2000);
  },
  updateMyLocation: function (lat, lng) {
    DeviceManager.myLat = lat;
    DeviceManager.myLng = lng;
  }
};

var App = {
  state: { isLoggedIn: false, currentPage: "tracker", startTime: null },
  gpsWatchId: null,

  init: function () {
    App.bindLogin();
    App.startClock();
  },

  bindLogin: function () {
    var btn = document.getElementById("login-btn");
    var inp = document.getElementById("passcode-input");
    var err = document.getElementById("login-error");
    if (btn) btn.addEventListener("click", App.attemptLogin);
    if (inp) inp.addEventListener("keydown", function (e) { if (e.key === "Enter") App.attemptLogin(); });
  },

  attemptLogin: function () {
    var inp = document.getElementById("passcode-input");
    var err = document.getElementById("login-error");
    if (!inp) return;
    var val = inp.value.trim();
    if (AppConfig.passcodes.indexOf(val) !== -1) {
      document.getElementById("login-overlay").classList.add("fade-out");
      setTimeout(function () {
        document.getElementById("login-overlay").style.display = "none";
        document.getElementById("app").classList.remove("hidden");
        App.state.isLoggedIn = true;
        App.state.startTime = Date.now();
        App.buildSidebar();
        App.startSessionTimer();
        App.navigate("tracker");
      }, 500);
    } else {
      if (err) err.textContent = "// ACCESS DENIED — INVALID PASSCODE";
      inp.value = "";
      inp.classList.add("shake");
      setTimeout(function () { inp.classList.remove("shake"); }, 500);
    }
  },

  buildSidebar: function () {
    var nav = document.getElementById("sb-nav");
    if (!nav) return;
    var html = "";
    AppConfig.pages.forEach(function (p) {
      var active = p.id === "tracker" ? " active" : "";
      html += '<div class="sb-item' + active + '" data-page="' + p.id + '"><i class="fas ' + p.icon + '"></i><span>' + p.label + '</span></div>';
    });
    nav.innerHTML = html;
    nav.querySelectorAll(".sb-item").forEach(function (el) {
      el.addEventListener("click", function () {
        App.navigate(this.getAttribute("data-page"));
      });
    });
  },

  navigate: function (id) {
    App.stopGPS();
    try { WorldMap.stop(); } catch (e) { }
    App.state.currentPage = id;

    var titles = {
      tracker: "IP TRACKING UNIT", network: "WEBVIEW SCANNER", vuln: "VULNERABILITIES",
      reports: "DARKNET DASHBOARD", cctv: "CCTV COMMAND CENTER", social: "SOCIAL MEDIA",
      tor: "TOR INTEL", agency: "AGENCY INTEL", aetheris: "AETHERIS GATEWAY",
      aetheris2: "AETHERIS REACTOR", ai: "AI ASSISTANT", c2: "C2 NODE",
      cta: "CTA TEAM HUB", spirit: "TEAM SPIRIT"
    };
    var hdr = document.getElementById("hdr-page");
    if (hdr) hdr.textContent = titles[id] || id.toUpperCase();

    document.querySelectorAll(".sb-item").forEach(function (el) {
      el.classList.toggle("active", el.getAttribute("data-page") === id);
    });

    var main = document.getElementById("main-content");
    if (!main) return;

    if (id === "tracker") { Dashboard.render(main); }
    else if (id === "network") { WebViewScanner.render(main); }
    else if (id === "vuln") { IntelligenceArchive.render(main); }
    else if (id === "reports") { DarknetDashboard.render(main); }
    else {
      main.innerHTML =
        '<div class="placeholder-page">' +
        '<div class="placeholder-icon"><i class="fas fa-hourglass-half"></i></div>' +
        '<div class="placeholder-title">' + (titles[id] || id.toUpperCase()) + '</div>' +
        '<div class="placeholder-sub">MODULE INITIALIZING...</div>' +
        '</div>';
    }
  },

  startClock: function () {
    setInterval(function () {
      var now = new Date();
      var ts = String(now.getHours()).padStart(2, "0") + ":" +
        String(now.getMinutes()).padStart(2, "0") + ":" +
        String(now.getSeconds()).padStart(2, "0");
      var el = document.getElementById("hdr-clock");
      if (el) el.textContent = ts;
      var sb = document.getElementById("sb-session");
      if (sb) sb.textContent = ts;
    }, 1000);
  },

  startSessionTimer: function () {
    setInterval(function () {
      var el = document.getElementById("sb-session");
      if (!el || !App.state.startTime) return;
      var e = Math.floor((Date.now() - App.state.startTime) / 1000);
      el.textContent = String(Math.floor(e / 3600)).padStart(2, "0") + ":" +
        String(Math.floor((e % 3600) / 60)).padStart(2, "0") + ":" +
        String(e % 60).padStart(2, "0");
    }, 1000);
  },

  stopGPS: function () {
    if (App.gpsWatchId !== null) {
      navigator.geolocation.clearWatch(App.gpsWatchId);
      App.gpsWatchId = null;
    }
  }
};

/* ==========================================
   DASHBOARD — Page 1: IP Tracker
   ========================================== */
var Dashboard = {
  mapInitialized: false,

  render: function (container) {
    var html =
      '<div class="tracker-layout">' +

      /* LEFT PANELS */
      '<div class="tracker-left">' +

      /* === SECTION 01: IP TRACKING HUB === */
      '<div class="glass-panel">' +
      '<div class="panel-header"><span class="panel-num">01</span> GLOBAL IP TRACING HUB</div>' +

      '<div class="panel-row"><label class="panel-lbl">TARGET IP ADDRESS</label></div>' +
      '<div class="panel-input-row">' +
      '<input id="ip-input" class="panel-inp" type="text" value="" placeholder="8.8.8.8" autocomplete="off" spellcheck="false">' +
      '<select id="ip-port" class="panel-inp" style="width:80px;flex:none"><option>443</option><option>80</option><option>22</option><option>8080</option></select>' +
      '</div>' +

      '<div class="panel-row"><label class="panel-lbl">PROXY STATUS</label><label class="panel-lbl">DEEP SCAN</label></div>' +
      '<div class="panel-input-row">' +
      '<div class="panel-inp readonly" style="flex:1">DETECTION: PASSIVE</div>' +
      '<label class="toggle-switch" style="flex:none"><input type="checkbox" checked><span class="toggle-slider"></span></label>' +
      '</div>' +

      '<div class="panel-btn-row">' +
      '<button id="btn-my-ip" class="btn-primary"><i class="fas fa-user-shield"></i> TAG ME</button>' +
      '<button id="btn-track-ip" class="btn-danger"><i class="fas fa-crosshairs"></i> TAG TARGET</button>' +
      '</div>' +
      '</div>' +

      /* === SECTION 02: GPS LOCATION HUB === */
      '<div class="glass-panel">' +
      '<div class="panel-header"><span class="panel-num">02</span> PRECISE GPS LOCATION HUB</div>' +

      '<div class="panel-row"><label class="panel-lbl">TARGET LATITUDE</label><label class="panel-lbl">TARGET LONGITUDE</label></div>' +
      '<div class="panel-input-row">' +
      '<input id="gps-lat" class="panel-inp" type="text" value="23.810361" placeholder="Latitude" autocomplete="off">' +
      '<input id="gps-lng" class="panel-inp" type="text" value="90.412544" placeholder="Longitude" autocomplete="off">' +
      '</div>' +

      '<div class="panel-row"><label class="panel-lbl">LOCATION ACCURACY</label><label class="panel-lbl">LAST KNOWN FIX</label></div>' +
      '<div class="panel-input-row">' +
      '<div class="panel-inp readonly" style="flex:1">&lt;10m</div>' +
      '<div class="panel-inp readonly" style="flex:1" id="gps-last-fix">—</div>' +
      '</div>' +

      '<div class="panel-btn-row">' +
      '<button id="btn-gps-me" class="btn-primary"><i class="fas fa-crosshairs"></i> TAG ME (GPS)</button>' +
      '<button id="btn-gps-target" class="btn-danger"><i class="fas fa-crosshairs"></i> TAG TARGET GPS</button>' +
      '</div>' +
      '</div>' +

      /* === SECTION 03: INFO BOX === */
      '<div class="glass-panel">' +
      '<div class="panel-header"><span class="panel-num">03</span> TRACKING RESULTS</div>' +
      '<div id="info-box" class="info-box">' +
      '<div class="info-row"><span class="info-lbl">COUNTRY:</span><span class="info-val" id="ib-country">—</span></div>' +
      '<div class="info-row"><span class="info-lbl">CITY:</span><span class="info-val" id="ib-city">—</span></div>' +
      '<div class="info-row"><span class="info-lbl">COORDINATES:</span><span class="info-val" id="ib-coords">—</span></div>' +
      '<div class="info-row"><span class="info-lbl">TIMEZONE:</span><span class="info-val" id="ib-tz">—</span></div>' +
      '<div class="info-row"><span class="info-lbl">ISP:</span><span class="info-val" id="ib-isp">—</span></div>' +
      '<div class="info-row"><span class="info-lbl">IP:</span><span class="info-val" id="ib-ip">—</span></div>' +
      '<div class="info-row"><span class="info-lbl">ORG:</span><span class="info-val" id="ib-org">—</span></div>' +
      '<div class="info-row"><span class="info-lbl">STATUS:</span><span class="info-val" style="color:#00ff88" id="ib-status">WAITING</span></div>' +
      '</div>' +
      '</div>' +

      '</div>' /* end tracker-left */ +

      /* MAP AREA */
      '<div class="tracker-map" id="map-area">' +
      '<div id="google-map" style="width:100%;height:100%"></div>' +
      '<div class="map-overlay-ui">' +
      '<div class="scanner-label">SCANNING...</div>' +
      '</div>' +
      '</div>' +

      '</div>'; /* end tracker-layout */

    container.innerHTML = html;
    Dashboard.bindButtons();
    setTimeout(function () { Dashboard.initMap(); }, 200);
  },

  bindButtons: function () {
    var b1 = document.getElementById("btn-my-ip");
    var b2 = document.getElementById("btn-track-ip");
    var b3 = document.getElementById("btn-gps-me");
    var b4 = document.getElementById("btn-gps-target");
    if (b1) b1.addEventListener("click", Dashboard.trackMyIP);
    if (b2) b2.addEventListener("click", Dashboard.trackTargetIP);
    if (b3) b3.addEventListener("click", Dashboard.trackMyGPS);
    if (b4) b4.addEventListener("click", Dashboard.trackTargetGPS);
  },

  initMap: function () {
    var el = document.getElementById("google-map");
    if (el) WorldMap.init(el);
  },

  updateInfo: function (data) {
    var set = function (id, val) {
      var el = document.getElementById(id);
      if (el) el.textContent = val || "—";
    };
    set("ib-country", data.country);
    set("ib-city", data.city);
    set("ib-coords", data.lat + ", " + data.lon);
    set("ib-tz", data.timezone || "N/A");
    set("ib-isp", data.isp);
    set("ib-ip", data.query);
    set("ib-org", data.org);
    set("ib-status", "TRACKED");
  },

  trackMyIP: function () {
    var btn = document.getElementById("btn-my-ip");
    if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SCANNING...';
    fetch("http://ip-api.com/json/?fields=status,country,countryCode,region,regionName,city,lat,lon,isp,org,as,query,timezone")
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (btn) btn.innerHTML = '<i class="fas fa-user-shield"></i> TAG ME';
        if (d.status === "success") {
          WorldMap.addTrackedMarker(d);
          WorldMap.addFlightLine(d, "#00e5ff");
          WorldMap.fitToTracked(d);
          Dashboard.updateInfo(d);
          AlertManager.show("Your IP: " + d.query + " — " + d.city + ", " + d.country, "success");
        } else {
          AlertManager.show("Could not resolve your IP.", "error");
        }
      })
      .catch(function () {
        if (btn) btn.innerHTML = '<i class="fas fa-user-shield"></i> TAG ME';
        AlertManager.show("Network error.", "error");
      });
  },

  trackTargetIP: function () {
    var input = document.getElementById("ip-input");
    if (!input) return;
    var val = input.value.trim();
    if (!val) { AlertManager.show("Enter an IP address.", "error"); return; }
    var ips = val.split(",").map(function (s) { return s.trim(); }).filter(function (s) { return s; });
    var btn = document.getElementById("btn-track-ip");
    if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SCANNING...';
    WorldMap.clearTracking();
    var colors = ["#ff0040", "#00e5ff", "#ff69b4", "#ffffff", "#ffff00"];
    var ci = 0;
    var idx = 0;
    function next() {
      if (idx >= ips.length) {
        if (btn) btn.innerHTML = '<i class="fas fa-crosshairs"></i> TAG TARGET';
        return;
      }
      fetch("http://ip-api.com/json/" + ips[idx] + "?fields=status,country,countryCode,region,regionName,city,lat,lon,isp,org,as,query,timezone")
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.status === "success") {
            WorldMap.addTrackedMarker(d);
            WorldMap.addFlightLine(d, colors[ci % colors.length]);
            ci++;
            Dashboard.updateInfo(d);
            AlertManager.show("Tracked: " + ips[idx] + " — " + d.city + ", " + d.country, "success");
          } else {
            AlertManager.show("FAILED: " + ips[idx], "error");
          }
          idx++;
          setTimeout(next, 800);
        })
        .catch(function () {
          AlertManager.show("Network error: " + ips[idx], "error");
          idx++;
          setTimeout(next, 800);
        });
    }
    next();
  },

  trackMyGPS: function () {
    if (App.gpsWatchId !== null) {
      App.stopGPS();
      var btn = document.getElementById("btn-gps-me");
      if (btn) btn.innerHTML = '<i class="fas fa-crosshairs"></i> TAG ME (GPS)';
      AlertManager.show("GPS tracking stopped.", "info");
      return;
    }
    if (!navigator.geolocation) { AlertManager.show("Geolocation not supported.", "error"); return; }
    var btn = document.getElementById("btn-gps-me");
    if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> TRACKING...';
    App.gpsWatchId = navigator.geolocation.watchPosition(
      function (pos) {
        var lat = pos.coords.latitude;
        var lng = pos.coords.longitude;
        DeviceManager.updateMyLocation(lat, lng);
        if (btn) btn.innerHTML = '<i class="fas fa-stop"></i> STOP (' + lat.toFixed(4) + ', ' + lng.toFixed(4) + ')';
        WorldMap.addGPSMarker(lat, lng, "MY LOCATION");
        var fix = document.getElementById("gps-last-fix");
        if (fix) fix.textContent = new Date().toLocaleTimeString();
        AlertManager.show("GPS: " + lat.toFixed(4) + ", " + lng.toFixed(4), "success");
      },
      function (err) { AlertManager.show("GPS Error: " + err.message, "error"); Dashboard.stopGPS(); },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
  },

  trackTargetGPS: function () {
    var latEl = document.getElementById("gps-lat");
    var lngEl = document.getElementById("gps-lng");
    if (!latEl || !lngEl) return;
    var lat = parseFloat(latEl.value);
    var lng = parseFloat(lngEl.value);
    if (isNaN(lat) || isNaN(lng)) { AlertManager.show("Enter valid coordinates.", "error"); return; }
    WorldMap.addGPSMarker(lat, lng, "TARGET");
    WorldMap.addFlightLine({ lat: lat, lon: lng }, "#ff69b4");
    if (WorldMap.map) {
      WorldMap.map.panTo(new google.maps.LatLng(lat, lng));
      WorldMap.map.setZoom(12);
    }
    var fix = document.getElementById("gps-last-fix");
    if (fix) fix.textContent = new Date().toLocaleTimeString();
    AlertManager.show("GPS target: " + lat + ", " + lng, "success");
  }
};

/* ==========================================
   WORLD MAP — Google Maps with radar overlay
   ========================================== */
var WorldMap = {
  map: null,
  trackedMarker: null,
  gpsMarker: null,
  flightLines: [],
  radarOverlay: null,
  radarAngle: 0,
  animId: null,
  loaded: false,

  init: function (container) {
    WorldMap.loadAPI(container);
  },

  loadAPI: function (container) {
    if (window.google && window.google.maps) {
      WorldMap.createMap(container);
      return;
    }
    window.__gmapReady = function () {
      try { WorldMap.createMap(container); }
      catch (e) { console.error("Map init error:", e); WorldMap.showFallback(container); }
    };
    window.__gmapError = function () { WorldMap.showFallback(container); };
    var s = document.createElement("script");
    s.src = "https://maps.googleapis.com/maps/api/js?key=" + AppConfig.apiKey + "&map_ids=" + AppConfig.mapId + "&callback=__gmapReady&loading=async";
    s.async = true;
    s.defer = true;
    s.onerror = function () { WorldMap.showFallback(container); };
    document.head.appendChild(s);
  },

  showFallback: function (container) {
    container.innerHTML =
      '<div style="width:100%;height:100%;background:#060e1a;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px">' +
      '<div style="font-family:Share Tech Mono,monospace;font-size:14px;color:#00ccff;letter-spacing:2px">NEXUS SHADOW // MAP ONLINE</div>' +
      '<div style="font-family:Share Tech Mono,monospace;font-size:10px;color:#3a5a6a">Google Maps loading — ensure HTTP server is running.</div>' +
      '</div>';
  },

  createMap: function (container) {
    WorldMap.map = new google.maps.Map(container, {
      center: AppConfig.mapCenter,
      zoom: AppConfig.mapZoom,
      mapId: AppConfig.mapId,
      mapTypeId: "hybrid",
      disableDefaultUI: true,
      zoomControl: false,
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false,
      gestureHandling: "greedy",
      backgroundColor: "#000000",
      clickableIcons: false,
      tilt: 0,
      heading: 0
    });

    WorldMap.addZoomControls(container);
    WorldMap.startRadar();
    WorldMap.startLoop();
    WorldMap.loaded = true;
  },

  addZoomControls: function (container) {
    var wrap = document.createElement("div");
    wrap.style.cssText = "position:absolute;top:12px;right:12px;z-index:10;display:flex;flex-direction:column;gap:4px";

    var mkBtn = function (txt, onClick) {
      var b = document.createElement("div");
      b.textContent = txt;
      b.style.cssText = "width:38px;height:38px;display:flex;align-items:center;justify-content:center;background:rgba(8,14,28,0.85);backdrop-filter:blur(10px);border:2px solid rgba(255,0,64,0.4);border-radius:8px;color:#00e5ff;font-family:'Share Tech Mono',monospace;font-size:18px;font-weight:700;cursor:pointer;transition:all 0.2s";
      b.onmouseenter = function () { b.style.borderColor = "rgba(0,229,255,0.7)"; b.style.boxShadow = "0 0 15px rgba(0,229,255,0.3)"; };
      b.onmouseleave = function () { b.style.borderColor = "rgba(255,0,64,0.4)"; b.style.boxShadow = "none"; };
      b.onclick = onClick;
      return b;
    };

    wrap.appendChild(mkBtn("+", function () { if (WorldMap.map) WorldMap.map.setZoom(WorldMap.map.getZoom() + 1); }));
    wrap.appendChild(mkBtn("\u2212", function () { if (WorldMap.map) WorldMap.map.setZoom(WorldMap.map.getZoom() - 1); }));
    wrap.appendChild(mkBtn("\u2302", function () {
      if (WorldMap.map) {
        WorldMap.map.panTo(AppConfig.mapCenter);
        WorldMap.map.setZoom(AppConfig.mapZoom);
      }
    }));

    container.appendChild(wrap);
  },

  trackIP: function (ip) {
    WorldMap.clearTracking();
    fetch("http://ip-api.com/json/" + ip + "?fields=status,country,countryCode,region,regionName,city,lat,lon,isp,org,as,query,timezone")
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.status === "success") {
          WorldMap.addTrackedMarker(d);
          WorldMap.addFlightLine(d);
          WorldMap.fitToTracked(d);
          Dashboard.updateInfo(d);
        }
      });
  },

  addTrackedMarker: function (data) {
    var overlay = new google.maps.OverlayView();
    overlay.setMap(WorldMap.map);
    overlay.div = null;
    overlay.draw = function () {
      var self = this;
      if (!self.div) {
        self.div = document.createElement("div");
        self.div.className = "tracked-marker";
        self.div.innerHTML =
          '<div class="tm-pulse"></div><div class="tm-ring"></div><div class="tm-dot"></div>' +
          '<div class="tm-label">' + (data.city || "") + ", " + (data.country || "") + '</div>';
        self.div.style.position = "absolute";
        var panes = self.getPanes();
        if (panes && panes.overlayMouseTarget) panes.overlayMouseTarget.appendChild(self.div);
      }
      var proj = self.getProjection();
      if (!proj) return;
      var p = proj.fromLatLngToDivPixel(new google.maps.LatLng(data.lat, data.lon));
      if (p) { self.div.style.left = (p.x - 20) + "px"; self.div.style.top = (p.y - 20) + "px"; }
    };
    overlay.remove = function () { if (this.div && this.div.parentNode) this.div.parentNode.removeChild(this.div); };
    WorldMap.trackedMarker = overlay;
  },

  addFlightLine: function (data, color) {
    color = color || "#ff0040";
    var origin = AppConfig.mapCenter;
    var dest = { lat: data.lat, lng: data.lon };
    var pts = WorldMap.buildCurve(origin, dest, 40);

    var svgOv = new google.maps.OverlayView();
    svgOv.setMap(WorldMap.map);
    svgOv.pts = pts;
    svgOv.color = color;
    svgOv.draw = function () {
      var self = this;
      var panes = self.getPanes();
      if (!panes) return;
      var proj = self.getProjection();
      if (!proj) return;
      if (!self.svgEl) {
        self.svgEl = document.createElement("div");
        self.svgEl.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible";
        panes.overlayLayer.appendChild(self.svgEl);
      }
      var ns = "http://www.w3.org/2000/svg";
      var svg = document.createElementNS(ns, "svg");
      svg.style.cssText = "position:absolute;top:0;left:0;width:1px;height:1px;overflow:visible";
      var d = "";
      for (var i = 0; i < self.pts.length; i++) {
        var pp = proj.fromLatLngToDivPixel(new google.maps.LatLng(self.pts[i].lat, self.pts[i].lng));
        if (pp) d += (i === 0 ? "M" : "L") + pp.x + "," + pp.y;
      }

      var glow = document.createElementNS(ns, "path");
      glow.setAttribute("d", d);
      glow.setAttribute("fill", "none");
      glow.setAttribute("stroke", self.color);
      glow.setAttribute("stroke-width", "6");
      glow.setAttribute("stroke-opacity", "0.2");
      svg.appendChild(glow);

      var path = document.createElementNS(ns, "path");
      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", self.color);
      path.setAttribute("stroke-width", "2.5");
      path.setAttribute("stroke-opacity", "0.8");
      path.setAttribute("stroke-dasharray", "8,6");
      svg.appendChild(path);

      var dot = document.createElementNS(ns, "circle");
      dot.setAttribute("r", "5");
      dot.setAttribute("fill", self.color);
      dot.setAttribute("opacity", "0.9");
      var anim = document.createElementNS(ns, "animateMotion");
      anim.setAttribute("dur", "3s");
      anim.setAttribute("repeatCount", "indefinite");
      anim.setAttribute("path", d);
      dot.appendChild(anim);
      svg.appendChild(dot);

      if (self.svgEl.firstChild) self.svgEl.removeChild(self.svgEl.firstChild);
      self.svgEl.appendChild(svg);
    };
    WorldMap.flightLines.push(svgOv);
  },

  buildCurve: function (from, to, steps) {
    steps = steps || 40;
    var pts = [];
    var midLat = (from.lat + to.lat) / 2;
    var midLng = (from.lng + to.lng) / 2;
    var dist = Math.sqrt(Math.pow(to.lat - from.lat, 2) + Math.pow(to.lng - from.lng, 2));
    var curve = Math.min(dist * 0.25, 20);
    var perpLat = -(to.lng - from.lng) * curve / Math.max(dist, 1);
    var perpLng = (to.lat - from.lat) * curve / Math.max(dist, 1);
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      pts.push({
        lat: (1 - t) * (1 - t) * from.lat + 2 * (1 - t) * t * (midLat + perpLat) + t * t * to.lat,
        lng: (1 - t) * (1 - t) * from.lng + 2 * (1 - t) * t * (midLng + perpLng) + t * t * to.lng
      });
    }
    return pts;
  },

  fitToTracked: function (data) {
    if (!WorldMap.map) return;
    var bounds = new google.maps.LatLngBounds();
    bounds.extend(new google.maps.LatLng(AppConfig.mapCenter.lat, AppConfig.mapCenter.lng));
    bounds.extend(new google.maps.LatLng(data.lat, data.lon));
    WorldMap.map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
  },

  clearTracking: function () {
    if (WorldMap.trackedMarker) { WorldMap.trackedMarker.setMap(null); WorldMap.trackedMarker = null; }
    if (WorldMap.gpsMarker) { WorldMap.gpsMarker.setMap(null); WorldMap.gpsMarker = null; }
    for (var i = 0; i < WorldMap.flightLines.length; i++) WorldMap.flightLines[i].setMap(null);
    WorldMap.flightLines = [];
  },

  addGPSMarker: function (lat, lng, name) {
    if (WorldMap.gpsMarker) WorldMap.gpsMarker.setMap(null);
    var overlay = new google.maps.OverlayView();
    overlay.setMap(WorldMap.map);
    overlay.div = null;
    overlay.draw = function () {
      var self = this;
      if (!self.div) {
        self.div = document.createElement("div");
        self.div.className = "gps-marker";
        self.div.innerHTML = '<div class="gps-pulse"></div><div class="gps-ring"></div><div class="gps-dot"></div><div class="gps-label">' + name + '</div>';
        self.div.style.position = "absolute";
        var panes = self.getPanes();
        if (panes && panes.overlayMouseTarget) panes.overlayMouseTarget.appendChild(self.div);
      }
      var proj = self.getProjection();
      if (!proj) return;
      var p = proj.fromLatLngToDivPixel(new google.maps.LatLng(lat, lng));
      if (p) { self.div.style.left = (p.x - 20) + "px"; self.div.style.top = (p.y - 20) + "px"; }
    };
    overlay.remove = function () { if (this.div && this.div.parentNode) this.div.parentNode.removeChild(this.div); };
    WorldMap.gpsMarker = overlay;
  },

  startRadar: function () {
    WorldMap.radarOverlay = new google.maps.OverlayView();
    WorldMap.radarOverlay.setMap(WorldMap.map);
    WorldMap.radarOverlay.canvas = null;
    WorldMap.radarOverlay.draw = function () {
      var self = this;
      var panes = self.getPanes();
      if (!panes) return;
      if (!self.canvas) {
        self.canvas = document.createElement("canvas");
        self.canvas.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none";
        panes.overlayLayer.appendChild(self.canvas);
      }
      var proj = self.getProjection();
      if (!proj) return;
      var center = new google.maps.LatLng(AppConfig.mapCenter.lat, AppConfig.mapCenter.lng);
      var edge = new google.maps.LatLng(AppConfig.mapCenter.lat, AppConfig.mapCenter.lng + 5);
      var pc = proj.fromLatLngToDivPixel(center);
      var pe = proj.fromLatLngToDivPixel(edge);
      if (!pc || !pe) return;
      self.centerX = pc.x;
      self.centerY = pc.y;
      self.radius = Math.sqrt(Math.pow(pe.x - pc.x, 2) + Math.pow(pe.y - pc.y, 2));
      var parent = self.canvas.parentElement;
      self.canvas.width = parent ? parent.clientWidth : 800;
      self.canvas.height = parent ? parent.clientHeight : 600;
    };
  },

  drawRadar: function () {
    var ov = WorldMap.radarOverlay;
    if (!ov || !ov.canvas || !ov.centerX) return;
    var ctx = ov.canvas.getContext("2d");
    var w = ov.canvas.width, h = ov.canvas.height;
    ctx.clearRect(0, 0, w, h);
    var cx = ov.centerX, cy = ov.centerY, r = Math.min(ov.radius, Math.min(w, h) * 0.45);
    var angle = WorldMap.radarAngle;

    for (var ring = 1; ring <= 4; ring++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (r * ring) / 4, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,0,64,0.08)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
    ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r);
    ctx.strokeStyle = "rgba(255,0,64,0.04)";
    ctx.lineWidth = 0.5;
    ctx.stroke();

    var sweep = Math.PI * 0.5;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, angle - sweep, angle);
    ctx.closePath();
    var grd = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    grd.addColorStop(0, "rgba(255,0,64,0.25)");
    grd.addColorStop(0.6, "rgba(255,0,64,0.06)");
    grd.addColorStop(1, "rgba(255,0,64,0.005)");
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    ctx.strokeStyle = "rgba(255,0,64,0.6)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  },

  startLoop: function () {
    var loop = function () {
      WorldMap.radarAngle += 0.015;
      WorldMap.drawRadar();
      WorldMap.animId = requestAnimationFrame(loop);
    };
    WorldMap.animId = requestAnimationFrame(loop);
  },

  stop: function () {
    if (WorldMap.animId) { cancelAnimationFrame(WorldMap.animId); WorldMap.animId = null; }
    WorldMap.loaded = false;
  }
};

/* ==========================================
   PAGE 2 — WebView Scanner
   ========================================== */
var WebViewScanner = {
  scanActive: false,

  render: function (container) {
    var html =
      '<div class="scanner-layout">' +

      /* TOP BAR */
      '<div class="scanner-topbar">' +
      '<span class="scanner-topbar-lbl">TARGET URL :</span>' +
      '<input id="scan-url" class="panel-inp" type="text" value="https://www.google.com/search?q=cyber+news" style="flex:1;margin:0 10px" autocomplete="off" spellcheck="false">' +
      '<div class="scanner-active-badge"><i class="fas fa-signal"></i> active webview</div>' +
      '<button id="btn-scan" class="btn-danger" style="flex:none;width:auto;padding:9px 24px"><i class="fas fa-crosshairs"></i> SCAN</button>' +
      '</div>' +

      '<div class="scanner-body">' +

      /* LEFT: VULNERABILITY REPORT */
      '<div class="scanner-left">' +
      '<div class="scanner-section-title"><i class="fas fa-shield-halved"></i> VULNERABILITY REPORT</div>' +

      '<div class="vuln-card vuln-critical">' +
      '<div class="vuln-icon"><i class="fas fa-database"></i><span>SQL</span></div>' +
      '<div class="vuln-info"><div class="vuln-name">SQL Injection</div><div class="vuln-desc">SQL Injection can manipulate and vulnerability formula for targets or role requirements.</div></div>' +
      '<canvas class="vuln-sparkline" id="spark-sql"></canvas>' +
      '<div class="vuln-badge critical">CRITICAL</div>' +
      '</div>' +
 
      '<div class="vuln-card vuln-high">' +
      '<div class="vuln-icon"><i class="fas fa-code"></i><span>XSS</span></div>' +
      '<div class="vuln-info"><div class="vuln-name">Cross-Site Scripting (XSS)</div><div class="vuln-desc">Cross-Site Scripting (XSS) can be to prevent vulnerability sessions the communications with promote scripting process.</div></div>' +
      '<canvas class="vuln-sparkline" id="spark-xss"></canvas>' +
      '<div class="vuln-badge high">HIGH</div>' +
      '</div>' +
 
      '<div class="vuln-card vuln-high2">' +
      '<div class="vuln-icon"><i class="fas fa-folder-open"></i><span>LFI</span></div>' +
      '<div class="vuln-info"><div class="vuln-name">Local File Inclusion (LFI)</div><div class="vuln-desc">Local File Inclusion (LFI) leads to undefined by sent\'s or forgeral code isct error with server attempt.</div></div>' +
      '<canvas class="vuln-sparkline" id="spark-lfi"></canvas>' +
      '<div class="vuln-badge high2">HIGH</div>' +
      '</div>' +
 
      '<div class="vuln-card vuln-medium">' +
      '<div class="vuln-icon"><i class="fas fa-link"></i><span>SSRF</span></div>' +
      '<div class="vuln-info"><div class="vuln-name">Server-Side Request Forgery (SSRF)</div><div class="vuln-desc">Server-Side Request Forgery (SSRF) sends to vulnerability automated from copy https-forequest-severed with Endpoint : /api/proxy.</div></div>' +
      '<canvas class="vuln-sparkline" id="spark-ssrf"></canvas>' +
      '<div class="vuln-badge medium">MEDIUM</div>' +
      '</div>' +
 
      '<div class="vuln-card vuln-medium2">' +
      '<div class="vuln-icon"><i class="fas fa-route"></i><span>PT</span></div>' +
      '<div class="vuln-info"><div class="vuln-name">Path Traversal</div><div class="vuln-desc">Path Traversal scanners now vulnerability (Path Traversal) and not lead the path of as patens to preview by the expression field.</div></div>' +
      '<canvas class="vuln-sparkline" id="spark-pt"></canvas>' +
      '<div class="vuln-badge medium2">MEDIUM</div>' +
      '</div>' +
 
      '</div>' +
 
      /* RIGHT: WEBVIEW TERMINAL */
      '<div class="scanner-right">' +
      '<div class="scanner-section-title"><i class="fas fa-terminal"></i> WEBVIEW COMMAND TERMINAL</div>' +
      '<div class="terminal-bar">' +
      '<span class="terminal-input-lbl">INPUT: <span class="terminal-cursor">_</span></span>' +
      '<span class="terminal-crawl-status">SELECTIVE CRAWL: <span style="color:#00ff88">[active]</span></span>' +
      '</div>' +
      '<div class="terminal-browser">' +
      '<div class="browser-tabs">' +
      '<div class="browser-tab active"><i class="fab fa-chrome"></i> Google Search <span class="tab-close">&times;</span></div>' +
      '<div class="browser-tab-add">+</div>' +
      '</div>' +
      '<div class="browser-address">' +
      '<span class="browser-nav"><i class="fas fa-chevron-left"></i> <i class="fas fa-chevron-right"></i> <i class="fas fa-rotate-right"></i></span>' +
      '<span class="browser-url-bar"><i class="fas fa-lock"></i> <span id="browser-url-text">www.google.com</span></span>' +
      '<span class="browser-actions"><i class="fas fa-star"></i> <i class="fas fa-bookmark"></i> <i class="fas fa-user"></i></span>' +
      '</div>' +
      '<iframe id="webview-frame" class="browser-iframe" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" src="about:blank"></iframe>' +
      '</div>' +
      '<div class="terminal-status">' +
      '<span class="crawl-anim" id="crawl-status-text">ACTIVE CRAWLING... <i class="fas fa-spinner fa-spin"></i></span>' +
      '<span id="data-sync-text">0% DATA SYNC</span>' +
      '<span class="sync-bar"><span class="sync-fill" id="sync-fill" style="width:0%"></span></span>' +
      '</div>' +
      '</div>' +
 
      '</div>' +
 
      /* BOTTOM STATUS BAR */
      '<div class="scanner-bottombar">' +
      '<span><i class="fas fa-circle" style="color:#00ff88;font-size:8px"></i> SYSTEM STATUS: <span style="color:#00ff88">ONLINE</span></span>' +
      '<span><i class="fas fa-wifi" style="color:#00e5ff"></i> CONNECTION: <span style="color:#00e5ff">SECURE</span></span>' +
      '<span><i class="fas fa-microchip" style="color:#ff0040"></i> ENGINE: <span style="color:#ff0040">AI POWERED</span></span>' +
      '<span><i class="fas fa-clock" style="color:#00e5ff"></i> TIME: <span id="scanner-time">' + new Date().toLocaleTimeString() + '</span></span>' +
      '<span><i class="fas fa-user" style="color:#ffe100"></i> USER: <span style="color:#ffe100">SECURITY ANALYST</span></span>' +
      '</div>' +
 
      '</div>';
 
    container.innerHTML = html;
    WebViewScanner.drawAllSparklines();
    WebViewScanner.startClock();
    var btn = document.getElementById("btn-scan");
    if (btn) btn.addEventListener("click", WebViewScanner.startScan);
    // Load URL into iframe on Enter
    var urlInput = document.getElementById("scan-url");
    if (urlInput) urlInput.addEventListener("keydown", function (e) { if (e.key === "Enter") WebViewScanner.startScan(); });
  },
 
  drawAllSparklines: function () {
    WebViewScanner.drawSparkline("spark-sql", "rgba(255, 0, 64, 1)");
    WebViewScanner.drawSparkline("spark-xss", "rgba(0, 229, 255, 1)");
    WebViewScanner.drawSparkline("spark-lfi", "rgba(0, 255, 136, 1)");
    WebViewScanner.drawSparkline("spark-ssrf", "rgba(255, 105, 180, 1)");
    WebViewScanner.drawSparkline("spark-pt", "rgba(255, 225, 0, 1)");
  },
 
  drawSparkline: function (canvasId, color) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var width = canvas.width = 160;
    var height = canvas.height = 60;
    ctx.clearRect(0, 0, width, height);
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    
    ctx.beginPath();
    var pts = [];
    var segments = 12;
    for (var i = 0; i <= segments; i++) {
      var x = (i / segments) * width;
      var y = height/2 + (Math.random() - 0.5) * height * 0.7;
      pts.push({ x: x, y: y });
    }
    
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = color.replace("1)", "0.08)");
    ctx.fill();
  },
 
  startClock: function () {
    if (WebViewScanner._clock) clearInterval(WebViewScanner._clock);
    WebViewScanner._clock = setInterval(function () {
      var el = document.getElementById("scanner-time");
      if (el) el.textContent = new Date().toLocaleTimeString();
    }, 1000);
  },

  startScan: function () {
    var urlInput = document.getElementById("scan-url");
    var btn = document.getElementById("btn-scan");
    if (!urlInput || !btn) return;
    var url = urlInput.value.trim();
    if (!url) { AlertManager.show("Enter a URL to scan.", "error"); return; }

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SCANNING...';
    WebViewScanner.scanActive = true;

    // Load URL into iframe
    var frame = document.getElementById("webview-frame");
    var urlText = document.getElementById("browser-url-text");
    try {
      var u = new URL(url);
      if (urlText) urlText.textContent = u.hostname + u.pathname;
      if (frame) frame.src = "/api/proxy?url=" + encodeURIComponent(url);
    } catch (e) {
      if (frame) frame.src = "/api/proxy?url=" + encodeURIComponent(url);
      if (urlText) urlText.textContent = url;
    }

    // Animate sync bar
    var syncFill = document.getElementById("sync-fill");
    var syncText = document.getElementById("data-sync-text");
    var crawlText = document.getElementById("crawl-status-text");
    var progress = 0;
    var syncInterval = setInterval(function () {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(syncInterval);
        btn.innerHTML = '<i class="fas fa-crosshairs"></i> SCAN';
        WebViewScanner.scanActive = false;
        if (crawlText) crawlText.innerHTML = 'SCAN COMPLETE <i class="fas fa-check-circle" style="color:#00ff88"></i>';
        if (syncText) syncText.textContent = '100% DATA SYNC';
        if (syncFill) syncFill.style.width = '100%';
        WebViewScanner.saveReport(url);
        AlertManager.show("Scan complete for: " + url, "success");
      }
      if (syncFill) syncFill.style.width = Math.min(100, progress) + "%";
      if (syncText) syncText.textContent = Math.round(progress) + "% DATA SYNC";
    }, 300);
  },

  saveReport: function (url) {
    var hostname = "";
    try { hostname = new URL(url).hostname.replace(/\./g, "_"); } catch (e) { hostname = "unknown"; }
    var timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    var filename = "scan_" + hostname + "_" + timestamp + ".pdf";

    // Create simple text report (base64 encoded for PDF)
    var reportText = "NEXUS SHADOW // WEBVIEW SCAN REPORT\n" +
      "=====================================\n\n" +
      "Target URL: " + url + "\n" +
      "Scan Time: " + new Date().toISOString() + "\n" +
      "Scanner: NEXUS SHADOW WebView Scanner v3.0\n\n" +
      "VULNERABILITIES FOUND:\n" +
      "- SQL Injection: Potential\n" +
      "- XSS: Potential\n" +
      "- LFI: Potential\n" +
      "- SSRF: Potential\n" +
      "- Path Traversal: Potential\n\n" +
      "STATUS: SCAN COMPLETE";

    // Save via server API
    fetch("/api/save-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "webview_scans",
        filename: filename,
        content: btoa(reportText)
      })
    }).then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.success) console.log("Report saved: " + filename);
      }).catch(function (e) { console.error("Save failed:", e); });
  }
};

/* ==========================================
   PAGE 3 — Intelligence Archive
   ========================================== */
var IntelligenceArchive = {
  render: function (container) {
    var reports = [
      { id: "RPT-ID_70010", cls: "CLASSIFIED", clsColor: "#ff0040", summary: "DEEP WEB CRYPTO-EXCHANGE BREACH Forensics", origin: "I2P DARKNET", date: "12/10/2026" },
      { id: "RPT-ID_80021", cls: "RESTRICTED", clsColor: "#ff8c00", summary: "Google Data Error Anomalies: IP TRACELOG Gaps", origin: "GOOGLE (Error Logs)", date: "12/10/2026" },
      { id: "RPT-ID_90005", cls: "TOP SECRET", clsColor: "#ff0040", summary: "ZERO-DAY EXPLOIT MITIGATION PROTOCOLS v1.1", origin: "internal command", date: "12/10/2026" },
      { id: "RPT-ID_01002", cls: "UNCLASSIFIED", clsColor: "#00ff88", summary: "SYSTEM COMPLIANCE AUDIT / IP TRAFFIC SUMMARY", origin: "SYSTEM LOGS", date: "12/10/2026" },
      { id: "RPT-ID_02012", cls: "RESTRICTED", clsColor: "#ff8c00", summary: "User-ITE Activity: SYSTEM Anomalies Log", origin: "internal server", date: "12/10/2026" }
    ];

    var html =
      '<div class="archive-layout">' +

      /* LEFT PANELS */
      '<div class="archive-left">' +

      /* DATA STREAM */
      '<div class="glass-panel">' +
      '<div class="panel-header"><span class="panel-num">01</span> ARCHIVE NAVIGATION PROTOCOLS</div>' +
      '<div class="panel-row"><label class="panel-lbl">DATA STREAM TACTICAL OVERVIEW</label></div>' +
      '<div class="data-stream-box">' +
      '<div class="stream-text" id="stream-text"></div>' +
      '<div class="stream-center"><i class="fas fa-project-diagram" style="font-size:24px;color:var(--cyan)"></i><div style="font-size:8px;color:var(--cyan);margin-top:4px">CYBER-PUN-01</div></div>' +
      '</div>' +
      '</div>' +

      /* SYSTEM CONTROLS */
      '<div class="glass-panel">' +
      '<div class="panel-header"><span class="panel-num">02</span> SYSTEM SCOPE CONTROLS</div>' +
      '<div class="panel-row"><label class="panel-lbl">ENCRYPTION STRENGTH</label></div>' +
      '<div class="panel-input-row"><input type="range" class="panel-slider" min="0" max="100" value="80"></div>' +
      '<div class="panel-row"><label class="panel-lbl">ANONYMITY ROUTER</label></div>' +
      '<div class="panel-input-row"><input type="range" class="panel-slider" min="0" max="100" value="95"></div>' +
      '<div class="panel-row"><label class="panel-lbl">OPSEC LEVEL: <span style="color:var(--green)">MAXIMUM</span></label></div>' +
      '</div>' +

      /* SEARCH */
      '<div class="glass-panel">' +
      '<div class="panel-header"><span class="panel-num">03</span> SEARCH / FILTER QUERY</div>' +
      '<div class="panel-input-row">' +
      '<input class="panel-inp" type="text" placeholder="Search Intel Node / IP" style="flex:1">' +
      '<button class="btn-danger" style="flex:none;width:36px"><i class="fas fa-search"></i></button>' +
      '</div>' +
      '<div class="panel-row" style="gap:12px">' +
      '<label class="panel-lbl"><input type="radio" name="src" checked> Source: All</label>' +
      '<label class="panel-lbl"><input type="radio" name="fmt"> Format: PDF</label>' +
      '</div>' +
      '</div>' +

      /* METRICS */
      '<div class="glass-panel">' +
      '<div class="panel-header"><span class="panel-num">04</span> OPERATOR INTERFACE METRICS</div>' +
      '<div class="panel-row"><label class="panel-lbl">USER ID: <span style="color:var(--cyan)">OPS_AGENT_7</span></label></div>' +
      '<div class="panel-row"><label class="panel-lbl">STATUS: <span style="color:var(--green)">ACTIVE CRAWLING</span></label></div>' +
      '</div>' +

      '</div>' +

      /* RIGHT: REPORT TABLE */
      '<div class="archive-right">' +
      '<div class="archive-table-header">INTELLIGENCE REPORT LIBRARY // PDF ARCHIVE</div>' +
      '<table class="archive-table">' +
      '<thead><tr>' +
      '<th style="width:40px"></th><th>FINDING ID</th><th>CLASSIFICATION</th><th>SUMMARY</th><th>ORIGIN</th><th>DATE</th><th>ARCHIVE</th>' +
      '</tr></thead><tbody>';

    for (var i = 0; i < reports.length; i++) {
      var r = reports[i];
      html +=
        '<tr>' +
        '<td><i class="fas fa-file-pdf" style="color:#ff0040;font-size:16px"></i></td>' +
        '<td style="color:var(--cyan)">' + r.id + '</td>' +
        '<td><span class="cls-badge" style="color:' + r.clsColor + ';border-color:' + r.clsColor + '">' + r.cls + '</span></td>' +
        '<td>' + r.summary + '</td>' +
        '<td style="color:var(--cyan)">' + r.origin + '</td>' +
        '<td>' + r.date + '</td>' +
        '<td><button class="btn-open-pdf">[OPEN PDF]</button></td>' +
        '</tr>';
    }

    html += '</tbody></table></div>' +
      '</div>';

    container.innerHTML = html;
    IntelligenceArchive.startDataStream();
    IntelligenceArchive.loadReports();
  },

  loadReports: function () {
    fetch("/api/reports").then(function (r) { return r.json(); }).then(function (reports) {
      var tbody = document.getElementById("archive-table-body");
      if (!tbody) return;
      var totalEl = document.getElementById("total-reports");
      if (reports.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:20px">No reports yet. Run a scan from WebView Scanner.</td></tr>';
        if (totalEl) totalEl.textContent = "0";
        return;
      }
      if (totalEl) totalEl.textContent = reports.length;
      var clsList = ["CLASSIFIED", "RESTRICTED", "TOP SECRET", "UNCLASSIFIED", "CONFIDENTIAL"];
      var clsColors = { CLASSIFIED: "#ff0040", RESTRICTED: "#ff8c00", "TOP SECRET": "#ff0040", UNCLASSIFIED: "#00ff88", CONFIDENTIAL: "#ff69b4" };
      var html = "";
      for (var i = 0; i < reports.length; i++) {
        var r = reports[i];
        var cls = clsList[i % clsList.length];
        var color = clsColors[cls] || "#00e5ff";
        var d = new Date(r.date);
        var ds = String(d.getMonth() + 1).padStart(2, "0") + "/" + String(d.getDate()).padStart(2, "0") + "/" + d.getFullYear();
        var summary = r.name.replace(/_/g, " ").replace(/\.pdf$/, "");
        html += '<tr><td><i class="fas fa-file-pdf" style="color:#ff0040;font-size:16px"></i></td><td style="color:var(--cyan)">RPT-' + String(i + 1).padStart(5, "0") + '</td><td><span class="cls-badge" style="color:' + color + ';border-color:' + color + '">' + cls + '</span></td><td>' + summary + '</td><td style="color:var(--cyan)">' + r.category.toUpperCase() + '</td><td>' + ds + '</td><td><button class="btn-open-pdf" data-pdf="' + r.category + '/' + r.name + '">[OPEN PDF]</button></td></tr>';
      }
      tbody.innerHTML = html;
      tbody.querySelectorAll(".btn-open-pdf").forEach(function (b) { b.addEventListener("click", function () { IntelligenceArchive.openPdf(this.getAttribute("data-pdf")); }); });
    }).catch(function () { });
  },

  openPdf: function (p) { window.open("/api/pdf/" + encodeURIComponent(p), "_blank"); },

  startDataStream: function () {
    var el = document.getElementById("stream-text");
    if (!el) return;
    var chars = "01";
    function gen() {
      var lines = [];
      for (var i = 0; i < 8; i++) {
        var line = "";
        for (var j = 0; j < 18; j++) line += chars[Math.floor(Math.random() * 2)];
        lines.push(line);
      }
      el.textContent = lines.join("\n");
    }
    gen();
    IntelligenceArchive._stream = setInterval(gen, 150);
  }
};

/* ==========================================
   PAGE 4 — Darknet Dashboard
   ========================================== */
var DarknetDashboard = {
  logs: [
    "[11:15:30] KERNEL THREAD 0: WARNING - HIGH LOAD",
    "[11:15:32] SERVICE [AETHER-NET] RESTARTING...",
    "[11:15:34] CRAWLER INSTANCE 4: LOCKED - [104.22.6.7]",
    "[11:15:35] PROCESS [SHADOW_ENGINE] MEMORY SPIKE DETECTED",
    "[11:15:36] SERVICE [AETHER-NET] RESTARTING...",
    "[11:15:37] PROCESS [SHADOW_ENGINE] MEMORY SPIKE DETECTED",
    "[11:15:38] PROCESS [SHADOW_ENGINE] MEMORY SPIKE DETECTED",
    "[11:15:39] SERVICE [AETHER-NET] RESTARTING..."
  ],

  processes: [
    { pid: "[3412]", name: "shadow_engine", cpu: "48.2%", mem: "1.1 GB", status: "RUNNING", statusColor: "#00ff88" },
    { pid: "[2811]", name: "data_sync_x4", cpu: "22.1%", mem: "512 MB", status: "COMPLETED", statusColor: "#00e5ff" },
    { pid: "[1998]", name: "alert_service", cpu: "1.8%", mem: "128 MB", status: "ACTIVE", statusColor: "#ff0040" }
  ],

  render: function (container) {
    var html =
      '<div class="darknet-layout">' +

      '<div class="darknet-topstatus">' +
      '<span class="darknet-dot red"></span> LIVE INTEL STREAM / ALL REGIONS SYNCED / SYSTEM UNIT 004' +
      '</div>' +

      '<div class="darknet-gauges">' +
      '<div class="gauge-card"><canvas id="gauge-cpu" width="200" height="200"></canvas><div class="gauge-label">CPU: <span id="gauge-cpu-val">--</span></div></div>' +
      '<div class="gauge-card"><canvas id="gauge-ram" width="200" height="200"></canvas><div class="gauge-label">RAM: <span id="gauge-ram-val">--</span></div></div>' +
      '<div class="gauge-card"><canvas id="gauge-disk" width="200" height="200"></canvas><div class="gauge-label">DISK: <span id="gauge-disk-val">--</span></div></div>' +
      '<div class="gauge-card"><canvas id="gauge-net" width="200" height="200"></canvas><div class="gauge-label">NETWORK: <span id="gauge-net-val">--</span></div></div>' +
      '</div>' +

      '<div class="darknet-log">' +
      '<div class="darknet-log-title">LIVE LOG</div>' +
      '<div class="darknet-log-content" id="darknet-log"></div>' +
      '</div>' +

      '<div class="darknet-process">' +
      '<table class="process-table">' +
      '<thead><tr><th>PID</th><th>PROCESS NAME</th><th>CPU%</th><th>MEMORY</th><th>STATUS</th></tr></thead>' +
      '<tbody>' +
      '<tr><td style="color:var(--cyan)">[3412]</td><td style="color:var(--red)">shadow_engine</td><td id="proc-cpu1">--</td><td id="proc-mem1">--</td><td style="color:var(--green)">RUNNING</td></tr>' +
      '<tr><td style="color:var(--cyan)">[2811]</td><td style="color:var(--red)">data_sync_x4</td><td>22.1%</td><td>512 MB</td><td style="color:var(--cyan)">COMPLETED</td></tr>' +
      '<tr><td style="color:var(--cyan)">[1998]</td><td style="color:var(--red)">alert_service</td><td>1.8%</td><td>128 MB</td><td style="color:var(--red)">ACTIVE</td></tr>' +
      '</tbody></table>' +
      '<div class="process-pagination"><span class="pg-btn">&lt;</span><span class="pg-active">1</span><span class="pg-btn">2</span><span class="pg-btn">3</span><span class="pg-btn">&gt;</span></div>' +
      '</div>' +

      '<div class="darknet-bottomstatus">' +
      'SYSTEM STATUS: <span style="color:var(--red)">CRITICAL</span> - UNIT 004 / ' + new Date().toLocaleDateString() +
      '</div>' +

      '</div>';

    container.innerHTML = html;
    DarknetDashboard.renderLogs();
    DarknetDashboard.fetchMetrics();
    DarknetDashboard.startLiveUpdate();
  },

  fetchMetrics: function () {
    fetch("/api/system").then(function (r) { return r.json(); }).then(function (m) {
      DarknetDashboard.metrics = m;
      DarknetDashboard.updateGauges(m);
    }).catch(function () {
      // Fallback if server not available
      DarknetDashboard.metrics = { cpu: { percent: 50 }, ram: { percent: 60 }, disk: { percent: 45 }, network: { speed: "0 Mbps" } };
      DarknetDashboard.updateGauges(DarknetDashboard.metrics);
    });
  },

  updateGauges: function (m) {
    var cpuVal = m.cpu.percent || 0;
    var ramVal = m.ram.percent || 0;
    var diskVal = m.disk.percent || 0;

    document.getElementById("gauge-cpu-val").textContent = cpuVal + "%";
    document.getElementById("gauge-ram-val").textContent = ramVal + "%";
    document.getElementById("gauge-disk-val").textContent = diskVal + "%";
    document.getElementById("gauge-net-val").textContent = m.network.speed || "0 Mbps";

    var procCpu = document.getElementById("proc-cpu1");
    var procMem = document.getElementById("proc-mem1");
    if (procCpu) procCpu.textContent = Math.round(cpuVal * 0.5) + "%";
    if (procMem) {
      var usedGB = (m.ram.used / 1073741824).toFixed(1);
      procMem.textContent = usedGB + " GB";
    }

    DarknetDashboard.drawGauge("gauge-cpu", cpuVal, cpuVal > 85 ? "#ff0040" : "#00e5ff");
    DarknetDashboard.drawGauge("gauge-ram", ramVal, ramVal > 85 ? "#ff0040" : "#00e5ff");
    DarknetDashboard.drawGauge("gauge-disk", diskVal, diskVal > 85 ? "#ff0040" : "#00ff88");
    DarknetDashboard.drawGauge("gauge-net", 60, "#00e5ff");
  },

  renderLogs: function () {
    var el = document.getElementById("darknet-log");
    if (!el) return;
    el.innerHTML = DarknetDashboard.logs.map(function (l) {
      return '<div class="log-line">' + l + '</div>';
    }).join("");
  },

  drawGauge: function (canvasId, value, color) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var cx = 100, cy = 110, r = 80;

    ctx.clearRect(0, 0, 200, 200);

    /* Background arc */
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, 0, false);
    ctx.lineWidth = 14;
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.stroke();

    /* Value arc */
    var angle = Math.PI + (value / 100) * Math.PI;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, angle, false);
    ctx.lineWidth = 14;
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    ctx.stroke();

    /* Glow */
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, angle, false);
    ctx.lineWidth = 6;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.shadowBlur = 0;

    /* Ticks */
    for (var i = 0; i <= 10; i++) {
      var a = Math.PI + (i / 10) * Math.PI;
      var x1 = cx + Math.cos(a) * (r - 12);
      var y1 = cy + Math.sin(a) * (r - 12);
      var x2 = cx + Math.cos(a) * (r + 8);
      var y2 = cy + Math.sin(a) * (r + 8);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    /* Danger zone arc */
    ctx.beginPath();
    ctx.arc(cx, cy, r + 12, Math.PI * 1.6, Math.PI * 2, false);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255,0,64,0.4)";
    ctx.stroke();
  },

  drawGauges: function () {
    DarknetDashboard.drawGauge("gauge-cpu", 94, "#ff0040");
    DarknetDashboard.drawGauge("gauge-ram", 88, "#00e5ff");
    DarknetDashboard.drawGauge("gauge-disk", 72, "#00ff88");
    DarknetDashboard.drawGauge("gauge-net", 60, "#00e5ff");
  },

  startLiveUpdate: function () {
    if (DarknetDashboard._live) clearInterval(DarknetDashboard._live);
    DarknetDashboard._live = setInterval(function () {
      var msgs = [
        "KERNEL THREAD " + Math.floor(Math.random() * 8) + ": WARNING - HIGH LOAD",
        "SERVICE [AETHER-NET] RESTARTING...",
        "CRAWLER INSTANCE " + Math.floor(Math.random() * 10) + ": LOCKED - [104." + Math.floor(Math.random() * 255) + "." + Math.floor(Math.random() * 255) + ".7]",
        "PROCESS [SHADOW_ENGINE] MEMORY SPIKE DETECTED",
        "ALERT: ANOMALOUS TRAFFIC FROM NODE " + Math.floor(Math.random() * 256),
        "SYNC ENGINE: DATA PACKETS DROPPED - RETRYING..."
      ];
      var now = new Date();
      var ts = "[" + String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0") + ":" + String(now.getSeconds()).padStart(2, "0") + "]";
      DarknetDashboard.logs.push(ts + " " + msgs[Math.floor(Math.random() * msgs.length)]);
      if (DarknetDashboard.logs.length > 20) DarknetDashboard.logs.shift();
      DarknetDashboard.renderLogs();
      var el = document.getElementById("darknet-log");
      if (el) el.scrollTop = el.scrollHeight;

      // Fetch real metrics
      fetch("/api/system").then(function (r) { return r.json(); }).then(function (m) {
        DarknetDashboard.metrics = m;
        DarknetDashboard.updateGauges(m);
      }).catch(function () { });
    }, 3000);
  }
};

/* ==========================================
   BOOT
   ========================================== */
document.addEventListener("DOMContentLoaded", function () {
  App.init();
  DeviceManager.init();
});
