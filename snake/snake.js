// SETUP
let dpi = window.devicePixelRatio;
const c = document.getElementById("myCanvas")
const ctx = c.getContext("2d")

function fix_dpi() {
  //get CSS height
  //the + prefix casts it to an integer
  //the slice method gets rid of "px"
  let style_height = +getComputedStyle(c).getPropertyValue("height").slice(0, -2);
  //get CSS width
  let style_width = +getComputedStyle(c).getPropertyValue("width").slice(0, -2);
  //scale the canvas
  c.setAttribute('height', style_height * dpi);
  c.setAttribute('width', style_width * dpi);
}
fix_dpi()
// SETTINGS
let foodNumber = 3
let height = 10
let spawnLength = 3
let gameSpeed = 10

// CONSTANTS
const buttonSize = 0.25
const pixHeight = c.height
const pixWidth = c.width
const buttonHeight = pixHeight * buttonSize
const buttonWidth = pixWidth * buttonSize
const marginWidth = (1 / 3) * (pixWidth - (2 * buttonWidth))
const marginHeight = (1 / 3) * (pixHeight - (2 * buttonHeight))
let unitLength = pixHeight / height
let width = Math.floor(pixWidth / unitLength)
const keys = [
  { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' },
  { up: 'w', down: 's', left: 'a', right: 'd' },
  { up: '[', down: "'", left: ';', right: '\\' },
  { up: 'y', down: "h", left: 'g', right: 'j' }]
const snakeColours = ['#FF0000', '#0000FF', '#F508B0', '#555555']
const BaseGrassColour = ['#6c9245', '#60984B', '#659A4F', '#67914F', '#629B43', '#6E9749']

// UTILS
const nArray = (length) => [...Array(length).keys()]

const colourSquare = ([x, y]) => {
  ctx.fillRect(unitLength * x, unitLength * y, unitLength - 2, unitLength - 2)
}

const vAdd = ([x_1, y_1], [x_2, y_2]) => [x_1 + x_2, y_1 + y_2]

const vMinus = ([x_1, y_1], [x_2, y_2]) => [x_1 - x_2, y_1 - y_2]

const vReverse = vector => vector.map(x => x === 0 ? 0 : -x)

const vEquals = ([x_1, y_1]) => ([x_2, y_2]) => x_1 === x_2 && y_1 === y_2

const aEquals = array1 => array2 => array1.length === array2.length && array1.every((v, i) => vEquals(v)(array2[i]))

const generateBoard = () => nArray(height).map(x => nArray(width))

const pickRandom = n => array => {
  const shuffledArray = array.map(x => [x, Math.random()]).sort(([_a, r1], [_b, r2]) => r1 - r2).map(([a, _]) => a)
  return shuffledArray.slice(0, n)
}

const drawPlus = (x, y, w, h) => {
  ctx.fillStyle = '#555555'
  ctx.fillRect(x, y, w, h)
  ctx.fillStyle = '#000000'
  ctx.fillRect(x + 0.2 * w, y + 0.4 * h, 0.6 * w, 0.2 * h)
  ctx.fillRect(x + 0.4 * w, y + 0.2 * h, 0.2 * w, 0.6 * h)
}

const drawMinus = (x, y, w, h) => {
  ctx.fillStyle = '#555555'
  ctx.fillRect(x, y, w, h)
  ctx.fillStyle = '#000000'
  ctx.fillRect(x + 0.2 * w, y + 0.4 * h, 0.6 * w, 0.2 * h)
}

const textWidth = (n, fontSize) => {
  if (n < 10) return 1/2 * fontSize
  else return 1/2 * fontSize + textWidth(n / 10, fontSize)
}

const head = snake => snake[snake.length - 1]

// FUNCTIONS

const clearScreen = () => {
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, pixWidth, pixHeight)
}

const drawBackground = () => {
  clearScreen()
  const gameboard = generateBoard()
  ctx.fillStyle = '#FFFFFF'
  gameboard.forEach((row, y) => row.forEach((x) => {
    colourSquare([x, y])
  }))
}

