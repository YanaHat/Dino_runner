// === ЭЛЕМЕНТЫ ===
let dino = document.getElementById("dino");
let road = document.getElementById("road");
let scoreEl = document.getElementById("score");
let finalScore = document.getElementById("finalScore");
let menu = document.getElementById("menu");
let game = document.getElementById("game");
let settings = document.getElementById("settings");
let recordScreen = document.getElementById("recordScreen");
let gameOverMenu = document.getElementById("gameOverMenu");
let playBtn = document.getElementById("playBtn");
let settingsBtn = document.getElementById("settingsBtn");
let backBtn = document.getElementById("backBtn");
let recordBtn = document.getElementById("recordBtn");
let recordBackBtn = document.getElementById("recordBackBtn");
let restartBtn = document.getElementById("restartBtn");
let goToMenuBtn = document.getElementById("goToMenuBtn");
let bgSelect = document.getElementById("bgSelect");
let soundToggle = document.getElementById("soundToggle");
let recordText = document.getElementById("recordText");
let cactusContainer = document.getElementById("cactusContainer");
let birdContainer = document.getElementById("birdsLayer");
let pauseMenu = document.getElementById("pauseMenu");
let resumeBtn = document.getElementById("resumeBtn");
let pauseToMenuBtn = document.getElementById("pauseToMenuBtn");
let pauseBtn = document.getElementById("pauseBtn");

// === НАСТРОЙКИ ===
let gameSpeed = 7;
let speedIncreaseStep = 0.3;
let activeCactuses = [];
let activeBirds = [];
let lastCactusSpawn = 0;
let lastBirdSpawn = 0;
let lastFrameTime = 0;

// === ЗВУКИ ===
let sounds = {
  start: new Audio("sounds/start.mp3"),
  jump: new Audio("sounds/jump.mp3"),
  lose: new Audio("sounds/lose.mp3"),
  record: new Audio("sounds/record.mp3"),
};

// === ПЕРЕМЕННЫЕ ===
let isJumping = false;
let isDucking = false;
let isGameOver = false;
let isPaused = false;
let score = 0;
let record = JSON.parse(localStorage.getItem("dinoRecord")) || null;

// === МЕНЮ ===
playBtn.onclick = startGame;
settingsBtn.onclick = () => toggleScreen(settings);
backBtn.onclick = () => toggleScreen(menu);
recordBtn.onclick = showRecord;
recordBackBtn.onclick = () => toggleScreen(menu);
restartBtn.onclick = restartGame;
goToMenuBtn.onclick = () => toggleScreen(menu);
pauseBtn.onclick = pauseGame;
resumeBtn.onclick = resumeGame;
pauseToMenuBtn.onclick = () => {
  toggleScreen(menu);
  pauseMenu.classList.add("hidden");
  isPaused = false;
};

function toggleScreen(screenToShow) {
  [menu, settings, game, recordScreen, gameOverMenu].forEach(s => s.style.display = "none");
  screenToShow.style.display = "block";
}

// === ФОН ===
bgSelect.onchange = () => {
  let val = bgSelect.value;
  switch (val) {
    case "day": document.body.style.setProperty("--bg-color", "rgb(230, 250, 250)"); break;
    case "night": document.body.style.setProperty("--bg-color", "rgba(50, 60, 100, 1)"); break;
    case "sunset": document.body.style.setProperty("--bg-color", "rgba(255, 218, 183, 1)"); break;
  }
};

// === УПРАВЛЕНИЕ ===
document.addEventListener("keydown", e => {
  // Пробел
  if (e.key === " ") {
    if (isGameOver) {
      // В меню проигрыша — начать заново
      restartGame();
      return;
    }
    if (isPaused) {
      // В паузе — продолжить
      resumeGame();
      return;
    }
    // Прыжок
    if (!isJumping && !isGameOver && !isPaused) jump();
  }

  // Прыжок стрелкой ↑
  if (e.key === "ArrowUp" && !isJumping && !isGameOver && !isPaused) {
    jump();
  }

  // Присяд стрелкой ↓
  if (e.key === "ArrowDown" && !isDucking && !isGameOver && !isPaused) {
    duck(true);
  }

  // Пауза (ESC)
  if (e.key === "Escape" && !isGameOver) {
    if (isPaused) resumeGame();
    else pauseGame();
  }
});

