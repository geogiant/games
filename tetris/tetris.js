const c = document.getElementById("myCanvas");
const ctx = c.getContext("2d");

const shapes = {
 t : [[5,0],[4,0],[6,0],[5,1]],
 o : [[4,0],[5,0],[4,1],[5,1]],
 zigzag : [[5,0],[4,0],[5,1],[6,1]],
 zagzig : [[5,0],[5,1],[4,1],[6,0]],
 line : [[4,0],[3,0],[5,0],[6,0]],
 l : [[4,0],[4,1],[5,0],[6,0]],
 r : [[6,0],[5,0],[4,0],[6,1]]
}

const colours = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#CD853F']

let activeShape = []
let nextShape = []
let filledSquares = []
let gameSpeed = 0
let moveCount = 0
let gameID = ''

startGame()

function startGame() {
    ctx.clearRect(0, 0, 1005, 905)
    activeShape = randomShape()
    nextShape = randomShape()
    clearDisplay()
    displayNext(nextShape)

    filledSquares = []
    gameSpeed = 1000
    moveCount = 10000
    score = 0
    addScore(0)

    document.addEventListener("keydown", keyDownHandler, false);

    spawnShape(activeShape)

    gameID = setInterval(speedControl, 100)
}
function speedControl() {
    moveCount -= gameSpeed
    filledSquares.forEach(filledSquare => {
        clearSquare(filledSquare)
        spawnSquare(filledSquare)
    })
    if (moveCount <= 0) {
        moveCount = 10000
        moveShape()
    }
    gameSpeed++
}

function moveRight(shape) {
    if (isValidPosition(rightOne(shape))) {
        activeShape.forEach(clearSquare)
        activeShape = rightOne(activeShape)
        spawnShape(activeShape)
    }
}

function moveLeft(shape) {
    if (isValidPosition(leftOne(shape))) {
        activeShape.forEach(clearSquare)
        activeShape = leftOne(activeShape)
        spawnShape(activeShape)
    }
}

function moveShape() {
    if ( canMove(activeShape) ) {
        activeShape.forEach(clearSquare)
        activeShape = downOne(activeShape)
    } else {
        addScore(10)
        activeShape.forEach(square => filledSquares.push(square))
        clearRows()
        activeShape = nextShape
        nextShape = randomShape()
        clearDisplay()
        displayNext(nextShape)
        if ( ! isValidPosition(activeShape) ) {
            gameOver()
            return
        }
    }
    spawnShape(activeShape)
}

function clearRows() {
    filledSquares = filledSquares.sort(pairSort)
    const fullRow = filledSquares.reduce((p, c) => {
        if (p[0] === 10) {
            return p
        }
        return p[1] === c[1] ? arrayAdd(p, [1,0]) : [1, c[1]]
    }, 
    [0,0])

   if (fullRow[0] === 10) {
       removeRow(fullRow[1])
       clearRows()
   } 
}

function keyDownHandler(e) {
    if(e.key == "ArrowRight") {
         moveRight(activeShape)
    }
    else if(e.key == "ArrowLeft") {
        moveLeft(activeShape)
    }
    else if(e.key == "ArrowDown") {
        moveShape()
    }
    else if(e.key == "ArrowUp") {
        rotate(activeShape)
    }
}

function gameOver() {
    document.removeEventListener("keydown", keyDownHandler);
    clearInterval(gameID)
    drawEndScreen()
    document.addEventListener('click', clickRetry, false)
}


//Helper Functions