const generateSnake = player => {
  const shift = Math.floor(player / 2) * Math.floor(height / 3)
  return nArray(spawnLength).map(x => [x, 0]).map(v => player % 2 ? vAdd([0, -shift], vAdd(vReverse(v), [width - 1, height - 1])) : vAdd(v, [0, shift]))
}

const generateSnakes = n => {
  return nArray(n).map(generateSnake)
}

const drawSnake = (snake, i) => {
  ctx.fillStyle = snakeColours[i % snakeColours.length]
  snake.forEach(colourSquare)
}

const moveSnake = (snake, i) => {
  const forwards = vMinus(head(snake), snake[snake.length - 2])
  const direction = directions[i]
  while (direction[0] && (vEquals(direction[0])(vReverse(forwards)) || vEquals(direction[0])(forwards))) {
    direction[0] = direction[1]
    direction[1] = null
  }
  return snake.map(([x, y], i) => {
    return i < snake.length - 1 ? snake[i + 1] : direction[0] ? [x + direction[0][0], y + direction[0][1]] : [2 * x - snake[i - 1][0], 2 * y - snake[i - 1][1]]
  })
}

const isDead = (snakes) => {
  const heads = snakes.map(head)
  const dead = ([hx, hy]) => hx < 0 || width <= hx || hy < 0 || height <= hy || snakes.reduce((count, snake) => count + snake.filter(vEquals([hx, hy])).length, 0) >= 2
  return heads.map(dead)
}

const getFood = (oldFood, eatenFood, snakes) => {
  const food = oldFood.filter(foodBit => eatenFood.filter(vEquals(foodBit)).length === 0)
  const requiredFood = foodNumber - food.length
  if (requiredFood === 0) {
    return food
  } else {
    freeSpaces = generateBoard().map((row, y) => row.filter(x => snakes.every(snake => !snake.some(vEquals([x, y])))).map(x => [x, y])).flat()
    return food.concat(pickRandom(requiredFood)(freeSpaces))
  }
}

const drawFood = (food) => {
  ctx.fillStyle = '#FFD700'
  food.forEach(colourSquare)
}

const eatFood = (snakes, food) => {
  const heads = snakes.map(head)
  return food.filter(x => heads.filter(vEquals(x)).length > 0)
}

const growSnake = (snakes, movedSnakes, eatenFood) => {
  if (eatenFood.length === 0) {
    return movedSnakes
  } else {
    const heads = movedSnakes.map(head).map((head, i) => [head, i])
    const growingSnakes = heads.filter(([head, i]) => eatenFood.filter(vEquals(head)).length > 0).map(([_, i]) => i)
    return movedSnakes.map((snake, i) => growingSnakes.includes(i) ? [snakes[i][0]].concat(snake) : snake)
  }
}

const usedInput = () => {
  directions = directions.map(([_, d2]) => [d2, null])
}

const drawMenu = () => {
  clearScreen()
  ctx.fillStyle = '#555555'
  ctx.fillRect(marginWidth, marginHeight, buttonWidth, buttonHeight)
  ctx.fillRect(2 * marginWidth + buttonWidth, marginHeight, buttonWidth, buttonHeight)
  ctx.fillRect(marginWidth, 2 * marginHeight + buttonHeight, buttonWidth, buttonHeight)
  ctx.fillRect(2 * marginWidth + buttonWidth, 2 * marginHeight + buttonHeight, buttonWidth, buttonHeight)
  ctx.fillRect(11/10 * marginWidth + buttonWidth, 11/10 * marginHeight + buttonHeight, 8/10 * marginWidth, 8/10 * marginHeight)
  ctx.fillStyle = '#000000'
  ctx.font = 300 * buttonSize + 'px Arial'
  ctx.fillText("1 Player", marginWidth + 1/3 * buttonWidth, marginHeight + (1 / 2) * buttonHeight + 75 * buttonSize)
  ctx.fillText("2 Player", 2 * marginWidth + 4/3 * buttonWidth, marginHeight + (1 / 2) * buttonHeight + 75 * buttonSize)
  ctx.fillText("3 Player", marginWidth + 1/3 * buttonWidth, 2 * marginHeight + (3 / 2) * buttonHeight + 120 * buttonSize)
  ctx.fillText("4 Player", 2 * marginWidth + 4/3 * buttonWidth, 2 * marginHeight + (3 / 2) * buttonHeight + 120 * buttonSize)
  ctx.fillText('Options', 5/4 * marginWidth + buttonWidth, 3/2 * marginHeight + buttonHeight + 25)
  document.addEventListener('click', menuClick, false)
}