document.addEventListener("keyup", e => {
  if (e.key === "ArrowDown" && isDucking && !isGameOver && !isPaused) {
    duck(false);
  }
});

// === ПОВЕДЕНИЕ ДИНО ===
function jump() {
  if (soundToggle.checked) sounds.jump.play();
  dino.querySelector("img").src = "img/trex_jump.png";
  dino.classList.add("jump");
  isJumping = true;
  setTimeout(() => {
    dino.classList.remove("jump");
    isJumping = false;
    dino.querySelector("img").src = "img/trex.png";
  }, 400);
}

function duck(active) {
  if (active) {
    isDucking = true;
    dino.classList.add("duck");
    dino.querySelector("img").src = "img/trex_oath.png";
  } else {
    isDucking = false;
    dino.classList.remove("duck");
    dino.querySelector("img").src = "img/trex.png";
  }
}

// === ЦИКЛ ===
let lastSpeedIncreaseScore = 0;
let birdSpawnInterval = 2500;
const MIN_SPAWN_GAP = 700; // мс — чтобы объекты не мешали друг другу

function gameLoop(timestamp) {
  if (isGameOver || isPaused) return;
  if (!lastFrameTime) lastFrameTime = timestamp;

  let delta = (timestamp - lastFrameTime) / 16.6667; // нормализация по 60fps
  lastFrameTime = timestamp;

  updateCactuses(delta);
  updateBirds(delta);
  updateRoad(delta);

  score += 0.1;
  scoreEl.textContent = Math.floor(score);

  if (score - lastSpeedIncreaseScore >= 200) {
    gameSpeed += speedIncreaseStep;
    lastSpeedIncreaseScore = score;
    birdSpawnInterval = Math.max(800, birdSpawnInterval - 50);
  }

  // === Спавн кактусов ===
  if (timestamp - lastCactusSpawn > 1200 + Math.random() * 800) {
    spawnCactus(timestamp);
  }

  // === Спавн птиц ===
  if (timestamp - lastBirdSpawn > birdSpawnInterval) {
    spawnBird(timestamp);
  }

  updateScoreAndCollisions();
  requestAnimationFrame(gameLoop);
}

// === СТАРТ/ПАУЗА ===
function startGame() {
  if (soundToggle.checked) sounds.start.play();
  toggleScreen(game);
  resetGame();
  setTimeout(() => requestAnimationFrame(gameLoop), 500);
}

function pauseGame() {
  if (isGameOver || isPaused) return;
  isPaused = true;
  pauseMenu.classList.remove("hidden");
}

function resumeGame() {
  if (!isPaused) return;
  isPaused = false;
  pauseMenu.classList.add("hidden");
  lastFrameTime = performance.now();
  requestAnimationFrame(gameLoop);
}

// === ПРОИГРЫШ ===
function gameOver() {
  isGameOver = true;
  if (soundToggle.checked) sounds.lose.play();
  finalScore.innerText = `Ваш счёт: ${Math.floor(score)}`;
  if (!record || score > record.value) {
    let newRecord = { value: score, date: new Date().toLocaleString() };
    localStorage.setItem("dinoRecord", JSON.stringify(newRecord));
    if (soundToggle.checked) sounds.record.play();
    document.body.style.animation = "recordFlash 1s";
    record = newRecord;
  }
  toggleScreen(gameOverMenu);
}

// === СБРОС ===
function resetGame() {
  isGameOver = false;
  isPaused = false;
  score = 0;
  scoreEl.innerText = "0";
  gameSpeed = 8;
  activeCactuses.forEach(c => c.remove());
  activeBirds.forEach(b => b.remove());
  activeCactuses = [];
  activeBirds = [];
  lastCactusSpawn = 0;
  lastBirdSpawn = 0;
  lastFrameTime = 0;
}

// === РЕСТАРТ ===
function restartGame() {
  resetGame();
  toggleScreen(game);
  requestAnimationFrame(gameLoop);
}

// === РЕКОРД ===
function showRecord() {
  toggleScreen(recordScreen);
  if (record) recordText.innerText = `Рекорд: ${record.value} очков (${record.date})`;
  else recordText.innerText = "Пока рекордов нет";
}

