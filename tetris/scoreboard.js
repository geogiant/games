const c2 = document.getElementById("scoreboard");
const ctx2 = c2.getContext("2d");

let score = 0

function addScore(points) {
  score += points
  ctx2.clearRect(700,0,300,100)
  ctx2.fillStyle = `#000000`
  ctx2.font = '30px Arial'
  ctx2.fillText(`score : ${score}`, 700, 60)
}

function displayNext(nextShape) {
  nextShape.forEach(displaySquare)
}

function displaySquare([x, y, c]) {
  ctx2.fillStyle = "#000000"
  ctx2.fillRect(40 * x, 40 * y + 10, 42, 42)
  ctx2.fillStyle = c
  ctx2.fillRect(40 * x + 2, 40 * y + 12, 38, 38)
}

function clearDisplay() {
  ctx2.clearRect(120, 10, 180, 100)
}