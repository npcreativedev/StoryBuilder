/* =========================================================
   APP — Event handlers, example data, init
   ========================================================= */
var currentSubtab = "characters_text";

/* =========================================================
   RENDER ROUTER
   ========================================================= */
function renderCurrentTab() {
  var activeTab = document.querySelector("nav.tabs button.active").dataset.tab;
  if (activeTab === "starter") renderStarter();
  else if (activeTab === "format") renderFormat();
  else if (activeTab === "story") renderStory();
  else if (activeTab === "cast") renderCast();
  else if (activeTab === "scenes") renderScenes();
  else if (activeTab === "audio") renderAudio();
  else if (activeTab === "export") renderExport();
}

/* =========================================================
   EVENT HANDLERS
   ========================================================= */
document.getElementById("tabs").addEventListener("click", function(e) {
  var btn = e.target.closest("button[data-tab]");
  if (!btn) return;
  document.querySelectorAll("nav.tabs button").forEach(function(b) { b.classList.remove("active"); });
  btn.classList.add("active");
  document.querySelectorAll(".panel").forEach(function(p) { p.classList.remove("active"); });
  document.getElementById("panel-" + btn.dataset.tab).classList.add("active");
  renderCurrentTab();
});

document.getElementById("main").addEventListener("input", function(e) {
  var target = e.target;
  var bind = target.dataset.bind;

  if (bind && bind.startsWith("castRefs.")) {
    var idx = parseInt(bind.split(".")[1], 10);
    state.cast[idx].referenceImages = target.value.split(",").map(function(s) { return s.trim(); }).filter(Boolean);
    saveState();
    return;
  }
  if (bind && bind.startsWith("castDoNot.")) {
    var idx2 = parseInt(bind.split(".")[1], 10);
    state.cast[idx2].doNotChange = target.value.split(",").map(function(s) { return s.trim(); }).filter(Boolean);
    saveState();
    return;
  }

  if (bind) {
    setPath(bind, target.value);
    if (document.getElementById("panel-export").classList.contains("active")) renderExport();
    return;
  }
});

document.getElementById("main").addEventListener("keydown", function(e) {
  if (e.target.id === "genreInput" && e.key === "Enter") {
    var val = e.target.value.trim();
    if (val) {
      state.brief.genreTone.push(val);
      saveState();
      e.target.value = "";
      renderStory();
      document.getElementById("genreInput").focus();
    }
  }
});

