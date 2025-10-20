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
let pauseBtn = document.getElementById("pauseBtn"); // уже есть в HTML

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
}    

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
  if ((e.key === " " || e.key === "ArrowUp") && !isJumping && !isGameOver) jump();
  if (e.key === "ArrowDown" && !isDucking && !isGameOver) duck(true);
});
document.addEventListener("keyup", e => {
  if (e.key === "ArrowDown" && isDucking) duck(false);
});

function jump() {
  if (soundToggle.checked) sounds.jump.play();
  dino.style.backgroundImage = 'url("img/trex_jump.png")';
  dino.classList.add("jump");
  isJumping = true;
  setTimeout(() => {
    dino.classList.remove("jump");
    isJumping = false;
    dino.style.backgroundImage = 'url("img/trex.png")';
  }, 400);
}

function duck(active) {
  if (active) {
    isDucking = true;
    dino.classList.add("duck");
    dino.style.backgroundImage = 'url("img/trex_oath.png")';
  } else {
    isDucking = false;
    dino.classList.remove("duck");
    dino.style.backgroundImage = 'url("img/trex.png")';
  }
}

// === ЦИКЛ ===
let lastSpeedIncreaseScore = 0;
let birdSpawnInterval = 2500;

function gameLoop(timestamp) {
    if (isGameOver || isPaused) return;
    if (!lastFrameTime) lastFrameTime = timestamp;

    let delta = (timestamp - lastFrameTime) / 16.6667; // нормализация по 60 fps
    lastFrameTime = timestamp;

    // обновляем объекты с текущей скоростью
    updateCactuses(delta);
    updateBirds(delta);
    updateRoad(delta);

    // счёт увеличивается равномерно
    score += 0.1;
    scoreEl.textContent = Math.floor(score);

    // постепенное увеличение скорости объектов
    if (score - lastSpeedIncreaseScore >= 200) {
        gameSpeed += speedIncreaseStep;
        lastSpeedIncreaseScore = score;

        // немного ускоряем и интервал появления птиц
        birdSpawnInterval = Math.max(800, birdSpawnInterval - 50);
    }

    // спавн кактусов
    if (timestamp - lastCactusSpawn > 1200 + Math.random() * 800) {
        spawnCactus();
        lastCactusSpawn = timestamp;
    }

    // спавн птиц
    if (timestamp - lastBirdSpawn > birdSpawnInterval) {
        spawnBird();
        let birds = birdContainer.querySelectorAll(".bird");
        let lastBird = birds[birds.length - 1];
        if (lastBird) {
            const heights = ["10px"];
            lastBird.style.top = heights[Math.floor(Math.random() * heights.length)];
        }
        lastBirdSpawn = timestamp;
    }
    updateScoreAndCollisions();

    requestAnimationFrame(gameLoop);
}

// === СТАРТ ===
function startGame() {
    if (soundToggle.checked) sounds.start.play();
    toggleScreen(game);
    resetGame();
    setTimeout(() => requestAnimationFrame(gameLoop), 500);
    return;
}

let isPaused = false;  // глобальная переменная
function pauseGame() {
  if (isGameOver || isPaused) return; // нельзя паузить, если уже конец
  isPaused = true;
  document.getElementById("pauseMenu").classList.remove("hidden");
}

function resumeGame() {
  isPaused = false;
  pauseMenu.classList.add("hidden");
  lastFrameTime = performance.now(); // чтобы не было скачка
  requestAnimationFrame(gameLoop);   // продолжаем игру
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
function spawnCactus() {
    let c = document.createElement("div");
    c.className = "cactus";

    // выбираем тип кактуса
    if (Math.random() < 0.5) {
        c.style.backgroundImage = 'url("img/cactus1.png")';
        c.style.width = "50px";  // фиксируем ширину
        c.style.height = "55px"; // фиксируем высоту
    } else {
        c.style.backgroundImage = 'url("img/cactus2.png")';
        c.style.width = "55px";
        c.style.height = "60px";
    }

    c.style.bottom = "20px";              // все кактусы на одной линии
    c.style.left = (game.offsetWidth + 20) + "px";
    cactusContainer.appendChild(c);
    activeCactuses.push(c);
}

function spawnBird() {
    let b = document.createElement("div");
    b.className = "bird";
    b.style.top = (Math.random() < 0.5 ? "60px" : "140px");
    b.style.left = (game.offsetWidth + 20) + "px";
    birdContainer.appendChild(b);
    activeBirds.push(b);
}

// === ОБНОВЛЕНИЕ ===
function updateCactuses(delta) {
    for (let i = activeCactuses.length - 1; i >= 0; i--) {
        let c = activeCactuses[i];
        let x = parseFloat(c.style.left);
        if (isNaN(x)) x = game.offsetWidth;

        x -= gameSpeed * delta; // скорость учитывает gameSpeed
        c.style.left = x + "px";

        // если кактус ушёл за левый край
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

        x -= gameSpeed * 1.2 * delta; // птицы немного быстрее кактусов
        b.style.left = x + "px";

        // если птица ушла за левый край
        if (x < -b.offsetWidth) {
            b.remove();
            activeBirds.splice(i, 1);
        }
    }
}

function updateRoad(delta) {
    let cur = parseFloat(road.dataset.pos || 0);
    let next = cur - gameSpeed * delta; // движение дороги тоже зависит от gameSpeed
    road.style.backgroundPositionX = next + "px";
    road.dataset.pos = next;
}

function updateScoreAndCollisions() {
    // хитбокс динозавра — чуть меньше реального элемента
    let dRect = {
        top: dino.offsetTop + 10,
        bottom: dino.offsetTop + dino.offsetHeight - 5,
        left: dino.offsetLeft + 10,
        right: dino.offsetLeft + dino.offsetWidth - 10
    };

    // проверка столкновений с кактусами
    for (let c of activeCactuses) {
        let width = parseFloat(c.style.width);
        let height = parseFloat(c.style.height);
        let left = parseFloat(c.style.left);
        let bottom = parseFloat(c.style.bottom);

        // хитбокс строго по видимой части
        let cactusHitbox = {
            top: game.offsetTop + game.offsetHeight - bottom - height,
            bottom: game.offsetTop + game.offsetHeight - bottom,
            left: left + 2,   // немного сужаем по бокам
            right: left + width - 2
        };

        if (!(dRect.right < cactusHitbox.left ||
              dRect.left > cactusHitbox.right ||
              dRect.bottom < cactusHitbox.top ||
              dRect.top > cactusHitbox.bottom)) {
            gameOver();
            return;
        }
    }

    // проверка столкновений с птицами
    for (let b of activeBirds) {
        let top = parseFloat(b.style.top);
        let left = parseFloat(b.style.left);
        let width = parseFloat(b.offsetWidth); 
        let height = parseFloat(b.offsetHeight);

        // хитбокс строго по видимой части птицы
        let birdHitbox = {
            top: top,               // верхняя граница строго по CSS
            bottom: top + height,   // нижняя граница
            left: left,             // левая граница
            right: left + width     // правая граница
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
