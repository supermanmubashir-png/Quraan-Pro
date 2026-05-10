// ===== GLOBAL STATE =====
let Quran = [];
let currentSurah = null;

let audio = new Audio();
let currentIndex = -1;

let loop = false;
let cont = true;

let reciter = "ar.alafasy";
let translation = "en.asad";

let showTranslation = true;
let tajweedOn = true;

let repeatCount = 1;
let repeatLeft = 1;
let pauseTime = 0;

let deferredPrompt;

// ===== PWA INSTALL =====
window.addEventListener("beforeinstallprompt", e=>{
 e.preventDefault();
 deferredPrompt = e;
});

function installApp(){
 if(deferredPrompt) deferredPrompt.prompt();
}

// ===== LOAD QURAN =====
async function loadQuran(){
 let res = await fetch("https://api.alquran.cloud/v1/quran/quran-uthmani");
 Quran = (await res.json()).data.surahs;
 renderSidebar(Quran);
}
loadQuran();

// ===== SIDEBAR =====
function renderSidebar(list){
 sidebar.innerHTML = list.map(s =>
  `<div onclick="openSurah(${s.number});toggleSidebar()">
   ${s.number}. ${s.englishName}
  </div>`
 ).join("");
}

function toggleSidebar(){
 sidebar.classList.toggle("active");
}

function searchSurah(q){
 q = q.toLowerCase();
 renderSidebar(Quran.filter(s =>
  s.englishName.toLowerCase().includes(q)
 ));
}

// ===== TAJWEED =====
function tajweed(text){
 if(!tajweedOn) return text;

 return text
  .replace(/[اوي]/g,'<span class="madd">$&</span>')
  .replace(/[قطبجد]/g,'<span class="qalqala">$&</span>')
  .replace(/ن/g,'<span class="noon">ن</span>')
  .replace(/م/g,'<span class="meem">م</span>');
}

// ===== OPEN SURAH =====
async function openSurah(n){
 currentSurah = Quran.find(s=>s.number===n);

 let t = await fetch(`https://api.alquran.cloud/v1/surah/${n}/${translation}`);
 let trans = (await t.json()).data.ayahs;

 let html = "";

 currentSurah.ayahs.forEach((a,i)=>{
  html += `
  <div class="ayah" id="a${i}">
   <div class="star" onclick="toggleStar(this,${n},${i})">⭐</div>

   <div>${i+1}</div>
   <div class="arabic">${tajweed(a.text)}</div>

   ${showTranslation ? `<div>${trans[i].text}</div>` : ""}

   <div class="controls">
    <button onclick="togglePlay(${i},this)">▶️</button>
    <button onclick="setLoop(${i})">🔁</button>
    <button onclick="setContinue(${i})">⏭</button>
   </div>
  </div>`;
 });

 content.innerHTML = html;
}

// ===== AUDIO =====
function togglePlay(i,btn){

 if(currentIndex === i && !audio.paused){
  audio.pause();
  btn.textContent = "▶️";
  return;
 }

 currentIndex = i;
 highlight(i);

 let globalAyah = currentSurah.ayahs[i].number;
 audio.src = `https://cdn.islamic.network/quran/audio/128/${reciter}/${globalAyah}.mp3`;

 audio.play().catch(()=>alert("Tap again"));

 // speed
 audio.playbackRate = document.getElementById("speed").value || 1;

 repeatLeft = repeatCount;

 document.querySelectorAll(".controls button:first-child").forEach(b=>{
  b.textContent = "▶️";
 });

 btn.textContent = "⏸";
}

function setLoop(i){
 loop = true;
 cont = false;
 togglePlay(i, document.querySelector(`#a${i} button`));
}

function setContinue(i){
 cont = true;
 loop = false;
 togglePlay(i, document.querySelector(`#a${i} button`));
}

audio.onended = async ()=>{
 if(loop){
  togglePlay(currentIndex, document.querySelector(`#a${currentIndex} button`));
 }
 else if(repeatLeft > 1){
  repeatLeft--;
  setTimeout(()=>togglePlay(currentIndex, document.querySelector(`#a${currentIndex} button`)), pauseTime*1000);
 }
 else if(cont){
  currentIndex++;
  if(currentIndex < currentSurah.ayahs.length){
   setTimeout(()=>togglePlay(currentIndex, document.querySelector(`#a${currentIndex} button`)), pauseTime*1000);
  }
 }
};
// your last function...

if ("serviceWorker" in navigator) {
 navigator.serviceWorker.register("service-worker.js");
}

// ===== HIGHLIGHT =====
function highlight(i){
 document.querySelectorAll(".ayah").forEach(e=>e.classList.remove("active"));
 let el = document.getElementById("a"+i);
 if(el){
  el.classList.add("active");
  el.scrollIntoView({behavior:"smooth", block:"center"});
 }
}

