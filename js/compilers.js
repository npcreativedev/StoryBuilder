/* =========================================================
   COMPILERS — Identity locks, prompt builders, JSON exports
   ========================================================= */
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

function buildIdentityLock(c) {
  if (!c) return "";
  if (c.customIdentityLock && c.customIdentityLock.trim()) return c.customIdentityLock.trim();
  var bits = [];
  if (c.name) bits.push(c.name);
  var desc = "";
  if (c.age) desc += c.age;
  if (c.face) desc += (desc ? " with " : "") + c.face;
  if (desc) bits.push(desc);
  if (c.hair) bits.push(c.hair);
  if (c.eyes) bits.push(c.eyes);
  if (c.wardrobe) bits.push("wearing " + c.wardrobe);
  if (c.signature) bits.push("and " + c.signature);
  if (c.extra) bits.push(c.extra);
  return bits.join(", ");
}

function buildCharacterSheetPrompt(c) {
  var lock = buildIdentityLock(c);
  return "A character reference sheet of " + lock + ". Front view, side profile, and three-quarter view. Neutral expression, plain white background. High resolution, consistent lighting. Masterpiece.";
}

function resolveShotField(shot, scene, field) {
  var overrides = shot.overrides || {};
  if (overrides[field] != null && overrides[field] !== "") return overrides[field];
  if (scene.defaults && scene.defaults[field] != null) return scene.defaults[field];
  return "";
}

function buildImagePromptText(shot, scene) {
  var parts = [];
  var cine = [];
  if (shot.size) cine.push(shot.size);
  if (shot.angle) cine.push(shot.angle);
  if (shot.lens) cine.push(shot.lens);
  if (shot.dof) cine.push(shot.dof + " focus");
  if (cine.length) parts.push(cine.join(" ") + " shot.");

  var character = shot.castId ? state.cast.find(function(c) { return c.id === shot.castId; }) : null;
  var subject = "";
  if (character) {
    var lock = buildIdentityLock(character);
    subject += "Maintain the exact character design from the provided reference image <image1>. Generate a single, solitary " + lock + ". ";
  }
  if (shot.action) subject += shot.action;
  if (subject.trim()) parts.push(subject.trim().replace(/\.$/, "") + ".");

  var env = resolveShotField(shot, scene, "environment");
  if (env) parts.push(env.replace(/\.$/, "") + ".");

  var key = resolveShotField(shot, scene, "key");
  var fill = resolveShotField(shot, scene, "fill");
  var contrast = resolveShotField(shot, scene, "contrast");
  var tod = resolveShotField(shot, scene, "timeOfDay");
  var lightParts = [];
  if (key) lightParts.push(key);
  if (fill) lightParts.push(fill);
  if (contrast) lightParts.push(contrast + " contrast");
  if (tod) lightParts.push(tod);
  if (lightParts.length) parts.push(capitalize(lightParts.join(", ")) + ".");

  var palette = resolveShotField(shot, scene, "palette");
  var texture = resolveShotField(shot, scene, "texture");
  var mood = resolveShotField(shot, scene, "mood");
  var styleParts = [];
  if (palette) styleParts.push(palette);
  if (texture) styleParts.push(texture);
  if (mood) styleParts.push(mood);
  if (styleParts.length) parts.push(capitalize(styleParts.join(", ")) + ".");

  return parts.join(" ");
}

