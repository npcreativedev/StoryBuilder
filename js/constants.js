/* =========================================================
   CONSTANTS & OPTIONS
   ========================================================= */
var SHOT_SIZES = ["extreme wide","wide","medium wide","medium","medium close-up","close-up","extreme close-up"];
var ANGLES = ["eye level","low angle","high angle","dutch angle","bird's eye","worm's eye","over the shoulder"];
var MOVES = ["static","slow push-in","slow pull-out","dolly-in","dolly-out","pan left","pan right","tilt up","tilt down","tracking","handheld","crane up","crane down"];
var DOFS = ["deep","medium","shallow","very shallow"];
var LENSES = ["18mm","24mm","35mm","50mm","85mm","135mm"];
var SPEEDS = ["","slowly","at medium speed","quickly"];
var PLATFORMS = [
  {value:"youtube_short", label:"YouTube Shorts"},
  {value:"youtube_long", label:"YouTube Long-form"},
  {value:"instagram_reel", label:"Instagram Reel"},
  {value:"tiktok", label:"TikTok"}
];
var ASPECTS = ["9:16","16:9","1:1","4:5"];
var DEFAULT_IMAGE_NEGATIVE = "text, words, letters, typography, captions, subtitles, watermarks, signature, UI, HUD, overlays, garbled text, multiple subjects, clones, duplicates, split screen, character sheet, grid";
var STORAGE_KEY = "aivsb_state_v1";
var currentViewMode = "editor";

function defaultState() {
  return {
    meta: { schemaVersion: "1.0", projectId: "", title: "" },
    format: { platform: "youtube_short", aspectRatio: "9:16", targetDurationSec: 45, language: "en" },
    brief: {
      logline: "",
      genreTone: [],
      visualStyle: { palette: "", lighting: "", lens: "", texture: "", negative: "" },
      imageNegative: DEFAULT_IMAGE_NEGATIVE,
      continuityRules: []
    },
    beats: [],
    cast: [],
    scenes: [],
    audio: { globalRules: { roomTone: "", musicPolicy: "", loudnessTarget: "-14 LUFS", dialogueRule: "" }, musicCues: [] }
  };
}
