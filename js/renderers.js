/* =========================================================
   FIELD HELPERS
   ========================================================= */
function field(label, bind, value, placeholder, type) {
  return '<label>' + label +
    '<input type="' + (type || "text") + '" data-bind="' + bind + '" value="' + esc(value) + '" placeholder="' + esc(placeholder || "") + '">' +
    '</label>';
}
function textareaField(label, bind, value, placeholder, rows) {
  return '<label>' + label +
    '<textarea data-bind="' + bind + '" placeholder="' + esc(placeholder || "") + '" rows="' + (rows || 3) + '">' + esc(value) + '</textarea>' +
    '</label>';
}
function selectField(label, bind, value, options) {
  var opts = options.map(function(o) {
    var v = typeof o === "string" ? o : o.value;
    var l = typeof o === "string" ? (o || "—") : o.label;
    return '<option value="' + esc(v) + '"' + (v === value ? " selected" : "") + '>' + esc(l) + '</option>';
  }).join("");
  return '<label>' + label + '<select data-bind="' + bind + '">' + opts + '</select></label>';
}

/* =========================================================
   RENDERERS
   ========================================================= */
function renderFormat() {
  var panel = document.getElementById("panel-format");
  panel.innerHTML =
    '<div class="section">' +
      '<h2>Project Identity</h2>' +
      '<div class="grid-2">' +
        field("Project ID", "meta.projectId", state.meta.projectId, "ep012_the_last_signal") +
        field("Title", "meta.title", state.meta.title, "The Last Signal") +
      '</div>' +
    '</div>' +
    '<div class="section">' +
      '<h2>Output Format</h2>' +
      '<div class="grid-3">' +
        selectField("Platform", "format.platform", state.format.platform, PLATFORMS) +
        selectField("Aspect Ratio", "format.aspectRatio", state.format.aspectRatio, ASPECTS) +
        field("Target Duration (sec)", "format.targetDurationSec", state.format.targetDurationSec, "45", "number") +
        field("Language", "format.language", state.format.language, "en") +
      '</div>' +
    '</div>' +
    '<div class="section">' +
      '<h2>Global Visual Style</h2>' +
      '<div class="hint">These are defaults inherited by shots unless overridden.</div>' +
      '<div class="grid-2">' +
        field("Palette", "brief.visualStyle.palette", state.brief.visualStyle.palette, "muted teal, sodium amber accents, crushed blacks") +
        field("Lighting", "brief.visualStyle.lighting", state.brief.visualStyle.lighting, "low-key practicals, cold monitor glow") +
        field("Lens", "brief.visualStyle.lens", state.brief.visualStyle.lens, "35mm anamorphic feel") +
        field("Texture", "brief.visualStyle.texture", state.brief.visualStyle.texture, "subtle 16mm grain, halation on highlights") +
        '<div class="span-2">' + textareaField("Image Negative Prompt (crucial to prevent text and clones in image)", "brief.imageNegative", state.brief.imageNegative, "text, watermarks, UI, multiple subjects...", 2) + '</div>' +
      '</div>' +
    '</div>';
}

