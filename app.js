const canvas = document.getElementById("game-canvas");
const context = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("high-score");
const speedElement = document.getElementById("speed-level");
const statusElement = document.querySelector(".status");
const statusTextElement = document.getElementById("status-text");
const startHint = document.getElementById("start-hint");
const modal = document.getElementById("game-over-modal");
const finalScoreElement = document.getElementById("final-score");
const newRecordElement = document.getElementById("new-record");
const restartButton = document.getElementById("restart-button");
const playAgainButton = document.getElementById("play-again-button");

const GRID_SIZE = 24;
const CELL_SIZE = canvas.width / GRID_SIZE;
const START_SPEED = 135;
const MIN_SPEED = 67;
const SPEED_STEP = 11;

const directions = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const keyDirections = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

let snake;
let food;
let direction;
let queuedDirection;
let score;
let highScore = Number(localStorage.getItem("neon-snake-high-score")) || 0;
let gameLoop;
let isRunning;
let isGameOver;

function resetGame() {
  clearTimeout(gameLoop);
  snake = [
    { x: 12, y: 12 },
    { x: 11, y: 12 },
    { x: 10, y: 12 },
    { x: 9, y: 12 },
  ];
  direction = directions.right;
  queuedDirection = directions.right;
  score = 0;
  isRunning = false;
  isGameOver = false;

  modal.hidden = true;
  newRecordElement.hidden = true;
  startHint.classList.remove("hidden");
  statusElement.classList.remove("game-over");
  statusTextElement.textContent = "准备就绪";
  placeFood();
  updateInterface();
  draw();
}

function startGame() {
  if (isRunning || isGameOver) return;
  isRunning = true;
  startHint.classList.add("hidden");
  statusTextElement.textContent = "信号稳定 · 运行中";
  scheduleNextMove();
}

function scheduleNextMove() {
  clearTimeout(gameLoop);
  gameLoop = setTimeout(step, getCurrentSpeed());
}

function step() {
  direction = queuedDirection;
  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  const hitWall = head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE;
  const willGrow = head.x === food.x && head.y === food.y;
  const collisionBody = willGrow ? snake : snake.slice(0, -1);
  const hitSelf = collisionBody.some((segment) => segment.x === head.x && segment.y === head.y);

  if (hitWall || hitSelf) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (willGrow) {
    score += 1;
    placeFood();
    updateInterface();
  } else {
    snake.pop();
  }

  draw();
  scheduleNextMove();
}

function endGame() {
  isRunning = false;
  isGameOver = true;
  clearTimeout(gameLoop);
  statusElement.classList.add("game-over");
  statusTextElement.textContent = "连接已中断";

  const brokeRecord = score > highScore;
  if (brokeRecord) {
    highScore = score;
    localStorage.setItem("neon-snake-high-score", String(highScore));
    updateInterface();
  }

  finalScoreElement.textContent = score;
  newRecordElement.hidden = !brokeRecord;
  modal.hidden = false;
  playAgainButton.focus();
}

function placeFood() {
  let candidate;
  do {
    candidate = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some((segment) => segment.x === candidate.x && segment.y === candidate.y));
  food = candidate;
}

function changeDirection(nextDirectionName) {
  if (isGameOver) return;
  const nextDirection = directions[nextDirectionName];
  const reversing = nextDirection.x === -direction.x && nextDirection.y === -direction.y;
  if (reversing) return;

  queuedDirection = nextDirection;
  startGame();
}

function getSpeedLevel() {
  return Math.floor(score / 5) + 1;
}

function getCurrentSpeed() {
  return Math.max(MIN_SPEED, START_SPEED - (getSpeedLevel() - 1) * SPEED_STEP);
}

function updateInterface() {
  scoreElement.textContent = String(score).padStart(3, "0");
  highScoreElement.textContent = String(highScore).padStart(3, "0");
  speedElement.textContent = String(getSpeedLevel()).padStart(2, "0");
}

function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawFood();
  drawSnake();
}

function drawGrid() {
  context.strokeStyle = "rgba(100, 247, 152, 0.045)";
  context.lineWidth = 1;
  context.beginPath();

  for (let i = 1; i < GRID_SIZE; i += 1) {
    const position = i * CELL_SIZE;
    context.moveTo(position, 0);
    context.lineTo(position, canvas.height);
    context.moveTo(0, position);
    context.lineTo(canvas.width, position);
  }
  context.stroke();
}

function drawFood() {
  const centerX = food.x * CELL_SIZE + CELL_SIZE / 2;
  const centerY = food.y * CELL_SIZE + CELL_SIZE / 2;
  const radius = CELL_SIZE * 0.27;

  context.save();
  context.shadowColor = "#ff4f8b";
  context.shadowBlur = 18;
  context.fillStyle = "#ff4f8b";
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.fill();

  context.shadowBlur = 0;
  context.strokeStyle = "rgba(255, 157, 191, 0.85)";
  context.lineWidth = 1.5;
  context.beginPath();
  context.arc(centerX, centerY, radius + 5, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const inset = index === 0 ? 2 : 3.5;
    const x = segment.x * CELL_SIZE + inset;
    const y = segment.y * CELL_SIZE + inset;
    const size = CELL_SIZE - inset * 2;
    const opacity = Math.max(0.42, 1 - index * 0.025);

    context.save();
    context.globalAlpha = opacity;
    context.fillStyle = index === 0 ? "#a1ffbd" : "#64f798";
    context.shadowColor = "#64f798";
    context.shadowBlur = index < 4 ? 13 : 5;
    roundedRect(context, x, y, size, size, index === 0 ? 7 : 5);
    context.fill();
    context.restore();
  });

  drawEyes();
}

function drawEyes() {
  const head = snake[0];
  const baseX = head.x * CELL_SIZE;
  const baseY = head.y * CELL_SIZE;
  const perpendicular = { x: -direction.y, y: direction.x };
  const forward = { x: direction.x * 5, y: direction.y * 5 };

  context.fillStyle = "#07130e";
  [-1, 1].forEach((side) => {
    const eyeX = baseX + CELL_SIZE / 2 + forward.x + perpendicular.x * side * 5;
    const eyeY = baseY + CELL_SIZE / 2 + forward.y + perpendicular.y * side * 5;
    context.beginPath();
    context.arc(eyeX, eyeY, 2.2, 0, Math.PI * 2);
    context.fill();
  });
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

document.addEventListener("keydown", (event) => {
  if (keyDirections[event.key]) {
    event.preventDefault();
    changeDirection(keyDirections[event.key]);
  }

  if (event.key === "Enter" && isGameOver) {
    resetGame();
  }
});

document.querySelectorAll("[data-direction]").forEach((button) => {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    changeDirection(button.dataset.direction);
  });
});

restartButton.addEventListener("click", resetGame);
playAgainButton.addEventListener("click", resetGame);

resetGame();