// === СПАВНЫ ===
function spawnCactus(timestamp) {
  if (timestamp - lastBirdSpawn < MIN_SPAWN_GAP) return;

  let c = document.createElement("div");
  c.className = "cactus";
  let img = document.createElement("img");
  img.className = "cactus-img";

  if (Math.random() < 0.5) {
    img.src = "img/cactus1.png";
    c.style.width = "35px";
    c.style.height = "45px";
    img.style.width = "60px";
    img.style.height = "60px";
    img.style.left = "-10px";
    img.style.bottom = "-15px";
  } else {
    img.src = "img/cactus2.png";
    c.style.width = "45px";
    c.style.height = "50px";
    img.style.width = "70px";
    img.style.height = "70px";
    img.style.left = "-15px";
    img.style.bottom = "-10px";
  }

  img.style.position = "absolute";
  img.style.pointerEvents = "none";
  c.appendChild(img);

  c.style.bottom = "20px";
  c.style.left = (game.offsetWidth + 20) + "px";

  cactusContainer.appendChild(c);
  activeCactuses.push(c);
  lastCactusSpawn = timestamp;
}

function spawnBird(timestamp) {
  if (timestamp - lastCactusSpawn < MIN_SPAWN_GAP) return;

  let tooClose = activeCactuses.some(c => {
    let x = parseFloat(c.style.left);
    return x > game.offsetWidth - 200 && x < game.offsetWidth + 200;
  });
  if (tooClose) return;

  let b = document.createElement("div");
  b.className = "bird";

  let img = document.createElement("img");
  img.className = "bird-img";
  img.src = "img/bird1.png";
  img.style.position = "absolute";
  img.style.width = "80px";
  img.style.height = "35px";
  img.style.left = "-20px";
  img.style.top = "-5px";
  img.style.pointerEvents = "none";
  b.appendChild(img);

  let heights = ["90px", "100px", "110px", "120px", "130px", "140px"];
  b.style.top = heights[Math.floor(Math.random() * heights.length)];
  b.style.left = (game.offsetWidth + 20) + "px";

  birdContainer.appendChild(b);
  activeBirds.push(b);
  lastBirdSpawn = timestamp;
}

// === ОБНОВЛЕНИЕ ===
function updateCactuses(delta) {
  for (let i = activeCactuses.length - 1; i >= 0; i--) {
    let c = activeCactuses[i];
    let x = parseFloat(c.style.left);
    if (isNaN(x)) x = game.offsetWidth;
    x -= gameSpeed * delta;
    c.style.left = x + "px";
    if (x < -c.offsetWidth) {
      c.remove();
      activeCactuses.splice(i, 1);
    }
  }
}

function updateBirds(delta) {
  for (let i = activeBirds.length - 1; i >= 0; i--) {
    let b = activeBirds[i];
    let x = parseFloat(b.style.left);
    if (isNaN(x)) x = game.offsetWidth;
    x -= gameSpeed * 1.2 * delta;
    b.style.left = x + "px";
    if (x < -b.offsetWidth) {
      b.remove();
      activeBirds.splice(i, 1);
    }
  }
}

function updateRoad(delta) {
  let cur = parseFloat(road.dataset.pos || 0);
  let next = cur - gameSpeed * delta;
  road.style.backgroundPositionX = next + "px";
  road.dataset.pos = next;
}

// === КОЛЛИЗИИ ===
function updateScoreAndCollisions() {
  let dRect = {
    top: dino.offsetTop + 10,
    bottom: dino.offsetTop + dino.offsetHeight - 5,
    left: dino.offsetLeft + 10,
    right: dino.offsetLeft + dino.offsetWidth - 10
  };

  for (let c of activeCactuses) {
    let cRect = c.getBoundingClientRect();
    let dRectAbs = dino.getBoundingClientRect();

    if (!(dRectAbs.right < cRect.left ||
      dRectAbs.left > cRect.right ||
      dRectAbs.bottom < cRect.top ||
      dRectAbs.top > cRect.bottom)) {
      gameOver();
      return;
    }
  }

  for (let b of activeBirds) {
    let top = parseFloat(b.style.top);
    let left = parseFloat(b.style.left);
    let width = parseFloat(b.offsetWidth);
    let height = parseFloat(b.offsetHeight);

    let birdHitbox = {
      top: top,
      bottom: top + height,
      left: left,
      right: left + width
    };

    if (!(dRect.right < birdHitbox.left ||
      dRect.left > birdHitbox.right ||
      dRect.bottom < birdHitbox.top ||
      dRect.top > birdHitbox.bottom)) {
      gameOver();
      return;
    }
  }
}