const menuClick = (e) => {
  const rect = c.getBoundingClientRect()
  const x = (e.clientX - rect.left) * dpi
  const y = (e.clientY - rect.top) * dpi

  let column = 0
  let row = 0

  if (
    x > marginWidth &&
    x < marginWidth + buttonWidth
  ) {
    column = 1
  } else if (
    x > 2 * marginWidth + buttonWidth &&
    x < 2 * (marginWidth + buttonWidth)
  ) {
    column = 2
  }

  if (
    y > marginHeight &&
    y < marginHeight + buttonHeight
  ) {
    row = 1
  } else if (
    y > 2 * marginHeight + buttonHeight &&
    y < 2 * (marginHeight + buttonHeight)
  ) {
    row = 2
  }
  if (column && row) {
    const players = column + 2 * row - 2
    document.removeEventListener('click', menuClick)
    startGame(generateSnakes(players), nArray(players), [])
  } else if (
    x > 11/10 * marginWidth + buttonWidth &&
    x < 19/10 * marginWidth + buttonWidth &&
    y > 11/10 * marginHeight + buttonHeight &&
    y < 19/10 * marginHeight + buttonHeight
  ) {
    openOptions()
  }
}

const optionsClick = (e) => {
  document.removeEventListener('click', optionsClick)
  const rect = c.getBoundingClientRect()
  const x = (e.clientX - rect.left) * dpi
  const y = (e.clientY - rect.top) * dpi

  let minus = 0
  let plus = 0

  if (
    x < 1/6 * pixWidth &&
    y < 1/5 * pixWidth
  ) {
    drawMenu()
  } else  {
    if (
      x > 1/2 * pixWidth &&
      x < 1/10 * pixHeight + 1/2 * pixWidth
    ){
      minus = 1
    } else if (
      1/2 * pixWidth + 3/10 * pixHeight &&
      x < 1/2 * pixWidth + 4/10 * pixHeight
    ) {
      plus = 1
    }
    if (
      y > 0.12 * pixHeight &&
      y < 0.22 * pixHeight
    ) {
      foodNumber += plus - minus
      if (foodNumber < 0) foodNumber = 0
      if (foodNumber > height * width) foodNumber = height * width
      openOptions()
    } else if (
      y > 0.32 * pixHeight &&
      y < 0.42 * pixHeight
    ) {
      adjustDimensions(plus - minus)
      openOptions()      
    } else if (
      y > 0.52 * pixHeight &&
      y < 0.62 * pixHeight
    ) {
      spawnLength += plus - minus
      if (spawnLength < 3)  spawnLength = 3
      if (spawnLength > width - 1) spawnLength = width - 1
      openOptions() 
    } else if (
      y > 0.72 * pixHeight &&
      y < 0.82 * pixHeight
    ) {
      gameSpeed += plus - minus
      if (gameSpeed < 1 || gameSpeed > 100) gameSpeed -= plus - minus
      openOptions() 
    }
  }
}

const adjustDimensions = (heightChange) => {
  height += heightChange
  unitLength = pixHeight / height
  width = Math.floor(pixWidth / unitLength)
  if (width < Math.max(5, spawnLength)) adjustDimensions(heightChange * -1) 
  if (foodNumber > height * width) foodNumber = height * width
}