// ===== BOOKMARK =====
function toggleStar(el,s,i){
 el.classList.toggle("active");
 localStorage.setItem("bm", JSON.stringify({s,i}));
}

function resume(){
 let b = JSON.parse(localStorage.getItem("bm"));
 if(b){
  openSurah(b.s);
  setTimeout(()=>highlight(b.i),700);
 }
}

// ===== SETTINGS =====
document.getElementById("reciterSelect").onchange = e=>{
 reciter = e.target.value;
};

document.getElementById("translationSelect").onchange = e=>{
 translation = e.target.value;
 if(currentSurah) openSurah(currentSurah.number);
};

document.getElementById("toggleTranslation").onchange = e=>{
 showTranslation = e.target.checked;
 if(currentSurah) openSurah(currentSurah.number);
};

document.getElementById("tajweedToggle").onchange = e=>{
 tajweedOn = e.target.checked;
 if(currentSurah) openSurah(currentSurah.number);
};

document.getElementById("pause").oninput = e=>{
 pauseTime = e.target.value;
};

document.getElementById("repeat").oninput = e=>{
 repeatCount = e.target.value;
};

document.getElementById("fontSize").oninput = e=>{
 document.documentElement.style.setProperty("--arabicSize", e.target.value + "px");
};
function applyTheme(theme){
 document.body.classList.remove(
  "theme-dark",
  "theme-light",
  "theme-blue",
  "theme-green",
  "theme-purple",
  "theme-gold"
 );

 document.body.classList.add(theme);
 localStorage.setItem("theme", theme);
}

// change theme
document.getElementById("themeSelect").addEventListener("change", e=>{
 applyTheme(e.target.value);
});

// load saved theme
let savedTheme = localStorage.getItem("theme") || "theme-dark";
applyTheme(savedTheme);

// set dropdown value
window.onload = ()=>{
 document.getElementById("themeSelect").value = savedTheme;
};


// ===== PANELS =====
function openPanel(p){
 overlay.style.display = "block";
 p.style.display = "block";
}

function closePanels(){
 overlay.style.display = "none";
 document.querySelectorAll(".panel").forEach(p=>p.style.display="none");
}

function openSettings(){ openPanel(settings); }
function openGoto(){ openPanel(goto); }
function showLegend(){ openPanel(document.getElementById("legend")); }

// ===== GOTO =====
function goToAyah(){
 let s = parseInt(suraInput.value);
 let a = parseInt(ayahInput.value)-1;

 openSurah(s);
 setTimeout(()=>highlight(a),700);
}

// ===== NAMAZ =====
async function getNamaz(){
 let r = await fetch("https://api.aladhan.com/v1/timingsByCity?city=Delhi&country=India&method=1&school=1");
 let d = (await r.json()).data.timings;

 alert(`Fajr:${d.Fajr}
Dhuhr:${d.Dhuhr}
Asr:${d.Asr}
Maghrib:${d.Maghrib}
Isha:${d.Isha}`);
}

// ===== COMPASS =====
let qiblaAngle = 0;

function openCompass(){
 openPanel(compassPanel);
 startCompass();
}

function startCompass(){
 navigator.geolocation.getCurrentPosition(pos=>{
  let lat = pos.coords.latitude * Math.PI/180;
  let lon = pos.coords.longitude * Math.PI/180;

  let kaabaLat = 21.4225*Math.PI/180;
  let kaabaLon = 39.8262*Math.PI/180;

  let dLon = kaabaLon - lon;
  let y = Math.sin(dLon);
  let x = Math.cos(lat)*Math.tan(kaabaLat)-Math.sin(lat)*Math.cos(dLon);

  qiblaAngle = Math.atan2(y,x)*180/Math.PI;
 });

 window.addEventListener("deviceorientationabsolute", e=>{
  if(e.alpha != null){
   needle.style.transform = `rotate(${e.alpha - qiblaAngle}deg)`;
  }
 });
}

// ===== TAJWEED TOGGLE BUTTON =====
function toggleTajweed(){
 tajweedOn = !tajweedOn;
 if(currentSurah) openSurah(currentSurah.number);
}

// ===== INTRO TOGGLE FIX =====
document.addEventListener("DOMContentLoaded", () => {

  const introToggle = document.getElementById("introToggle");

  if (!introToggle) return;

  // Load saved value
  const saved = localStorage.getItem("introDisabled");
  introToggle.checked = saved === "true";

  // Save on change
  introToggle.addEventListener("change", () => {
    localStorage.setItem("introDisabled", introToggle.checked);
  });

});