function renderStory() {
  var panel = document.getElementById("panel-story");

  var beatsHtml = "";
  if (state.beats.length === 0) {
    beatsHtml = '<div class="empty">No beats yet. Add one to outline the story.</div>';
  } else {
    beatsHtml = state.beats.map(function(b, i) {
      return '<div class="list-row">' +
        '<span class="badge" style="align-self:center">b' + pad2(i + 1) + '</span>' +
        '<input class="list-input" data-bind="beats.' + i + '.summary" value="' + esc(b.summary) + '" placeholder="What happens in this beat?">' +
        '<button class="btn-danger" data-action="del-beat" data-index="' + i + '">✕</button>' +
      '</div>';
    }).join("");
  }

  var rulesHtml = "";
  if (state.brief.continuityRules.length === 0) {
    rulesHtml = '<div class="empty">No continuity rules yet.</div>';
  } else {
    rulesHtml = state.brief.continuityRules.map(function(r, i) {
      return '<div class="list-row">' +
        '<input class="list-input" data-bind="brief.continuityRules.' + i + '" value="' + esc(r) + '" placeholder="e.g. Mara scar is always camera-left">' +
        '<button class="btn-danger" data-action="del-rule" data-index="' + i + '">✕</button>' +
      '</div>';
    }).join("");
  }

  var chips = state.brief.genreTone.map(function(g, i) {
    return '<span class="chip">' + esc(g) + '<button data-action="del-genre" data-index="' + i + '">✕</button></span>';
  }).join("");

  panel.innerHTML =
    '<div class="section">' +
      '<h2>Logline</h2>' +
      '<div class="hint">One sentence: the central dramatic question. This becomes the seed for the whole project.</div>' +
      textareaField("", "brief.logline", state.brief.logline, "A lone signal analyst discovers the transmission she has been decoding for years is her own voice, sent backward through time.", 2) +
    '</div>' +
    '<div class="section">' +
      '<h2>Genre &amp; Tone</h2>' +
      '<div class="hint">Type a tag and press Enter to add.</div>' +
      '<input id="genreInput" placeholder="sci-fi, melancholic, quiet dread...">' +
      '<div class="chip-list">' + chips + '</div>' +
    '</div>' +
    '<div class="section">' +
      '<h2>Beats</h2>' +
      '<div class="hint">A 3–5 beat outline. Each beat becomes a scene or a story pivot.</div>' +
      '<div id="beatsList">' + beatsHtml + '</div>' +
      '<button class="btn-add" data-action="add-beat">+ Add Beat</button>' +
    '</div>' +
    '<div class="section">' +
      '<h2>Continuity Rules</h2>' +
      '<div class="hint">Hard facts the AI must not violate. These flow into every prompt.</div>' +
      '<div id="rulesList">' + rulesHtml + '</div>' +
      '<button class="btn-add" data-action="add-rule">+ Add Rule</button>' +
    '</div>';
}

