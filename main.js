// Shared playback state is kept global so every algorithm runner can honor it.
const state = {
  isPlaying: false,
  isPaused: false,
  step: 0,
  speed: 1,
  runId: 0,
};

const algorithms = {
  bubble: { title: "Bubble Sort", time: "O(n²)", space: "O(1)", file: "bubble_sort.js", hint: "Compare adjacent values and swap them when they are out of order.", code: "for each pair (a, b)\n  if a > b\n    swap(a, b)", type: "sort" },
  merge: { title: "Merge Sort", time: "O(n log n)", space: "O(n)", file: "merge_sort.js", hint: "Split the list, sort each half, then merge the ordered pieces.", code: "split array in half\nsort both halves\nmerge in order", type: "sort" },
  binary: { title: "Binary Search", time: "O(log n)", space: "O(1)", file: "binary_search.js", hint: "Eliminate half of the remaining sorted values on every comparison.", code: "while low ≤ high\n  check midpoint\n  keep one half", type: "search" },
  bfs: { title: "Breadth-First Search", time: "O(V + E)", space: "O(V)", file: "breadth_first.js", hint: "Visit every neighbor at the current depth before going deeper.", code: "queue start node\nwhile queue exists\n  visit its neighbors", type: "graph" },
  dfs: { title: "Depth-First Search", time: "O(V + E)", space: "O(V)", file: "depth_first.js", hint: "Follow each branch as far as possible before backtracking.", code: "visit node\nfor each neighbor\n  explore neighbor", type: "graph" },
};

const values = [42, 78, 31, 65, 18, 54, 89, 36, 72, 25];
const $ = (selector) => document.querySelector(selector);
const waitForResume = () => new Promise((resolve) => {
  const timer = setInterval(() => { if (!state.isPaused || !state.isPlaying) { clearInterval(timer); resolve(); } }, 50);
});

// Reusable delay: it pauses its countdown while the visualizer is paused.
async function sleep(ms) {
  let remaining = ms / state.speed;
  while (remaining > 0 && state.isPlaying) {
    if (state.isPaused) { await waitForResume(); continue; }
    const slice = Math.min(remaining, 40);
    await new Promise((resolve) => setTimeout(resolve, slice));
    if (!state.isPaused) remaining -= slice;
  }
}

function updateControls() {
  $("#playButton").disabled = state.isPlaying && !state.isPaused;
  $("#pauseButton").disabled = !state.isPlaying;
  $("#pauseButton").innerHTML = state.isPaused ? "<span aria-hidden=\"true\">▶</span> Resume" : "<span aria-hidden=\"true\">⏸</span> Pause";
  $("#statusText").textContent = state.isPaused ? "Paused" : state.isPlaying ? "Visualizing" : "Ready to explore";
}

function setStep(step, total) { state.step = step; $("#stepCount").textContent = String(step).padStart(2, "0"); $("#totalSteps").textContent = String(total).padStart(2, "0"); }
function setLegend(items) { $("#legend").innerHTML = items.map(([color, label]) => `<span class="legend-item"><i class="legend-swatch" style="background:${color}"></i>${label}</span>`).join(""); }

function renderSort() {
  $("#sortBars").innerHTML = values.map((value, index) => `<div class="bar-wrap"><div class="bar" data-index="${index}" style="height:${value * 2.3}px"></div><span class="bar-label">${value}</span></div>`).join("");
  setLegend([["#bac0d3", "Unsorted"], ["#f5a25a", "Comparing"], ["#725cf6", "In position"]]);
}
function renderSearch() {
  const searchValues = [3, 8, 14, 21, 27, 36, 44, 52, 61];
  $("#searchRow").innerHTML = searchValues.map((value, index) => `<div class="search-item" data-index="${index}">${value}</div>`).join("");
  setLegend([["#cfd5e3", "Available"], ["#f5a25a", "Checking"], ["#725cf6", "Found"]]);
}
function renderGraph() {
  const positions = [[8, 44], [39, 9], [72, 42], [17, 82], [54, 83], [86, 78]];
  const links = [[0,1],[0,3],[1,2],[1,4],[2,5],[3,4],[4,5]];
  $("#graph").innerHTML = links.map(([a,b]) => { const [x1,y1] = positions[a], [x2,y2] = positions[b]; const dx=x2-x1, dy=y2-y1, length=Math.hypot(dx,dy); return `<i class="edge" style="left:${x1}%;top:${y1}%;width:${length}%;transform:rotate(${Math.atan2(dy,dx)}rad)"></i>`; }).join("") + positions.map(([x,y], i) => `<div class="node" data-index="${i}" style="left:calc(${x}% - 21px);top:calc(${y}% - 21px)">${String.fromCharCode(65+i)}</div>`).join("");
  setLegend([["#cbd2e1", "Unvisited"], ["#f5a25a", "Current"], ["#725cf6", "Visited"]]);
}

function renderAlgorithm() {
  const algorithm = algorithms[$("#algorithmSelect").value];
  $("#algorithmTitle").textContent = algorithm.title; $("#timeComplexity").textContent = algorithm.time; $("#spaceComplexity").textContent = algorithm.space; $("#codeLabel").textContent = algorithm.file; $("#codeSnippet").textContent = algorithm.code; $("#hintText").textContent = algorithm.hint;
  $("#sortBars").classList.toggle("hidden", algorithm.type !== "sort"); $("#searchRow").classList.toggle("hidden", algorithm.type !== "search"); $("#graph").classList.toggle("hidden", algorithm.type !== "graph");
  if (algorithm.type === "sort") renderSort(); else if (algorithm.type === "search") renderSearch(); else renderGraph();
  setStep(0, algorithm.type === "graph" ? 6 : algorithm.type === "search" ? 4 : 10);
}

async function play() {
  const run = ++state.runId; state.isPlaying = true; state.isPaused = false; updateControls();
  const type = algorithms[$("#algorithmSelect").value].type;
  const elements = [...document.querySelectorAll(type === "sort" ? ".bar" : type === "search" ? ".search-item" : ".node")];
  const order = type === "search" ? [4, 6, 5] : type === "graph" ? ($("#algorithmSelect").value === "bfs" ? [0,1,3,2,4,5] : [0,1,2,5,4,3]) : elements.map((_, i) => i);
  for (let index = 0; index < order.length && state.isPlaying && run === state.runId; index += 1) {
    const item = elements[order[index]]; item.classList.add("active", "comparing"); setStep(index + 1, order.length); await sleep(580); item.classList.remove("active", "comparing");
    item.classList.add(type === "search" ? (index < order.length - 1 ? "discarded" : "found") : type === "graph" ? "visited" : "sorted");
  }
  if (run === state.runId) { state.isPlaying = false; state.isPaused = false; updateControls(); $("#statusText").textContent = "Run complete"; }
}
function reset() { state.runId += 1; state.isPlaying = false; state.isPaused = false; renderAlgorithm(); updateControls(); }

$("#playButton").addEventListener("click", play);
$("#pauseButton").addEventListener("click", () => { state.isPaused = !state.isPaused; updateControls(); });
$("#resetButton").addEventListener("click", reset);
$("#algorithmSelect").addEventListener("change", reset);
$("#speedRange").addEventListener("input", (event) => { state.speed = Number(event.target.value); $("#speedLabel").textContent = `${state.speed}×`; });

renderAlgorithm();
updateControls();