function buildVideoPromptText(shot, scene) {
  var parts = [];
  var cine = [];
  if (shot.size) cine.push(shot.size);
  if (shot.angle) cine.push(shot.angle);
  if (shot.lens) cine.push(shot.lens);
  if (shot.dof) cine.push(shot.dof + " focus");
  if (cine.length) parts.push(cine.join(" ") + " shot.");

  var character = shot.castId ? state.cast.find(function(c) { return c.id === shot.castId; }) : null;
  var subject = "";
  if (character) {
    var lock = buildIdentityLock(character);
    if (lock) subject += "A single, solitary " + lock + " ";
  }
  if (shot.action) subject += shot.action;
  if (subject.trim()) parts.push(subject.trim().replace(/\.$/, "") + ".");

  var env = resolveShotField(shot, scene, "environment");
  if (env) parts.push(env.replace(/\.$/, "") + ".");

  if (shot.move && shot.move !== "static") {
    var mv = shot.move;
    if (shot.speed) mv = mv + " " + shot.speed;
    parts.push(capitalize(mv) + ".");
  }

  var key = resolveShotField(shot, scene, "key");
  var fill = resolveShotField(shot, scene, "fill");
  var contrast = resolveShotField(shot, scene, "contrast");
  var tod = resolveShotField(shot, scene, "timeOfDay");
  var lightParts = [];
  if (key) lightParts.push(key);
  if (fill) lightParts.push(fill);
  if (contrast) lightParts.push(contrast + " contrast");
  if (tod) lightParts.push(tod);
  if (lightParts.length) parts.push(capitalize(lightParts.join(", ")) + ".");

  var palette = resolveShotField(shot, scene, "palette");
  var texture = resolveShotField(shot, scene, "texture");
  var mood = resolveShotField(shot, scene, "mood");
  var styleParts = [];
  if (palette) styleParts.push(palette);
  if (texture) styleParts.push(texture);
  if (mood) styleParts.push(mood);
  if (styleParts.length) parts.push(capitalize(styleParts.join(", ")) + ".");

  if (shot.sfx) parts.push("SFX: " + shot.sfx.replace(/\.$/, "") + ".");
  var amb = resolveShotField(shot, scene, "ambience");
  if (amb) parts.push("Ambient noise: " + amb.replace(/\.$/, "") + ".");

  if (shot.dialogue && shot.dialogue.trim()) {
    parts.push('Dialogue: "' + shot.dialogue.trim() + '"');
  } else {
    parts.push("No dialogue.");
  }

  return parts.join(" ");
}

function compileBrief() {
  return {
    schema_version: state.meta.schemaVersion,
    project_id: state.meta.projectId || null,
    title: state.meta.title || null,
    format: {
      platform: state.format.platform,
      aspect_ratio: state.format.aspectRatio,
      target_duration_sec: Number(state.format.targetDurationSec) || 0,
      language: state.format.language
    },
    logline: state.brief.logline,
    genre_tone: state.brief.genreTone,
    visual_style: state.brief.visualStyle,
    continuity_rules: state.brief.continuityRules,
    beats: state.beats.map(function(b, i) { return { beat_id: "b" + pad2(i + 1), summary: b.summary || "" }; }),
    output_targets: { images: "web_chat", video: "google_flow_veo" }
  };
}

function compileCast() {
  return {
    characters: state.cast.map(function(c) {
      return {
        id: c.id,
        name: c.name || "",
        identity_lock: buildIdentityLock(c),
        character_sheet_prompt: buildCharacterSheetPrompt(c),
        reference_images: c.referenceImages || [],
        do_not_change: c.doNotChange || [],
        voice: c.voice || {}
      };
    })
  };
}

function compileImages() {
  var images = [];
  state.scenes.forEach(function(scene, si) {
    scene.shots.forEach(function(shot, shi) {
      var sid = shotIdAt(si, shi);
      var iid = shot.targetImage || imageIdAt(si, shi);
      var character = shot.castId ? state.cast.find(function(c) { return c.id === shot.castId; }) : null;

      var negatives = [];
      if (state.brief.imageNegative) negatives.push(state.brief.imageNegative);
      if (shot.negative) negatives.push(shot.negative);

      images.push({
        image_id: iid,
        shot_id: sid,
        prompt_text: buildImagePromptText(shot, scene),
        negative_prompt: negatives.join(", "),
        render_instruction: "If a character is present, use the reference image <image1> for exact likeness. Generate a single subject. Do not add text, captions, UI, or watermarks.",
        subject: {
          cast_id: shot.castId || null,
          identity_lock: character ? buildIdentityLock(character) : "",
          expression: shot.expression || "",
          pose: shot.action || ""
        },
        environment: resolveShotField(shot, scene, "environment"),
        composition: {
          shot_size: shot.size || "",
          angle: shot.angle || "",
          lens: shot.lens || "",
          depth_of_field: shot.dof || ""
        },
        lighting: {
          key: resolveShotField(shot, scene, "key"),
          fill: resolveShotField(shot, scene, "fill"),
          time_of_day: resolveShotField(shot, scene, "timeOfDay"),
          contrast: resolveShotField(shot, scene, "contrast")
        },
        style: {
          palette: resolveShotField(shot, scene, "palette"),
          texture: resolveShotField(shot, scene, "texture"),
          reference: resolveShotField(shot, scene, "mood")
        },
        aspect_ratio: state.format.aspectRatio
      });
    });
  });
  return images;
}