function renderCast() {
  var panel = document.getElementById("panel-cast");

  if (state.cast.length === 0) {
    panel.innerHTML =
      '<div class="section">' +
        '<div class="empty">No characters yet. Each character gets a guided identity lock that is injected verbatim into every prompt.</div>' +
        '<button class="btn-add" data-action="add-cast">+ Add Character</button>' +
      '</div>';
    return;
  }

  var cardsHtml = state.cast.map(function(c, ci) {
    var lockPreview = buildIdentityLock(c);
    var sheetPrompt = buildCharacterSheetPrompt(c);
    var refs = (c.referenceImages || []).join(", ");
    var doNotChange = (c.doNotChange || []).join(", ");
    return (
      '<div class="card">' +
        '<div class="card-head">' +
          '<span class="badge">' + esc(c.id) + '</span>' +
          '<input class="title-input" data-bind="cast.' + ci + '.name" value="' + esc(c.name) + '" placeholder="Character name">' +
          '<button class="btn-copy btn-sm" data-action="copy-sheet" data-ci="' + ci + '">Copy Sheet Prompt</button> ' +
          '<button class="btn-danger" data-action="del-cast" data-index="' + ci + '">Delete</button>' +
        '</div>' +
        '<div class="card-body">' +
          '<div class="grid-3">' +
            field("Age descriptor", "cast." + ci + ".age", c.age, "a late-30s woman") +
            field("Face &amp; features", "cast." + ci + ".face", c.face, "a sharp jaw, a thin scar on her left cheek") +
            field("Hair", "cast." + ci + ".hair", c.hair, "cropped black hair tucked behind one ear") +
          '</div>' +
          '<div class="grid-2">' +
            field("Eyes", "cast." + ci + ".eyes", c.eyes, "amber eyes") +
            field("Wardrobe", "cast." + ci + ".wardrobe", c.wardrobe, "a worn olive field jacket over a grey thermal") +
          '</div>' +
          '<div class="grid-2">' +
            field("Signature detail", "cast." + ci + ".signature", c.signature, "a small silver chain necklace") +
            field("Extra descriptors", "cast." + ci + ".extra", c.extra, "sleeve cuffs pushed up, watch on left wrist") +
          '</div>' +
          '<div class="grid-2">' +
            field("Reference image filenames (comma-separated)", "castRefs." + ci, refs, "mara_front.png, mara_profile.png") +
            field("Do-not-change list (comma-separated)", "castDoNot." + ci, doNotChange, "scar position, jacket color, hair length") +
          '</div>' +
          '<details><summary>Voice profile (optional)</summary>' +
            '<div class="grid-2" style="margin-top:8px">' +
              field("Voice age", "cast." + ci + ".voice.age", (c.voice || {}).age, "late 30s") +
              field("Timbre", "cast." + ci + ".voice.timbre", (c.voice || {}).timbre, "low, dry, slightly hoarse") +
              field("Pace", "cast." + ci + ".voice.pace", (c.voice || {}).pace, "measured, long pauses") +
              field("Accent", "cast." + ci + ".voice.accent", (c.voice || {}).accent, "neutral") +
            '</div>' +
          '</details>' +
          '<details><summary>Custom identity lock override (advanced)</summary>' +
            '<div style="margin-top:8px">' +
              textareaField("", "cast." + ci + ".customIdentityLock", c.customIdentityLock, "Leave empty to use the auto-derived lock below.", 3) +
            '</div>' +
          '</details>' +
          '<div class="info-box" style="margin:0">' +
            '<strong style="color:var(--text)">Derived identity lock:</strong><br>' +
            '<code style="color:var(--accent)">' + esc(lockPreview || "(empty — fill the fields above)") + '</code>' +
            '<br><br><strong style="color:var(--text)">Character Sheet Prompt:</strong><br>' +
            '<code style="color:var(--text-2)">' + esc(sheetPrompt) + '</code>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }).join("");

  panel.innerHTML = '<div class="section"><h2>Characters</h2>' + cardsHtml +
    '<button class="btn-add" data-action="add-cast">+ Add Character</button></div>';
}

function renderScenes() {
  var panel = document.getElementById("panel-scenes");

  if (state.scenes.length === 0) {
    panel.innerHTML =
      '<div class="section">' +
        '<div class="empty">No scenes yet. Add a scene, then add shots inside it.</div>' +
        '<button class="btn-add" data-action="add-scene">+ Add Scene</button>' +
      '</div>';
    return;
  }

  // View toggle HTML
  var viewToggleHtml =
    '<div class="view-toggle">' +
      '<button data-view="editor" class="' + (currentViewMode === 'editor' ? 'active' : '') + '">Detailed Editor</button>' +
      '<button data-view="storyboard" class="' + (currentViewMode === 'storyboard' ? 'active' : '') + '">Storyboard View</button>' +
    '</div>';

  var contentHtml = "";

  if (currentViewMode === "editor") {
    contentHtml = state.scenes.map(function(scene, si) {
      var shotCards = scene.shots.map(function(shot, shi) { return renderShotCard(scene, shot, si, shi); }).join("");
      var shotsSection = scene.shots.length === 0
        ? '<div class="empty" style="padding:16px">No shots in this scene yet.</div>'
        : shotCards;
      return (
        '<div class="card">' +
          '<div class="card-head">' +
            '<span class="badge">' + sceneIdAt(si) + '</span>' +
            '<input class="title-input" data-bind="scenes.' + si + '.title" value="' + esc(scene.title) + '" placeholder="Scene title">' +
            '<button class="btn-danger" data-action="del-scene" data-index="' + si + '">Delete Scene</button>' +
          '</div>' +
          '<div class="card-body">' +
            textareaField("Scene description", "scenes." + si + ".description", scene.description, "What happens in this scene, in a sentence or two.", 2) +
            '<details open><summary>Scene defaults (inherited by shots)</summary>' +
              '<div class="overrides" style="margin-top:8px">' +
                '<div class="grid-2">' +
                  field("Environment", "scenes." + si + ".defaults.environment", scene.defaults.environment, "a cramped underground signal bunker, concrete walls, cable runs") +
                  field("Key light", "scenes." + si + ".defaults.key", scene.defaults.key, "cold monitor glow from frame left") +
                '</div>' +
                '<div class="grid-4" style="margin-top:8px">' +
                  field("Fill", "scenes." + si + ".defaults.fill", scene.defaults.fill, "almost none") +
                  field("Contrast", "scenes." + si + ".defaults.contrast", scene.defaults.contrast, "high") +
                  field("Time of day", "scenes." + si + ".defaults.timeOfDay", scene.defaults.timeOfDay, "night, no windows") +
                  field("Palette", "scenes." + si + ".defaults.palette", scene.defaults.palette, "muted teal, amber accents") +
                '</div>' +
                '<div class="grid-3" style="margin-top:8px">' +
                  field("Texture", "scenes." + si + ".defaults.texture", scene.defaults.texture, "subtle 16mm grain") +
                  field("Mood", "scenes." + si + ".defaults.mood", scene.defaults.mood, "quiet dread") +
                  field("Ambience", "scenes." + si + ".defaults.ambience", scene.defaults.ambience, "underground room tone, distant water drip") +
                '</div>' +
              '</div>' +
            '</details>' +
            '<div style="margin-top:8px">' + shotsSection + '</div>' +
            '<button class="btn-add" data-action="add-shot" data-si="' + si + '">+ Add Shot to ' + sceneIdAt(si) + '</button>' +
          '</div>' +
        '</div>'
      );
    }).join("");
  } else {
    // Storyboard View
    contentHtml = '<div class="storyboard-grid">';
    state.scenes.forEach(function(scene, si) {
      scene.shots.forEach(function(shot, shi) {
        var targetImg = shot.targetImage || (imageIdAt(si, shi) + ".png");
        contentHtml +=
          '<div class="storyboard-card">' +
            '<div class="storyboard-image-placeholder">' +
              '<span style="font-size:12px; color:var(--text-3);">' + shot.size + ' · ' + shot.angle + '</span>' +
              '<span class="file-badge">📸 ' + esc(targetImg) + '</span>' +
            '</div>' +
            '<div class="storyboard-details">' +
              '<div class="storyboard-meta">' +
                '<span>' + shotIdAt(si, shi) + '</span>' +
                '<span>' + (shot.durationSec || 8) + 's</span>' +
              '</div>' +
              '<div class="storyboard-action">' + esc(shot.action || "No action defined.") + '</div>' +
              '<button class="btn-sm btn-copy" style="margin-top:8px;" data-action="copy-img-prompt" data-si="' + si + '" data-shi="' + shi + '">Copy Image Prompt</button>' +
            '</div>' +
          '</div>';
      });
    });
    contentHtml += '</div>';
  }

  panel.innerHTML = '<div class="section"><h2>Scenes &amp; Shots</h2>' + viewToggleHtml + contentHtml +
    '<button class="btn-add" data-action="add-scene">+ Add Scene</button></div>';
}

function renderShotCard(scene, shot, si, shi) {
  var sid = shotIdAt(si, shi);
  var iid = shot.targetImage || (imageIdAt(si, shi) + ".png");
  var path = "scenes." + si + ".shots." + shi;
  var castOptions = [{ value: "", label: "— no character —" }].concat(
    state.cast.map(function(c) { return { value: c.id, label: c.name || c.id }; })
  );
  var overrides = shot.overrides || {};
  var videoPreview = buildVideoPromptText(shot, scene);

  var imgNegatives = [];
  if (state.brief.imageNegative) imgNegatives.push(state.brief.imageNegative);
  if (shot.negative) imgNegatives.push(shot.negative);
  var imgNegStr = imgNegatives.join(", ");

  var extraIngs = (shot.extraIngredients || []).map(function(ing, ii) {
    return '<div class="list-row" style="margin-bottom:6px">' +
      '<input class="list-input" data-bind="' + path + '.extraIngredients.' + ii + '.media" value="' + esc(ing.media) + '" placeholder="filename.png">' +
      '<input class="list-input" data-bind="' + path + '.extraIngredients.' + ii + '.use" value="' + esc(ing.use) + '" placeholder="use">' +
      '<button class="btn-danger" data-action="del-ing" data-si="' + si + '" data-shi="' + shi + '" data-index="' + ii + '">✕</button>' +
    '</div>';
  }).join("");

  return (
    '<div class="card" style="background:var(--panel)">' +
      '<div class="card-head">' +
        '<span class="badge">' + sid + '</span>' +
        '<span class="badge" style="background:var(--success); color:white; font-family:ui-monospace,monospace;">' + iid + '</span>' +
        '<div style="flex:1"></div>' +
        '<button class="btn-copy btn-sm" data-action="copy-img-prompt" data-si="' + si + '" data-shi="' + shi + '">Copy Image Prompt</button> ' +
        '<button class="btn-copy btn-sm" data-action="copy-video-prompt" data-si="' + si + '" data-shi="' + shi + '">Copy Video Prompt</button> ' +
        '<button class="btn-danger" data-action="del-shot" data-si="' + si + '" data-shi="' + shi + '">Delete</button>' +
      '</div>' +
      '<div class="card-body">' +
        '<div class="grid-2">' +
          field("Target Image Filename (maps to video start frame)", path + ".targetImage", iid, "sc01_sh01_still.png") +
          field("Duration (sec)", path + ".durationSec", shot.durationSec, "8", "number") +
        '</div>' +
        '<div class="grid-4" style="align-items:end;">' +
          selectField("Shot size", path + ".size", shot.size, SHOT_SIZES) +
          selectField("Angle", path + ".angle", shot.angle, ANGLES) +
          selectField("Lens", path + ".lens", shot.lens, LENSES) +
          '<div style="padding-bottom:2px;">' +
            '<button class="btn-random btn-sm" data-action="randomize-angle" data-si="' + si + '" data-shi="' + shi + '" style="width:100%;">🎲 Randomize Angle</button>' +
          '</div>' +
        '</div>' +
        '<div class="grid-2">' +
          selectField("Camera move", path + ".move", shot.move, MOVES) +
          selectField("Move speed", path + ".speed", shot.speed, SPEEDS) +
        '</div>' +
        '<div class="grid-2">' +
          selectField("Depth of field", path + ".dof", shot.dof, DOFS) +
          selectField("Character", path + ".castId", shot.castId, castOptions) +
        '</div>' +
        textareaField("Action (what happens in this shot)", path + ".action", shot.action, "She exhales, reaches toward a dial, and pauses.", 2) +
        '<div class="grid-2">' +
          field("Dialogue (exact line, or empty)", path + ".dialogue", shot.dialogue, "That's my voice.") +
          field("SFX (diegetic sound tied to action)", path + ".sfx", shot.sfx, "low console hum, single soft chirp") +
        '</div>' +
        field("Shot-specific negative prompts", path + ".negative", shot.negative, "on-screen text, UI overlays") +
        '<details><summary>Override scene defaults</summary>' +
          '<div class="overrides" style="margin-top:8px">' +
            '<div class="grid-2">' +
              field("Environment", path + ".overrides.environment", overrides.environment, scene.defaults.environment) +
              field("Key light", path + ".overrides.key", overrides.key, scene.defaults.key) +
            '</div>' +
            '<div class="grid-4" style="margin-top:8px">' +
              field("Fill", path + ".overrides.fill", overrides.fill, scene.defaults.fill) +
              field("Contrast", path + ".overrides.contrast", overrides.contrast, scene.defaults.contrast) +
              field("Time of day", path + ".overrides.timeOfDay", overrides.timeOfDay, scene.defaults.timeOfDay) +
              field("Palette", path + ".overrides.palette", overrides.palette, scene.defaults.palette) +
            '</div>' +
            '<div class="grid-3" style="margin-top:8px">' +
              field("Texture", path + ".overrides.texture", overrides.texture, scene.defaults.texture) +
              field("Mood", path + ".overrides.mood", overrides.mood, scene.defaults.mood) +
              field("Ambience", path + ".overrides.ambience", overrides.ambience, scene.defaults.ambience) +
            '</div>' +
          '</div>' +
        '</details>' +
        '<details><summary>Extra ingredients (for Ingredients-to-Video)</summary>' +
          '<div style="margin-top:8px">' +
            extraIngs +
            '<button class="btn-add" data-action="add-ing" data-si="' + si + '" data-shi="' + shi + '">+ Add Ingredient</button>' +
          '</div>' +
        '</details>' +
        '<details><summary>Prompt Previews (Text + JSON)</summary>' +
          '<div class="prompt-block" style="margin-top:8px">' +
             '<div class="prompt-title">Image Prompt (Text) <button class="btn-copy btn-sm" data-action="copy-img-prompt" data-si="' + si + '" data-shi="' + shi + '">Copy</button></div>' +
             '<div class="prompt-text">' + esc(buildImagePromptText(shot, scene)) + '\n\nNegative: ' + esc(imgNegStr) + '</div>' +
          '</div>' +
          '<div class="prompt-block">' +
             '<div class="prompt-title">Video Prompt (Text) <button class="btn-copy btn-sm" data-action="copy-video-prompt" data-si="' + si + '" data-shi="' + shi + '">Copy</button></div>' +
             '<div class="prompt-text">' + esc(videoPreview) + '</div>' +
          '</div>' +
        '</details>' +
      '</div>' +
    '</div>'
  );
}

function renderAudio() {
  var panel = document.getElementById("panel-audio");

  var musicCuesHtml = state.audio.musicCues.length === 0
    ? '<div class="empty">No music cues yet.</div>'
    : state.audio.musicCues.map(function(mc, i) {
        var sceneOptions = state.scenes.map(function(s, si) { return sceneIdAt(si); }).join(", ");
        return (
          '<div class="list-row" style="align-items:flex-start">' +
            '<input class="list-input" data-bind="audio.musicCues.' + i + '.sceneId" value="' + esc(mc.sceneId) + '" placeholder="scene_id (' + sceneOptions + ')">' +
            '<textarea class="list-input" data-bind="audio.musicCues.' + i + '.prompt" rows="2" placeholder="sparse analog synth drone, 60 BPM implied, no percussion, melancholic, sits under dialogue, 45 seconds, no vocals">' + esc(mc.prompt) + '</textarea>' +
            '<button class="btn-danger" data-action="del-music" data-index="' + i + '">✕</button>' +
          '</div>'
        );
      }).join("");

  panel.innerHTML =
    '<div class="section">' +
      '<h2>Global Audio Rules</h2>' +
      '<div class="grid-2">' +
        field("Room tone / base ambience", "audio.globalRules.roomTone", state.audio.globalRules.roomTone, "underground concrete, low and dry") +
        field("Music policy", "audio.globalRules.musicPolicy", state.audio.globalRules.musicPolicy, "sparse analog drone; never under dialogue") +
        field("Loudness target", "audio.globalRules.loudnessTarget", state.audio.globalRules.loudnessTarget, "-14 LUFS") +
        field("Dialogue rule", "audio.globalRules.dialogueRule", state.audio.globalRules.dialogueRule, "whispered or dry, no reverb unless the room motivates it") +
      '</div>' +
    '</div>' +
    '<div class="section">' +
      '<h2>Music Cues (external — Suno/Udio)</h2>' +
      '<div class="hint">Scene-scoped music prompts. For per-shot SFX, ambience, and dialogue, edit those in the Scenes tab — they flow into audio.json automatically.</div>' +
      musicCuesHtml +
      '<button class="btn-add" data-action="add-music">+ Add Music Cue</button>' +
    '</div>' +
    '<div class="section">' +
      '<h2>Auto-derived audio (read-only)</h2>' +
      '<div class="hint">SFX, ambience, and dialogue from each shot are pulled into audio.json and into video prompts automatically. Edit them in the Scenes tab.</div>' +
      '<details><summary>Show auto-derived cue list (' + compileAudio().cues.filter(function(c) { return c.tool === "veo_native"; }).length + ' cues)</summary>' +
        '<pre>' + esc(JSON.stringify(compileAudio().cues.filter(function(c) { return c.tool === "veo_native"; }), null, 2)) + '</pre>' +
      '</details>' +
    '</div>';
}

function renderExport() {
  var panel = document.getElementById("panel-export");
  var issues = validate();
  var errors = issues.filter(function(i) { return i.level === "error"; }).length;
  var warnings = issues.filter(function(i) { return i.level === "warning"; }).length;
  var passes = issues.filter(function(i) { return i.level === "pass"; }).length;

  var preflightHtml = issues.map(function(i) {
    return '<div class="preflight-item ' + i.level + '">' +
      '<span class="icon">' + (i.level === "error" ? "✕" : i.level === "warning" ? "!" : "✓") + '</span>' +
      '<span>' + esc(i.msg) + '</span>' +
    '</div>';
  }).join("");

  var castArray = compileCast().characters;
  var imagesArray = compileImages();
  var videoArray = compileVideo();

  var charactersText = "";
  castArray.forEach(function(c) {
    charactersText += "=== " + c.id + " (" + c.name + ") ===\n";
    charactersText += "PROMPT: " + c.character_sheet_prompt + "\n\n";
  });

  var imagesText = "";
  imagesArray.forEach(function(img) {
    imagesText += "=== " + img.image_id + " ===\n";
    imagesText += "PROMPT: " + img.prompt_text + "\n";
    imagesText += "NEGATIVE: " + img.negative_prompt + "\n\n";
  });

  var videoText = "";
  videoArray.forEach(function(vid) {
    videoText += "=== " + vid.shot_id + " ===\n";
    videoText += "START FRAME: " + vid.start_frame + "\n";
    videoText += "PROMPT: " + vid.prompt_text + "\n\n";
  });

  var artifacts = {
    characters_text: { label: "Step 1: Character Sheets", content: charactersText },
    images_text: { label: "Step 2: Scene Stills", content: imagesText },
    video_text: { label: "Step 3: Video", content: videoText },
    images_json: { label: "images.json", content: JSON.stringify(imagesArray, null, 2) },
    video_json: { label: "video.json", content: JSON.stringify(videoArray, null, 2) },
    brief: { label: "brief.json", content: JSON.stringify(compileBrief(), null, 2) },
    cast: { label: "cast.json", content: JSON.stringify(compileCast(), null, 2) },
    audio: { label: "audio.json", content: JSON.stringify(compileAudio(), null, 2) },
    shotlist: { label: "shotlist.md", content: compileShotlist() },
    bundle: { label: "project_bundle.json", content: JSON.stringify(compileBundle(), null, 2) }
  };

  var subtabsHtml = Object.keys(artifacts).map(function(k) {
    return '<button data-subtab="' + k + '" class="' + (k === currentSubtab ? "active" : "") + '">' + artifacts[k].label + '</button>';
  }).join("");

  var current = artifacts[currentSubtab] || artifacts.characters_text;
  var isBlocked = errors > 0;

  var contentHtml = '';
  if (currentSubtab === "characters_text") {
    contentHtml = castArray.map(function(c) {
      return '<div class="prompt-block">' +
        '<div class="prompt-title">' + c.id + " (" + c.name + ") <button class=\"btn-copy btn-sm\" data-action=\"copy-single\" data-text=\"" + esc(c.character_sheet_prompt) + "\">Copy</button></div>" +
        '<div class="prompt-text">' + esc(c.character_sheet_prompt) + '</div>' +
      '</div>';
    }).join("");
  } else if (currentSubtab === "images_text") {
    contentHtml = imagesArray.map(function(img) {
      return '<div class="prompt-block">' +
        '<div class="prompt-title">' + img.image_id + ' <button class="btn-copy btn-sm" data-action="copy-single" data-text="' + esc(img.prompt_text + '\n\nNegative: ' + img.negative_prompt) + '">Copy</button></div>' +
        '<div class="prompt-text">' + esc(img.prompt_text) + '<br><br><strong style="color:var(--danger)">Negative:</strong> ' + esc(img.negative_prompt) + '</div>' +
      '</div>';
    }).join("");
  } else if (currentSubtab === "video_text") {
    contentHtml = videoArray.map(function(vid) {
      return '<div class="prompt-block">' +
        '<div class="prompt-title">' + vid.shot_id + ' <button class="btn-copy btn-sm" data-action="copy-single" data-text="' + esc(vid.prompt_text) + '">Copy</button></div>' +
        '<div class="prompt-text"><strong style="color:var(--success)">Start Frame:</strong> ' + esc(vid.start_frame) + '<br><br>' + esc(vid.prompt_text) + '</div>' +
      '</div>';
    }).join("");
  } else {
    contentHtml = '<pre class="artifact-pre" id="artifactContent">' + esc(current.content) + '</pre>';
  }

  panel.innerHTML =
    '<div class="section">' +
      '<h2>Preflight</h2>' +
      '<div class="preflight-summary">' +
        '<span class="e">' + errors + ' errors</span>' +
        '<span class="w">' + warnings + ' warnings</span>' +
        '<span class="p">' + passes + ' passed</span>' +
      '</div>' +
      '<div class="preflight">' + preflightHtml + '</div>' +
    '</div>' +
    '<div class="section">' +
      '<h2>Artifacts (Follow the order)</h2>' +
      (isBlocked ? '<div class="info-box" style="background:rgba(255,107,107,0.1);border-left-color:var(--danger);color:var(--danger)">Fix blocking errors above before copying artifacts. You can still preview them.</div>' : '') +
      '<div class="subtabs">' + subtabsHtml + '</div>' +
      '<div class="artifact-header">' +
        '<h3>' + current.label + '</h3>' +
        (currentSubtab.includes('json') || currentSubtab === 'shotlist' || currentSubtab === 'bundle'
          ? '<div style="display:flex;gap:6px">' +
              '<button class="btn btn-sm" data-action="copy-artifact">Copy All</button>' +
              '<button class="btn btn-sm" data-action="download-artifact">Download</button>' +
            '</div>'
          : '') +
      '</div>' +
      contentHtml +
    '</div>';
}
