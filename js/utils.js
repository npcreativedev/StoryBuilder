/* =========================================================
   UTILITIES
   ========================================================= */
function esc(s) {
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, function(ch) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[ch]; });
}

function toast(msg, isError) {
  var el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.toggle("error", !!isError);
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(function() { el.classList.remove("show"); }, 2200);
}

function copyText(text, label) {
  try {
    navigator.clipboard.writeText(text).then(function() {
      toast((label || "Copied") + " to clipboard");
    });
  } catch(e) {
    var ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      toast((label || "Copied") + " to clipboard");
    } catch(e2) {
      toast("Copy failed — select and copy manually", true);
    }
    document.body.removeChild(ta);
  }
}

function download(filename, text) {
  var blob = new Blob([text], { type: "text/plain" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function() { URL.revokeObjectURL(url); }, 500);
}
