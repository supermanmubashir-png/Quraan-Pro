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

// ===== SETTINGS PANEL OPEN/CLOSE =====
function openSettings(){
 document.getElementById("settingsPanel").style.display = "block";
 document.getElementById("overlay").style.display = "block";
}

function closeSettings(){
 document.getElementById("settingsPanel").style.display = "none";
 document.getElementById("overlay").style.display = "none";
}
// ===== SETTINGS PRO MAX (FULL + SAFE) =====

document.addEventListener("DOMContentLoaded", ()=>{

// ===== RECITER =====
let reciterEl = document.getElementById("reciterSelect");
if(reciterEl){
 reciterEl.value = localStorage.getItem("reciter") || reciter;
 reciterEl.onchange = e=>{
  reciter = e.target.value;
  localStorage.setItem("reciter", reciter);
 };
}

// ===== TRANSLATION =====
let translationEl = document.getElementById("translationSelect");
if(translationEl){
 translationEl.value = localStorage.getItem("translation") || translation;
 translationEl.onchange = e=>{
  translation = e.target.value;
  localStorage.setItem("translation", translation);
  if(currentSurah) openSurah(currentSurah.number);
 };
}

// ===== SHOW TRANSLATION =====
let toggleTransEl = document.getElementById("toggleTranslation") || document.getElementById("showTrans");
if(toggleTransEl){
 let val = localStorage.getItem("showTrans") !== "false";
 toggleTransEl.checked = val;
 showTranslation = val;

 toggleTransEl.onchange = e=>{
  showTranslation = e.target.checked;
  localStorage.setItem("showTrans", showTranslation);
  if(currentSurah) openSurah(currentSurah.number);
 };
}

// ===== TAJWEED =====
let tajweedEl = document.getElementById("tajweedToggle");
if(tajweedEl){
 let val = localStorage.getItem("tajweed") !== "false";
 tajweedEl.checked = val;
 tajweedOn = val;

 tajweedEl.onchange = e=>{
  tajweedOn = e.target.checked;
  localStorage.setItem("tajweed", tajweedOn);
  if(currentSurah) openSurah(currentSurah.number);
 };
}

// ===== AUDIO SPEED =====
let speedEl = document.getElementById("speedSelect");
if(speedEl){
 speedEl.value = localStorage.getItem("speed") || 1;

 speedEl.onchange = e=>{
  localStorage.setItem("speed", e.target.value);
 };
}

// ===== AUTO NEXT =====
let autoNextEl = document.getElementById("autoNext");
if(autoNextEl){
 let val = localStorage.getItem("autoNext") === "true";
 autoNextEl.checked = val;
 cont = val;

 autoNextEl.onchange = e=>{
  cont = e.target.checked;
  localStorage.setItem("autoNext", cont);
 };
}

// ===== LOOP COUNT =====
let loopEl = document.getElementById("loopCount") || document.getElementById("repeat");
if(loopEl){
 let val = localStorage.getItem("loopCount") || repeatCount;
 loopEl.value = val;
 repeatCount = val;

 loopEl.oninput = e=>{
  repeatCount = e.target.value;
  localStorage.setItem("loopCount", repeatCount);
 };
}

// ===== PAUSE TIME =====
let pauseEl = document.getElementById("pause");
if(pauseEl){
 pauseEl.value = localStorage.getItem("pause") || pauseTime;

 pauseEl.oninput = e=>{
  pauseTime = e.target.value;
  localStorage.setItem("pause", pauseTime);
 };
}

// ===== FONT SIZE =====
let fontEl = document.getElementById("arabicSize") || document.getElementById("fontSize");
if(fontEl){
 let size = localStorage.getItem("arabicSize") || 26;
 fontEl.value = size;
 document.documentElement.style.setProperty("--arabicSize", size+"px");

 fontEl.oninput = e=>{
  let val = e.target.value;
  document.documentElement.style.setProperty("--arabicSize", val+"px");
  localStorage.setItem("arabicSize", val);
 };
}

// ===== THEME =====
let themeEl = document.getElementById("themeSelect");
if(themeEl){
 let theme = localStorage.getItem("theme") || "theme-dark";
 themeEl.value = theme;
 if(typeof applyTheme === "function") applyTheme(theme);

 themeEl.onchange = e=>{
  let val = e.target.value;
  localStorage.setItem("theme", val);
  if(typeof applyTheme === "function") applyTheme(val);
 };
}

// ===== AUTO SAVE LAST READ =====
let autoSaveEl = document.getElementById("autoSave");
if(autoSaveEl){
 let val = localStorage.getItem("autoSave") === "true";
 autoSaveEl.checked = val;

 autoSaveEl.onchange = e=>{
  localStorage.setItem("autoSave", e.target.checked);
 };
}

});