const openOptions = () => {
  document.removeEventListener('click', menuClick)
  clearScreen()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '150px Arial'
  ctx.fillText("Foods", 1/6 * pixWidth, 1/5 * pixHeight)
  ctx.fillText("Board Size", 1/6 * pixWidth, 2/5 * pixHeight)
  ctx.fillText("Start Length", 1/6 * pixWidth, 3/5 * pixHeight)
  ctx.fillText('Game Speed', 1/6 * pixWidth, 4/5 * pixHeight)
  ctx.font = '100px Arial'
  ctx.fillText('Home', 1/30 * pixWidth, 1/10 * pixHeight)
  ctx.fillText(foodNumber.toString(), 1/2 * pixWidth + 1/5 * pixHeight - 1/2 * textWidth(foodNumber, 150),  0.2 * pixHeight)
  ctx.fillText(height.toString(), 1/2 * pixWidth + 1/5 * pixHeight - 1/2 * textWidth(height, 150),  0.4 * pixHeight)
  ctx.fillText(spawnLength.toString(), 1/2 * pixWidth + 1/5 * pixHeight - 1/2 * textWidth(spawnLength, 150),  0.6 * pixHeight)
  ctx.fillText(gameSpeed.toString(), 1/2 * pixWidth + 1/5 * pixHeight - 1/2 * textWidth(gameSpeed, 150),  0.8 * pixHeight)
  drawMinus(1/2 * pixWidth, 0.12 * pixHeight, 1/10 * pixHeight, 1/10 * pixHeight)
  drawMinus(1/2 * pixWidth, 0.32 * pixHeight, 1/10 * pixHeight, 1/10 * pixHeight)
  drawMinus(1/2 * pixWidth, 0.52 * pixHeight, 1/10 * pixHeight, 1/10 * pixHeight)
  drawMinus(1/2 * pixWidth, 0.72 * pixHeight, 1/10 * pixHeight, 1/10 * pixHeight)
  drawPlus(1/2 * pixWidth + 3/10 * pixHeight, 0.12 * pixHeight, 1/10 * pixHeight, 1/10 * pixHeight)
  drawPlus(1/2 * pixWidth + 3/10 * pixHeight, 0.32 * pixHeight, 1/10 * pixHeight, 1/10 * pixHeight)
  drawPlus(1/2 * pixWidth + 3/10 * pixHeight, 0.52 * pixHeight, 1/10 * pixHeight, 1/10 * pixHeight)
  drawPlus(1/2 * pixWidth + 3/10 * pixHeight, 0.72 * pixHeight, 1/10 * pixHeight, 1/10 * pixHeight)
  document.addEventListener('click', optionsClick)
}

const startGame = (snakes, players, food) => {
  if (snakes.length === 0) {
    drawMenu()
  } else {
    const movedSnakes = snakes.map((snake, i) => moveSnake(snake, players[i]))
    const deadSnakes = isDead(movedSnakes)
    const eatenFood = eatFood(movedSnakes, food)
    const newSnakes = growSnake(snakes, movedSnakes, eatenFood)
    const newFood = getFood(food, eatenFood, newSnakes)
    const survivingSnakes = newSnakes.filter((_, i) => !deadSnakes[i])
    const survivingPlayers = players.filter((_, i) => !deadSnakes[i])
    drawBackground()
    survivingSnakes.forEach((snake, i) => drawSnake(snake, survivingPlayers[i]))
    drawFood(newFood)
    usedInput()
    window.setTimeout(startGame, 1000/gameSpeed, survivingSnakes, survivingPlayers, newFood)
  }
}

// USERINPUT
let directions = [[null, null], [null, null], [null, null], [null, null]]

const keyDownHandler = (e) => {
  const player = keys.findIndex(controls => Object.values(controls).includes(e.key))
  if (player !== -1) {
    switch (e.key) {
      case keys[player].up:
        inputVector = [0, -1]
        break
      case keys[player].down:
        inputVector = [0, 1]
        break
      case keys[player].left:
        inputVector = [-1, 0]
        break
      case keys[player].right:
        inputVector = [1, 0]
    }
    if (directions[player][1]) {
      directions[player][0] = directions[player][1]
      directions[player][1] = inputVector
    } else if (directions[player][0]) {
      directions[player][1] = inputVector
    } else {
      directions[player][0] = inputVector
    }
  }
}

document.addEventListener("keydown", keyDownHandler, false);

// GAME
drawMenu()