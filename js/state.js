/* =========================================================
   STATE MANAGEMENT
   ========================================================= */
function loadState() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    var parsed = JSON.parse(raw);
    var def = defaultState();
    return {
      ...def, ...parsed,
      brief: { ...def.brief, ...parsed.brief },
      format: { ...def.format, ...parsed.format },
      audio: { ...def.audio, ...parsed.audio }
    };
  } catch(e) { return defaultState(); }
}

var state = loadState();

var saveTimer = null;
function saveState() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(function() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      var el = document.getElementById("saveStatus");
      if (el) {
        el.textContent = "Saved";
        el.classList.add("saved");
        setTimeout(function() { el.classList.remove("saved"); }, 800);
      }
    } catch(e) {}
  }, 250);
}

function getPath(path) { return path.split(".").reduce(function(o, k) { return (o == null ? o : o[k]); }, state); }
function setPath(path, value) {
  var parts = path.split(".");
  var obj = state;
  for (var i = 0; i < parts.length - 1; i++) {
    if (obj[parts[i]] == null) obj[parts[i]] = {};
    obj = obj[parts[i]];
  }
  obj[parts[parts.length - 1]] = value;
  saveState();
}
function uid(prefix) { return prefix + "_" + Math.random().toString(36).slice(2, 8); }
function pad2(n) { return String(n).padStart(2, "0"); }
function sceneIdAt(i) { return "sc" + pad2(i + 1); }
function shotIdAt(si, shi) { return sceneIdAt(si) + "_sh" + pad2(shi + 1); }
function imageIdAt(si, shi) { return shotIdAt(si, shi) + "_still"; }