// ===== RESET SETTINGS =====
function resetSettings(){
 localStorage.clear();
 location.reload();
}
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

// ===== SETTINGS PRO MAX =====

// TAB SYSTEM
function openTab(id){
 document.querySelectorAll(".tab").forEach(t=>t.style.display="none");
 let tab = document.getElementById(id);
 if(tab) tab.style.display = "block";
}

// DEFAULT TAB OPEN
setTimeout(()=>{
 if(document.getElementById("audioTab")){
  openTab("audioTab");
 }
},200);


// ===== SAVE + LOAD SETTINGS =====

// LOAD
window.addEventListener("load", ()=>{

 // speed
 let sp = localStorage.getItem("speed") || 1;
 let speedEl = document.getElementById("speedSelect");
 if(speedEl) speedEl.value = sp;

 // auto next
 let autoNext = localStorage.getItem("autoNext") === "true";
 let autoNextEl = document.getElementById("autoNext");
 if(autoNextEl) autoNextEl.checked = autoNext;

 // loop count
 let loopVal = localStorage.getItem("loopCount") || 1;
 let loopEl = document.getElementById("loopCount");
 if(loopEl) loopEl.value = loopVal;
 repeatCount = loopVal;

 // font size
 let size = localStorage.getItem("arabicSize") || 26;
 document.documentElement.style.setProperty("--arabicSize", size+"px");
 let sizeEl = document.getElementById("arabicSize");
 if(sizeEl) sizeEl.value = size;

 // translation
 let trans = localStorage.getItem("showTrans") !== "false";
 let transEl = document.getElementById("showTrans");
 if(transEl) transEl.checked = trans;
 showTranslation = trans;

 // tajweed
 let tj = localStorage.getItem("tajweed") !== "false";
 let tjEl = document.getElementById("tajweedToggle");
 if(tjEl) tjEl.checked = tj;
 tajweedOn = tj;

 // theme
 let theme = localStorage.getItem("theme") || "theme-dark";
 if(typeof applyTheme === "function") applyTheme(theme);
 let themeEl = document.getElementById("themeSelect");
 if(themeEl) themeEl.value = theme;

});


// ===== LIVE SAVE =====

// SPEED
let speedSelect = document.getElementById("speedSelect");
if(speedSelect){
 speedSelect.onchange = e=>{
  localStorage.setItem("speed", e.target.value);
 };
}

// AUTO NEXT
let autoNextEl = document.getElementById("autoNext");
if(autoNextEl){
 autoNextEl.onchange = e=>{
  cont = e.target.checked;
  localStorage.setItem("autoNext", cont);
 };
}

// LOOP COUNT
let loopEl = document.getElementById("loopCount");
if(loopEl){
 loopEl.oninput = e=>{
  repeatCount = e.target.value;
  localStorage.setItem("loopCount", repeatCount);
 };
}

// FONT SIZE
let sizeEl = document.getElementById("arabicSize");
if(sizeEl){
 sizeEl.oninput = e=>{
  let size = e.target.value;
  document.documentElement.style.setProperty("--arabicSize", size+"px");
  localStorage.setItem("arabicSize", size);
 };
}

// TRANSLATION
let transEl = document.getElementById("showTrans");
if(transEl){
 transEl.onchange = e=>{
  showTranslation = e.target.checked;
  localStorage.setItem("showTrans", showTranslation);
  if(currentSurah) openSurah(currentSurah.number);
 };
}

// TAJWEED
let tjEl = document.getElementById("tajweedToggle");
if(tjEl){
 tjEl.onchange = e=>{
  tajweedOn = e.target.checked;
  localStorage.setItem("tajweed", tajweedOn);
  if(currentSurah) openSurah(currentSurah.number);
 };
}

// THEME
let themeEl = document.getElementById("themeSelect");
if(themeEl){
 themeEl.onchange = e=>{
  if(typeof applyTheme === "function"){
   applyTheme(e.target.value);
  }
 };
}

// RESET
function resetSettings(){
 localStorage.clear();
 location.reload();
}
