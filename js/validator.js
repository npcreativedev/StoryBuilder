/* =========================================================
   VALIDATOR — Preflight checks
   ========================================================= */
function validate() {
  var issues = [];
  if (!state.brief.logline || !state.brief.logline.trim()) {
    issues.push({ level: "error", msg: "Logline is empty. Fill it in the Story tab." });
  }
  if (state.scenes.length === 0) {
    issues.push({ level: "error", msg: "No scenes defined. Add at least one scene in the Scenes tab." });
  }
  state.scenes.forEach(function(scene, si) {
    if (scene.shots.length === 0) {
      issues.push({ level: "warning", msg: sceneIdAt(si) + " has no shots." });
    }
    scene.shots.forEach(function(shot, shi) {
      var sid = shotIdAt(si, shi);
      var char = shot.castId ? state.cast.find(function(c) { return c.id === shot.castId; }) : null;
      if (shot.castId && !char) {
        issues.push({ level: "error", msg: sid + " references a character that no longer exists." });
      }
      if (char && !buildIdentityLock(char).trim()) {
        issues.push({ level: "error", msg: "Character \"" + (char.name || char.id) + "\" has an empty identity lock." });
      }
      var dur = Number(shot.durationSec) || 0;
      if (dur === 0) issues.push({ level: "warning", msg: sid + " has no duration set." });
      if (dur > 15) issues.push({ level: "warning", msg: sid + " is " + dur + "s — video models default to ~8s-10s. Consider splitting." });
      if (!shot.action || !shot.action.trim()) {
        issues.push({ level: "warning", msg: sid + " has no action description." });
      }
    });
  });
  var totalDur = state.scenes.reduce(function(sum, s) { return sum + s.shots.reduce(function(ss, sh) { return ss + (Number(sh.durationSec) || 0); }, 0); }, 0);
  var target = Number(state.format.targetDurationSec) || 0;
  if (target > 0 && totalDur > target * 1.2) {
    issues.push({ level: "warning", msg: "Total shot duration (" + totalDur + "s) exceeds target (" + target + "s) by more than 20%." });
  }
  if (state.cast.length === 0) {
    issues.push({ level: "warning", msg: "No characters defined. Shots can still run as environment-only." });
  }
  if (issues.length === 0) {
    issues.push({ level: "pass", msg: "All checks passed. Artifacts are ready to copy." });
  }
  return issues;
}