document.getElementById("main").addEventListener("click", function(e) {
  // 1. Check for View Toggle first
  var viewBtn = e.target.closest("[data-view]");
  if (viewBtn) {
    currentViewMode = viewBtn.dataset.view;
    renderScenes();
    return;
  }

  // 2. Check for regular actions
  var target = e.target.closest("[data-action]");
  if (!target) return;

  var action = target.dataset.action;
  var index = parseInt(target.dataset.index, 10);
  var si = parseInt(target.dataset.si, 10);
  var shi = parseInt(target.dataset.shi, 10);
  var ci = parseInt(target.dataset.ci, 10);

  if (action === "add-beat") {
    state.beats.push({ summary: "" });
    saveState(); renderStory();
    var inputs = document.querySelectorAll("#beatsList input");
    if (inputs.length) inputs[inputs.length - 1].focus();
  }
  else if (action === "del-beat") { state.beats.splice(index, 1); saveState(); renderStory(); }
  else if (action === "add-rule") {
    state.brief.continuityRules.push("");
    saveState(); renderStory();
    var inputs2 = document.querySelectorAll("#rulesList input");
    if (inputs2.length) inputs2[inputs2.length - 1].focus();
  }
  else if (action === "del-rule") { state.brief.continuityRules.splice(index, 1); saveState(); renderStory(); }
  else if (action === "del-genre") { state.brief.genreTone.splice(index, 1); saveState(); renderStory(); }
  else if (action === "add-cast") {
    state.cast.push({
      id: uid("c"), name: "", age: "", face: "", hair: "", eyes: "",
      wardrobe: "", signature: "", extra: "", customIdentityLock: "",
      referenceImages: [], doNotChange: [],
      voice: { age: "", timbre: "", pace: "", accent: "" }
    });
    saveState(); renderCast();
  }
  else if (action === "del-cast") {
    if (!confirm("Delete this character? Shots referencing it will lose their subject.")) return;
    state.cast.splice(index, 1);
    saveState(); renderCast();
  }
  else if (action === "copy-sheet") {
    copyText(buildCharacterSheetPrompt(state.cast[ci]), "Character Sheet Prompt");
  }
  else if (action === "add-scene") {
    state.scenes.push({
      id: uid("s"), title: "", description: "",
      defaults: { environment: "", key: "", fill: "", contrast: "", timeOfDay: "", palette: "", texture: "", mood: "", ambience: "" },
      shots: []
    });
    saveState(); renderScenes();
  }
  else if (action === "del-scene") {
    if (!confirm("Delete this scene and all its shots?")) return;
    state.scenes.splice(index, 1);
    saveState(); renderScenes();
  }
  else if (action === "add-shot") {
    state.scenes[si].shots.push({
      id: uid("sh"), size: "medium", angle: "eye level", lens: "35mm", dof: "medium",
      move: "static", speed: "", castId: "", action: "", durationSec: 8,
      dialogue: "", sfx: "", negative: "", mode: "frames_to_video", targetImage: "",
      overrides: {}, extraIngredients: []
    });
    saveState(); renderScenes();
    setTimeout(function() {
      var cards = document.querySelectorAll("#panel-scenes .card");
      if (cards.length) cards[cards.length - 1].scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }
  else if (action === "del-shot") {
    state.scenes[si].shots.splice(shi, 1);
    saveState(); renderScenes();
  }
  else if (action === "randomize-angle") {
    var sizes = ["wide", "medium", "close-up", "extreme close-up"];
    var angles = ["eye level", "low angle", "high angle", "dutch angle", "over the shoulder"];
    state.scenes[si].shots[shi].size = sizes[Math.floor(Math.random() * sizes.length)];
    state.scenes[si].shots[shi].angle = angles[Math.floor(Math.random() * angles.length)];
    saveState(); renderScenes();
  }
  else if (action === "add-ing") {
    var shot = state.scenes[si].shots[shi];
    if (!shot.extraIngredients) shot.extraIngredients = [];
    shot.extraIngredients.push({ type: "reference", media: "", use: "" });
    saveState(); renderScenes();
  }
  else if (action === "del-ing") {
    state.scenes[si].shots[shi].extraIngredients.splice(index, 1);
    saveState(); renderScenes();
  }
  else if (action === "add-music") {
    state.audio.musicCues.push({ sceneId: "", prompt: "" });
    saveState(); renderAudio();
  }
  else if (action === "del-music") {
    state.audio.musicCues.splice(index, 1);
    saveState(); renderAudio();
  }
  else if (action === "copy-img-prompt" || action === "copy-video-prompt") {
    var shot2 = state.scenes[si].shots[shi];
    var scene2 = state.scenes[si];
    if (action === "copy-img-prompt") {
      var imgNegs = [];
      if (state.brief.imageNegative) imgNegs.push(state.brief.imageNegative);
      if (shot2.negative) imgNegs.push(shot2.negative);
      var text = buildImagePromptText(shot2, scene2) + "\n\nNegative: " + imgNegs.join(", ");
      copyText(text, "Image Prompt");
    } else {
      copyText(buildVideoPromptText(shot2, scene2), "Video Prompt");
    }
  }
  else if (action === "copy-single") {
    copyText(target.dataset.text, "Prompt");
  }
  else if (action === "copy-artifact") {
    var artifacts = {
      images_json: JSON.stringify(compileImages(), null, 2),
      video_json: JSON.stringify(compileVideo(), null, 2),
      brief: JSON.stringify(compileBrief(), null, 2),
      cast: JSON.stringify(compileCast(), null, 2),
      audio: JSON.stringify(compileAudio(), null, 2),
      shotlist: compileShotlist(),
      bundle: JSON.stringify(compileBundle(), null, 2)
    };
    copyText(artifacts[currentSubtab], currentSubtab);
  }
  else if (action === "download-artifact") {
    var artifacts2 = {
      images_json: { name: "images.json", body: JSON.stringify(compileImages(), null, 2) },
      video_json: { name: "video.json", body: JSON.stringify(compileVideo(), null, 2) },
      brief: { name: "brief.json", body: JSON.stringify(compileBrief(), null, 2) },
      cast: { name: "cast.json", body: JSON.stringify(compileCast(), null, 2) },
      audio: { name: "audio.json", body: JSON.stringify(compileAudio(), null, 2) },
      shotlist: { name: "shotlist.md", body: compileShotlist() },
      bundle: { name: "project_bundle.json", body: JSON.stringify(compileBundle(), null, 2) }
    };
    download(artifacts2[currentSubtab].name, artifacts2[currentSubtab].body);
  }
});

document.addEventListener("click", function(e) {
  var btn = e.target.closest("[data-subtab]");
  if (!btn) return;
  currentSubtab = btn.dataset.subtab;
  renderExport();
});

/* =========================================================
   HEADER ACTIONS
   ========================================================= */
document.getElementById("btnLoadExample").addEventListener("click", function() {
  if (!confirm("Load the example project? This will replace your current work.")) return;
  state = exampleState();
  saveState();
  renderCurrentTab();
  toast("Example loaded");
});

document.getElementById("btnClear").addEventListener("click", function() {
  if (!confirm("Clear all fields? This cannot be undone.")) return;
  state = defaultState();
  saveState();
  renderCurrentTab();
  toast("Cleared");
});

document.getElementById("btnExportProject").addEventListener("click", function() {
  download("project_state.json", JSON.stringify(state, null, 2));
});

/* =========================================================
   STARTER — Prompt generation (functions live here; listeners
   attached in renderStarter() since DOM elements are created there)
   ========================================================= */
var _starterPromptCache = "";

function _generateStarterPrompt(desc) {
  var promptText = 'You are a professional video storyboarding assistant. Convert the user project description below into a complete StoryBuilder project JSON.\n\n';
  promptText += '=== INSTRUCTIONS ===\n\n';
  promptText += 'Generate a valid JSON object that conforms to the StoryBuilder schema described below. Fill in ALL fields — do not leave any empty.\n\n';
  promptText += 'IMPORTANT: Use the user description as the primary source. When details are missing, make creative but sensible choices that serve the story and maintain consistency.\n\n';
  promptText += '=== STORYBUILDER JSON SCHEMA ===\n\n';
  promptText += '{\n';
  promptText += '  "meta": {\n';
  promptText += '    "schemaVersion": "1.0",\n';
  promptText += '    "projectId": "a_short_kebab_case_id_like_ep001_project_name",\n';
  promptText += '    "title": "The Title of the Project"\n';
  promptText += '  },\n';
  promptText += '  "format": {\n';
  promptText += '    "platform": "youtube_short | youtube_long | instagram_reel | tiktok",\n';
  promptText += '    "aspectRatio": "9:16 | 16:9 | 1:1 | 4:5",\n';
  promptText += '    "targetDurationSec": 45,\n';
  promptText += '    "language": "en"\n';
  promptText += '  },\n';
  promptText += '  "brief": {\n';
  promptText += '    "logline": "One sentence. The central dramatic question of the entire project.",\n';
  promptText += '    "genreTone": ["genre1", "tone1", "tone2"],\n';
  promptText += '    "visualStyle": {\n';
  promptText += '      "palette": "color palette description",\n';
  promptText += '      "lighting": "lighting style description",\n';
  promptText += '      "lens": "lens description like 35mm anamorphic feel",\n';
  promptText += '      "texture": "film/grain/texture description",\n';
  promptText += '      "negative": "text, words, letters, typography, captions, subtitles, watermarks, signature, UI, HUD, overlays, garbled text, multiple subjects, clones, duplicates, split screen, character sheet, grid"\n';
  promptText += '    },\n';
  promptText += '    "imageNegative": "text, words, letters, typography, captions, subtitles, watermarks, signature, UI, HUD, overlays, garbled text, multiple subjects, clones, duplicates, split screen, character sheet, grid",\n';
  promptText += '    "continuityRules": ["rule1 that must always be true", "rule2"]\n';
  promptText += '  },\n';
  promptText += '  "beats": [\n';
  promptText += '    { "summary": "What happens in this beat (3-5 beats total)" },\n';
  promptText += '    { "summary": "The story pivots or escalates" },\n';
  promptText += '    { "summary": "Each beat becomes a scene or story moment" }\n';
  promptText += '  ],\n';
  promptText += '  "cast": [\n';
  promptText += '    {\n';
  promptText += '      "id": "c_character_name",\n';
  promptText += '      "name": "Character Name",\n';
  promptText += '      "age": "age descriptor like a late-30s woman",\n';
  promptText += '      "face": "face and features description",\n';
  promptText += '      "hair": "hair description",\n';
  promptText += '      "eyes": "eye color/description",\n';
  promptText += '      "wardrobe": "what they wear",\n';
  promptText += '      "signature": "a unique detail that identifies them",\n';
  promptText += '      "extra": "additional descriptors",\n';
  promptText += '      "referenceImages": [],\n';
  promptText += '      "doNotChange": ["fixed visual elements"],\n';
  promptText += '      "voice": { "age": "late 30s", "timbre": "voice quality", "pace": "speaking pace", "accent": "accent" }\n';
  promptText += '    }\n';
  promptText += '  ],\n';
  promptText += '  "scenes": [\n';
  promptText += '    {\n';
  promptText += '      "id": "sc01",\n';
  promptText += '      "title": "Scene Title",\n';
  promptText += '      "description": "What happens in this scene in a sentence or two.",\n';
  promptText += '      "defaults": {\n';
  promptText += '        "environment": "setting description",\n';
  promptText += '        "key": "key light description",\n';
  promptText += '        "fill": "fill light description",\n';
  promptText += '        "contrast": "high | low | medium",\n';
  promptText += '        "timeOfDay": "time of day",\n';
  promptText += '        "palette": "color palette for this scene",\n';
  promptText += '        "texture": "film texture",\n';
  promptText += '        "mood": "mood/atmosphere",\n';
  promptText += '        "ambience": "background sound description"\n';
  promptText += '      },\n';
  promptText += '      "shots": [\n';
  promptText += '        {\n';
  promptText += '          "id": "sc01_sh01",\n';
  promptText += '          "size": "wide | medium | close-up | extreme close-up | etc.",\n';
  promptText += '          "angle": "eye level | low angle | high angle | dutch angle | bird\'s eye | worm\'s eye | over the shoulder",\n';
  promptText += '          "lens": "35mm | 50mm | 85mm | 24mm | etc.",\n';
  promptText += '          "dof": "deep | medium | shallow | very shallow",\n';
  promptText += '          "move": "static | slow push-in | dolly-in | tracking | handheld | etc.",\n';
  promptText += '          "speed": "slowly | at medium speed | quickly",\n';
  promptText += '          "castId": "c_character_name",\n';
  promptText += '          "action": "what happens in this shot, described visually",\n';
  promptText += '          "durationSec": 8,\n';
  promptText += '          "dialogue": "exact spoken line or empty string",\n';
  promptText += '          "sfx": "sound effect description",\n';
  promptText += '          "negative": "shot-specific negative prompts or empty",\n';
  promptText += '          "targetImage": "sc01_sh01_still.png",\n';
  promptText += '          "mode": "frames_to_video",\n';
  promptText += '          "overrides": {},\n';
  promptText += '          "extraIngredients": []\n';
  promptText += '        }\n';
  promptText += '      ]\n';
  promptText += '    }\n';
  promptText += '  ],\n';
  promptText += '  "audio": {\n';
  promptText += '    "globalRules": {\n';
  promptText += '      "roomTone": "base ambient sound description",\n';
  promptText += '      "musicPolicy": "guidelines for music usage",\n';
  promptText += '      "loudnessTarget": "-14 LUFS",\n';
  promptText += '      "dialogueRule": "dialogue style guidelines"\n';
  promptText += '    },\n';
  promptText += '    "musicCues": [\n';
  promptText += '      { "sceneId": "sc01", "prompt": "detailed music generation prompt" }\n';
  promptText += '    ]\n';
  promptText += '  }\n';
  promptText += '}\n\n';
  promptText += '=== USER PROJECT DESCRIPTION ===\n\n';
  promptText += desc;
  promptText += '\n\n=== OUTPUT FORMAT ===\n\n';
  promptText += 'Return ONLY the JSON object. No markdown fences, no explanation text. Only a valid JSON object.\n';

  _starterPromptCache = promptText;

  var outputEl = document.getElementById("starterOutput");
  outputEl.style.display = "block";

  var subtabsEl = document.getElementById("starterSubtabs");
  subtabsEl.innerHTML = '';

  var contentEl = document.getElementById("starterContent");
  contentEl.innerHTML = '<pre class="artifact-pre" id="promptOutput">' + esc(promptText) + '</pre>';

  toast("Prompt generated — copy it to your AI chat");
}

document.getElementById("btnImportProject").addEventListener("click", function() {
  document.getElementById("modalBackdrop").classList.add("open");
  _resetModal();
});

document.getElementById("modalClose").addEventListener("click", function() {
  document.getElementById("modalBackdrop").classList.remove("open");
});

document.getElementById("modalBackdrop").addEventListener("click", function(e) {
  if (e.target === this) this.classList.remove("open");
});

/* Modal tab switching */
document.querySelectorAll(".modal-tab").forEach(function(tab) {
  tab.addEventListener("click", function() {
    document.querySelectorAll(".modal-tab").forEach(function(t) { t.classList.remove("active"); });
    document.querySelectorAll(".modal-panel").forEach(function(p) { p.classList.remove("active"); });
    tab.classList.add("active");
    document.getElementById(tab.dataset.panel).classList.add("active");
  });
});

/* Import from file (used by both button and modal) */
document.getElementById("fileImport").addEventListener("change", function(e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(ev) {
    try {
      var parsed = JSON.parse(ev.target.result);
      state = Object.assign(defaultState(), parsed);
      saveState();
      renderCurrentTab();
      toast("Project imported");
      document.getElementById("modalBackdrop").classList.remove("open");
    } catch(err) {
      toast("Invalid project file", true);
    }
  };
  reader.readAsText(file);
  e.target.value = "";
});

/* Import from textarea (inside modal) */
document.getElementById("btnImportFromText").addEventListener("click", function() {
  var input = document.getElementById("importJsonInput");
  var text = input.value.trim();
  if (!text) {
    toast("Paste your JSON into the text area first", true);
    return;
  }
  try {
    var parsed = JSON.parse(text);
    state = Object.assign(defaultState(), parsed);
    saveState();
    renderCurrentTab();
    toast("Project imported");
    input.value = "";
    document.getElementById("modalBackdrop").classList.remove("open");
  } catch(err) {
    toast("Invalid JSON — check for syntax errors", true);
  }
});

function _resetModal() {
  document.getElementById("importJsonInput").value = "";
  document.querySelector(".modal-tab.active").click();
}

/* =========================================================
   EXAMPLE PROJECT
   ========================================================= */
function exampleState() {
  return {
    meta: { schemaVersion: "1.0", projectId: "ep012_the_last_signal", title: "The Last Signal" },
    format: { platform: "youtube_short", aspectRatio: "9:16", targetDurationSec: 45, language: "en" },
    brief: {
      logline: "A lone signal analyst discovers the transmission she has been decoding for years is her own voice, sent backward through time.",
      genreTone: ["sci-fi", "melancholic", "quiet dread"],
      visualStyle: {
        palette: "muted teal, sodium amber accents, crushed blacks",
        lighting: "low-key practicals, cold monitor glow, hard rim from doorway",
        lens: "35mm anamorphic feel, shallow-to-medium depth of field",
        texture: "subtle 16mm grain, halation on highlights",
        negative: ""
      },
      imageNegative: "text, words, letters, typography, captions, subtitles, watermarks, signature, UI, HUD, overlays, garbled text, glossy plastic skin, multiple subjects, clones, duplicates, split screen, character sheet, grid",
      continuityRules: [
        "Mara's scar is always on the left cheek, camera-left when facing frame right.",
        "The console has exactly three red indicator lights; they never change count.",
        "Echo never blinks on screen."
      ]
    },
    beats: [
      { summary: "Mara alone at the console, routine decode." },
      { summary: "The waveform resolves into a human voice — hers." },
      { summary: "She replays it; the voice says her childhood nickname." },
      { summary: "She answers the transmission. Silence. Then the reply begins." }
    ],
    cast: [{
      id: "c_mara",
      name: "Mara",
      age: "a late-30s woman",
      face: "a sharp jaw, a thin scar on her left cheek",
      hair: "cropped black hair tucked behind one ear",
      eyes: "amber eyes",
      wardrobe: "a worn olive field jacket over a grey thermal",
      signature: "a small silver chain necklace",
      extra: "",
      customIdentityLock: "",
      referenceImages: ["mara_front.png", "mara_profile.png"],
      doNotChange: ["scar position", "jacket color", "hair length", "necklace"],
      voice: { age: "late 30s", timbre: "low, dry, slightly hoarse", pace: "measured, long pauses", accent: "neutral" }
    }],
    scenes: [
      {
        id: "s_1",
        title: "The Bunker",
        description: "Mara alone, decoding a signal she has been chasing for years.",
        defaults: {
          environment: "a cramped underground signal bunker, concrete walls, cable runs, a curved console with three red indicator lights, a single caged bulb overhead",
          key: "cold monitor glow from frame left",
          fill: "almost none; crushed shadow camera-right",
          contrast: "high",
          timeOfDay: "night, no windows",
          palette: "muted teal, sodium amber accents, crushed blacks",
          texture: "subtle 16mm grain, halation on highlights",
          mood: "quiet dread",
          ambience: "underground room tone, distant water drip on concrete"
        },
        shots: [
          {
            id: "sh_1", size: "wide", angle: "eye level", lens: "35mm", dof: "deep",
            move: "slow dolly-in", speed: "slowly",
            castId: "c_mara",
            action: "She exhales, reaches toward a dial, and pauses.",
            durationSec: 8, dialogue: "", sfx: "low console hum rises to a single soft chirp at the pause",
            negative: "on-screen text, UI overlays", targetImage: "sc01_sh01_still.png",
            mode: "frames_to_video", overrides: {}, extraIngredients: []
          },
          {
            id: "sh_2", size: "close-up", angle: "eye level", lens: "85mm", dof: "shallow",
            move: "static", speed: "",
            castId: "c_mara",
            action: "Her eyes widen; she leans in toward the monitor.",
            durationSec: 6, dialogue: "That's my voice.", sfx: "a thin electronic tone steady under her breath",
            negative: "", targetImage: "sc01_sh02_still.png",
            mode: "frames_to_video", overrides: {}, extraIngredients: []
          }
        ]
      },
      {
        id: "s_2",
        title: "The Reply",
        description: "She answers the transmission and the silence stretches.",
        defaults: {
          environment: "the same bunker, now darker, monitor glow lowered, cables in shadow",
          key: "faint amber glow from the console dial",
          fill: "almost none",
          contrast: "very high",
          timeOfDay: "deep night",
          palette: "desaturated teal, single amber accent",
          texture: "heavier 16mm grain",
          mood: "held breath",
          ambience: "silence with faint tape hiss, distant structural creak"
        },
        shots: [
          {
            id: "sh_3", size: "medium", angle: "over the shoulder", lens: "50mm", dof: "medium",
            move: "slow push-in", speed: "slowly",
            castId: "c_mara",
            action: "She presses a key and waits, shoulders tight.",
            durationSec: 8, dialogue: "", sfx: "single key click, then tape hiss",
            negative: "", targetImage: "sc02_sh01_still.png",
            mode: "frames_to_video", overrides: {}, extraIngredients: []
          }
        ]
      }
    ],
    audio: {
      globalRules: {
        roomTone: "underground concrete, low and dry, never silent",
        musicPolicy: "sparse analog drone; never under dialogue; no percussion",
        loudnessTarget: "-14 LUFS",
        dialogueRule: "whispered or dry, no reverb unless the room motivates it"
      },
      musicCues: [
        { sceneId: "sc01", prompt: "sparse analog synth drone, 60 BPM implied, no percussion, melancholic and static, sits low under dialogue, 45 seconds, no vocals" }
      ]
    }
  };
}

/* =========================================================
   INIT
   ========================================================= */
renderCurrentTab();
window.addEventListener("beforeunload", function() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e) {} });