function spawnShape(shape) {
    shape.forEach(spawnSquare)
  }
  
  function clearSquare([x, y, c]) {
    ctx.clearRect(100 * x, 100 * y, 105, 105)
  }
  
  function spawnSquare([x, y, c]) {
    ctx.fillStyle = "#000000"
    ctx.fillRect(100 * x, 100 * y, 105, 105)
    ctx.fillStyle = c
    ctx.fillRect(100 * x + 5, 100 * y + 5, 95, 95)
  } 
  
  function downOne(shape) {
    return shape.map(square => square.map((v,c) => c === 1 ? v + 1 : v))
  }
  
  function rightOne(shape) {
    return shape.map(square => square.map((v,c) => c === 0 ? v + 1 : v))
  }
  
  function leftOne(shape) {
    return shape.map(square => square.map((v,c) => c === 0 ? v - 1 : v))
  }
  
  function removeRow(row) {
    addScore(100)
    filledSquares.forEach(clearSquare)
    filledSquares = filledSquares.filter(x => x[1] !== row)
    filledSquares = filledSquares.map(x => x[1] < row ? arrayAdd(x, [0,1]) : x)
    filledSquares.forEach(spawnSquare)
  }
  
  function pairSort(a,b) {
    if (a[1] === b[1]) {
        return a[0] - b[0] 
    }
    return a[1] - b[1]
  }
  
  function rotate(shape) {
    const rotatedShape = rotated(shape)
    if ( isValidPosition(rotatedShape) ) {
        activeShape.forEach(clearSquare)
        activeShape = rotated(activeShape)
        spawnShape(activeShape)
    } else if ( isValidPosition(leftOne(rotatedShape))) {
      activeShape.forEach(clearSquare)
      activeShape = leftOne(rotatedShape)
      spawnShape(activeShape)
    } else if ( isValidPosition(rightOne(rotatedShape))) {
      activeShape.forEach(clearSquare)
      activeShape = rightOne(rotatedShape)
      spawnShape(activeShape)
    }

  
  }
  
  function arrayAdd(a, b) {
    return a.map((x,i) => i < 2 ? x + b[i] : x)
  }
  
  function isValidPosition(shape) {
    if ( shape.filter(square => square[1] > 8).length > 0 ) {
        return false
    }
    if ( shape.filter(square => square[0] > 9).length > 0 ) {
        return false
    } 
    if ( shape.filter(square => square[0] < 0).length > 0 ) {
        return false
    }  
    if (shape.filter(isFilled).length > 0) {
        return false
    }
    return true
  }
  
  function isFilled(square) {
    let filled = false
    filledSquares.forEach(filledSquare => {
        if (filledSquare[0] === square[0] && filledSquare[1] === square[1]) {
            filled = true
        }
    })
    return filled
  }
  
  function randomShape() {
    const randomNumber = Math.floor(Math.random() * 7)
    return Object.values(shapes)[randomNumber].map(square => square.concat([colours[randomNumber]]))
  }
  
  
  function rotated(shape) {
    const centre = shape[0]
    const rotatedShape = []
    shape.forEach(square => {
        const rotationVector = square.map((v,i) => i < 2 ? v - centre[i] : v)
        const vector = spin(rotationVector)
        rotatedShape.push(square.map((v,i) => i < 2 ? centre[i] + vector[i] : v))
    })
    return rotatedShape
  }
  
  function spin([x, y, c]) {
    return [y, -x, c]
  }
  
  function canMove(shape) {  
    if (isValidPosition(downOne(shape))) {
        return true
    }
    return false
  }

  function drawEndScreen() {
    ctx.clearRect(0, 0, 1005, 905)
    ctx.fillStyle = '#666666'
    ctx.fillRect(250, 200, 500, 400)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(350, 450, 300, 100)
    ctx.font = '80px Arial'
    ctx.fillStyle = '#000000'
    ctx.fillText('Final Score', 300, 300, 400)
    const digits = Math.ceil(Math.log(score) / Math.log(10))
    ctx.fillText(score, 500 - digits * 21, 400, 400)
    ctx.font = '70px Arial'
    ctx.fillText('Retry', 415, 520, 400)
  }

  function clickRetry(e) {
    if (
      e.clientX > 810 && 
      e.clientX < 1110 &&
      e.clientY > 565 && 
      e.clientY < 660
    ) {
      startGame()
    }
    console.log(e)
  }