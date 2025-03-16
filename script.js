// Game canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions to fill the screen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Global variables
const airplane = {
  x: canvas.width / 2 - 50,
  y: window.innerWidth < 768 ? canvas.height * 0.3 : canvas.height * 0.5, // Adjust position for mobile
  width: 100,
  height: 100,
  isDragging: false,
  lives: 1,
};

const obstacles = [];
const coins = [];
let gameOver = false;
let gameStarted = false;
let inUpgradeMenu = false;
let score = 0;
let coinsCollected = 0;
let coinBank = 0;
let level = 1;
let upgraded = false;

// Images and sounds
const airplaneImg = new Image();
airplaneImg.src = 'fly.png';

const upgradedAirplaneImg = new Image();
upgradedAirplaneImg.src = 'joke.png'; // Upgraded airplane image

// Ensure the canvas resizes properly
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Adjust airplane position after resize
    airplane.x = canvas.width / 2 - 50;
    airplane.y = window.innerWidth < 768 ? canvas.height * 0.3 : canvas.height * 0.5;
});


const enemyImg = new Image();
enemyImg.src = 'PhQs airlines_processed.png';

const enemyImg2 = new Image();
enemyImg2.src = 'Untitled design (18)_processed.png';

const coinImg = new Image();
coinImg.src = '$Bird$_processed.png';

const backgroundImg = new Image();
backgroundImg.src = 'sky.avif';

const backgroundMusic = new Audio('./backgroundmusic2.mp3');
backgroundMusic.loop = true;

// Start background music after user interaction
window.addEventListener('click', () => {
  backgroundMusic.play().catch((error) => console.error('Audio play error:', error));
});

// Event listeners for mouse/touch input
function isInsideAirplane(x, y) {
  return (
    x >= airplane.x &&
    x <= airplane.x + airplane.width &&
    y >= airplane.y &&
    y <= airplane.y + airplane.height
  );
}

function handleStart(event) {
  event.preventDefault(); // Prevent unintended scrolling on mobile

  let x, y;
  if (event.touches) {
    x = event.touches[0].clientX;
    y = event.touches[0].clientY;
  } else {
    x = event.clientX;
    y = event.clientY;
  }

  const rect = canvas.getBoundingClientRect();
  x -= rect.left;
  y -= rect.top;

  if (isInsideAirplane(x, y)) {
    airplane.isDragging = true;
  }
}

function handleMove(event) {
  if (!airplane.isDragging) return;
  event.preventDefault();

  let x;
  if (event.touches) {
    x = event.touches[0].clientX;
  } else {
    x = event.clientX;
  }

  const rect = canvas.getBoundingClientRect();
  x -= rect.left;

  airplane.x = x - airplane.width / 2;
  if (airplane.x < 0) airplane.x = 0;
  if (airplane.x + airplane.width > canvas.width) {
    airplane.x = canvas.width - airplane.width;
  }
}

function handleEnd(event) {
  event.preventDefault();
  airplane.isDragging = false;
}

// Add event listeners for both mouse and touch
canvas.addEventListener('mousedown', handleStart);
canvas.addEventListener('mousemove', handleMove);
canvas.addEventListener('mouseup', handleEnd);
canvas.addEventListener('mouseleave', handleEnd);
canvas.addEventListener('touchstart', handleStart, { passive: false });
canvas.addEventListener('touchmove', handleMove, { passive: false });
canvas.addEventListener('touchend', handleEnd);
// Draw functions
function drawBackground() {
  ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
}

function drawAirplane() {
  const img = upgraded ? upgradedAirplaneImg : airplaneImg;
  ctx.drawImage(img, airplane.x, airplane.y, airplane.width, airplane.height);
}

function drawCoins() {
  coins.forEach((coin, index) => {
    coin.y += 2;
    if (
      airplane.x < coin.x + coin.width &&
      airplane.x + airplane.width > coin.x &&
      airplane.y < coin.y + coin.height &&
      airplane.y + airplane.height > coin.y
    ) {
      coinsCollected += coin.value;
      coinBank += coin.value=100;
      coins.splice(index, 1);
    }

    if (coin.y > canvas.height) coins.splice(index, 1);
    ctx.drawImage(coinImg, coin.x, coin.y, coin.width, coin.height);
  });

  if (Math.random() < 0.02) {
    coins.push({
      x: Math.random() * (canvas.width - 30),
      y: -30,
      width: 125,
      height: 125,
      value: Math.random() < 0.1 ? (Math.random() < 0.5 ? 10 : 50) : 1,
    });
  }
}

// Logic for both attackers
function drawObstacles() {
  obstacles.forEach((obstacle, index) => {
    if (obstacle.type === 'enemy1') {
      obstacle.y += obstacle.speed; // makes enemy go straight down
    } else if (obstacle.type === 'enemy2') {
      obstacle.x += Math.sin(obstacle.swirlDirection) * 3;
      obstacle.y += obstacle.speed;
      obstacle.swirlDirection += 0.07;
    }

    // Collision detection with airplane
    if (
      airplane.x < obstacle.x + obstacle.width &&
      airplane.x + airplane.width > obstacle.x &&
      airplane.y < obstacle.y + obstacle.height &&
      airplane.y + airplane.height > obstacle.y
    ) {
      airplane.lives--;
      obstacles.splice(index, 1); // Remove obstacle upon collision
      if (airplane.lives <= 0) {
        gameOver = true;
      }
    }

    // Remove obstacles if they go off the screen
    if (obstacle.y > canvas.height) obstacles.splice(index, 1);

    // Draw the enemy based on its type
    if (obstacle.type === 'enemy1') {
      ctx.drawImage(enemyImg, obstacle.x, obstacle.y, obstacle.width, obstacle.height); // Enemy 1 image
    } else if (obstacle.type === 'enemy2') {
      ctx.drawImage(enemyImg2, obstacle.x, obstacle.y, obstacle.width, obstacle.height); // Enemy 2 image (rocket ship)
    }
  });

  // Randomly spawn obstacles (enemies)
  if (Math.random() < 0.02) {
    const enemyType = Math.random() < 0.8 ? 'enemy1' : 'enemy2'; // 80% chance for enemy 1, 20% for enemy 2
    const newEnemy = {
      x: Math.random() * (canvas.width - 150), // Random x position
      y: -150, // Start above the screen
      width: 150, // Width of the enemy
      height: 150, // Height of the enemy
      speed: 2 + Math.random() * 3, // Random speed for each enemy
      type: enemyType, // Randomly assign the type of enemy
      swirlDirection: 0, // Only needed for enemy 2 (swirling)
    };
    obstacles.push(newEnemy);
  }
}