function compileVideo() {
  var videos = [];
  state.scenes.forEach(function(scene, si) {
    scene.shots.forEach(function(shot, shi) {
      var sid = shotIdAt(si, shi);
      var iid = shot.targetImage || imageIdAt(si, shi);
      var character = shot.castId ? state.cast.find(function(c) { return c.id === shot.castId; }) : null;
      var ingredients = [];
      if (character) {
        ingredients.push({
          type: "character",
          id: character.id,
          media: (character.referenceImages && character.referenceImages[0]) || "",
          use: "preserve face, hair, wardrobe, and signature details exactly"
        });
      }
      (shot.extraIngredients || []).forEach(function(ing) {
        if (ing.media) ingredients.push({ type: ing.type || "reference", id: ing.id || "", media: ing.media, use: ing.use || "" });
      });
      videos.push({
        shot_id: sid,
        scene_id: sceneIdAt(si),
        mode: shot.mode || "frames_to_video",
        source_image_id: iid,
        start_frame: iid,
        end_frame: null,
        duration_sec: Number(shot.durationSec) || 8,
        aspect_ratio: state.format.aspectRatio,
        ingredients: ingredients,
        prompt_text: buildVideoPromptText(shot, scene),
        audio: {
          dialogue: shot.dialogue || "",
          sfx: shot.sfx || "",
          ambience: resolveShotField(shot, scene, "ambience"),
          music: "none"
        },
        continuity_notes: character ? (character.doNotChange || []).join("; ") : "",
        negative: shot.negative || ""
      });
    });
  });
  return videos;
}

function compileAudio() {
  var cues = [];
  state.scenes.forEach(function(scene, si) {
    scene.shots.forEach(function(shot, shi) {
      var sid = shotIdAt(si, shi);
      var dur = Number(shot.durationSec) || 8;
      if (shot.dialogue) {
        cues.push({ cue_id: sid + "_d", shot_id: sid, layer: "dialogue", start_sec: 0, duration_sec: dur, prompt: shot.dialogue, tool: "veo_native" });
      }
      if (shot.sfx) {
        cues.push({ cue_id: sid + "_s", shot_id: sid, layer: "sfx", start_sec: 0, duration_sec: dur, prompt: shot.sfx, tool: "veo_native" });
      }
      var amb = resolveShotField(shot, scene, "ambience");
      if (amb) {
        cues.push({ cue_id: sid + "_a", shot_id: sid, layer: "ambience", start_sec: 0, duration_sec: dur, prompt: amb, tool: "veo_native" });
      }
    });
  });
  state.audio.musicCues.forEach(function(mc, i) {
    cues.push({
      cue_id: "m" + pad2(i + 1),
      scope: "scene",
      scene_id: mc.sceneId || null,
      layer: "music",
      prompt: mc.prompt || "",
      tool: mc.tool || "suno"
    });
  });
  return {
    global_audio_rules: state.audio.globalRules,
    cues: cues
  };
}

function compileShotlist() {
  var totalDur = state.scenes.reduce(function(sum, s) { return sum + s.shots.reduce(function(ss, sh) { return ss + (Number(sh.durationSec) || 0); }, 0); }, 0);
  var md = "# " + (state.meta.title || "Untitled Project") + "\n\n";
  md += "**Project ID:** " + (state.meta.projectId || "—") + "\n\n";
  md += "**Logline:** " + (state.brief.logline || "—") + "\n\n";
  md += "**Format:** " + state.format.platform + " · " + state.format.aspectRatio + " · target " + state.format.targetDurationSec + "s · actual " + totalDur + "s · " + state.format.language + "\n\n";
  md += "---\n\n";
  state.scenes.forEach(function(scene, si) {
    md += "## " + sceneIdAt(si) + " — " + (scene.title || "Untitled Scene") + "\n\n";
    if (scene.description) md += scene.description + "\n\n";
    scene.shots.forEach(function(shot, shi) {
      var character = shot.castId ? state.cast.find(function(c) { return c.id === shot.castId; }) : null;
      md += "### " + shotIdAt(si, shi) + " · " + (shot.size || "medium") + " " + (shot.angle || "") + " · " + (shot.durationSec || 8) + "s\n\n";
      md += "- **Still file:** `" + (shot.targetImage || imageIdAt(si, shi)) + "`\n";
      if (character) md += "- **Subject:** " + (character.name || "Character") + "\n";
      if (shot.action) md += "- **Action:** " + shot.action + "\n";
      if (shot.dialogue) md += "- **Dialogue:** \"" + shot.dialogue + "\"\n";
      if (shot.sfx) md += "- **SFX:** " + shot.sfx + "\n";
      md += "\n---\n\n";
    });
  });
  return md;
}

function compileBundle() {
  return {
    schema_version: state.meta.schemaVersion,
    exported_at: new Date().toISOString(),
    brief: compileBrief(),
    cast: compileCast(),
    images: compileImages(),
    video: compileVideo(),
    audio: compileAudio()
  };
}