function drawScoreAndLevel() {
  ctx.font = '20px Arial';
  ctx.fillStyle = 'white';
  ctx.fillText(`Score: ${score}`, 20, 40);
  ctx.fillText(`Coins: ${coinsCollected}`, 20, 70);
  ctx.fillText(`Bank: ${coinBank}`, 20, 100);
  ctx.fillText(`Level: ${level}`, 20, 130);
}

function drawGameOver() {
  ctx.font = '50px Arial';
  ctx.fillStyle = 'red';
  ctx.fillText('Game Over!', canvas.width / 2 - 150, canvas.height / 2);
  ctx.font = '30px Arial';
  ctx.fillText('Returning to Main Menu...', canvas.width / 2 - 150, canvas.height / 2 + 50);

  setTimeout(() => {
    gameOver = false;
    gameStarted = false;
    drawMenu();
  }, 2000);
}

// Draw Menu
function drawMenu() {
  ctx.fillStyle = 'black';
  ctx.fillRect(canvas.width / 4, canvas.height / 4, canvas.width / 2, canvas.height / 2);

  // Start Button
  ctx.fillStyle = 'blue';
  ctx.fillRect(canvas.width / 2 - 100, canvas.height / 3 - 25, 200, 50);
  ctx.fillStyle = 'white';
  ctx.font = '30px Arial';
  ctx.fillText('Start Game', canvas.width / 2 - 80, canvas.height / 3 + 10);

  // Upgrade Button
  ctx.fillStyle = 'blue';
  ctx.fillRect(canvas.width / 2 - 150, canvas.height / 2 - 25, 300, 50);
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText('Upgrade Bird', canvas.width / 2 - 80, canvas.height / 2 + 10);
}

// Draw Upgrade Menu
function drawUpgradeMenu() {
  ctx.fillStyle = 'darkgray';
  ctx.fillRect(canvas.width / 4, canvas.height / 4, canvas.width / 2, canvas.height / 2);

  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText('Upgrades', canvas.width / 2 - 50, canvas.height / 3 - 50);

  const birdX = canvas.width / 2 - 50;
  const birdY = canvas.height / 3;
  ctx.drawImage(upgradedAirplaneImg, birdX, birdY, 100, 100);

  ctx.fillText('Cost: 500 Coins', birdX - 20, birdY + 130);

  ctx.fillStyle = 'blue';
  ctx.fillRect(canvas.width / 2 - 100, canvas.height / 2 - 25, 200, 50);
  ctx.fillStyle = 'white';
  ctx.fillText('Back', canvas.width / 2 - 40, canvas.height / 2 + 10);
}

// Upgrade purchase logic
canvas.addEventListener('click', (e) => {
  const x = e.clientX;
  const y = e.clientY;

  // Handle Upgrade Menu
  if (inUpgradeMenu) {
    const birdX = canvas.width / 2 - 50;
    const birdY = canvas.height / 3;

    // Back button
    if (
      x >= canvas.width / 2 - 100 &&
      x <= canvas.width / 2 + 100 &&
      y >= canvas.height / 2 - 25 &&
      y <= canvas.height / 2 + 25
    ) {
      inUpgradeMenu = false;
      drawMenu();
    }

    // Upgrade button (click on bird)
    if (
      x >= birdX - 20 &&
      x <= birdX + 120 &&
      y >= birdY &&
      y <= birdY + 120 &&
      coinBank >= 500 && !upgraded
    ) {
      coinBank -= 500;
      upgraded = true;
      drawMenu();
    }
  } else {
    // Main menu logic (start game or upgrade)
    if (
      x >= canvas.width / 2 - 100 &&
      x <= canvas.width / 2 + 100 &&
      y >= canvas.height / 3 - 25 &&
      y <= canvas.height / 3 + 25
    ) {
      gameStarted = true;
      drawGame();
    }

    if (
      x >= canvas.width / 2 - 150 &&
      x <= canvas.width / 2 + 150 &&
      y >= canvas.height / 2 - 25 &&
      y <= canvas.height / 2 + 25
    ) {
      inUpgradeMenu = true;
      drawUpgradeMenu();
    }
  }
});

// Draw the Game (when it's started)
function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas before drawing

  // Draw background
  drawBackground();

  // Draw airplane
  drawAirplane();

  // Draw obstacles and coins
  drawObstacles();
  drawCoins();

  // Draw score and level
  drawScoreAndLevel();

  if (gameOver) {
    drawGameOver();
  } else {
    requestAnimationFrame(drawGame);
  }
}

// Start the game when the page loads
drawMenu();
