~(function () {
  const CANVAS_HEIGHT = document.documentElement.clientHeight
  const CANVAS_WIDTH = parseInt(CANVAS_HEIGHT / 1.2)

  const BAR_WIDTH = parseInt(CANVAS_WIDTH / 3)
  const BAR_HEIGHT = parseInt(CANVAS_HEIGHT / 50)
  const BAR_POSITION = parseInt(CANVAS_HEIGHT - 2 * BAR_HEIGHT)
  const BAR_RADIUS = parseInt(BAR_HEIGHT / 2)
  const BAR_RIGHT_POSITION = parseInt(CANVAS_WIDTH - BAR_WIDTH - BAR_RADIUS)
  const BAR_STEP = parseInt(CANVAS_WIDTH / 50)
  let BAR_X = parseInt((CANVAS_WIDTH - BAR_WIDTH) / 2)
  let barRequestId = null

  const BALL_RADIUS = BAR_HEIGHT
  const BALL_VX = 0
  const BALL_VY = parseInt(CANVAS_HEIGHT / 100)
  const BALL_ADD_V = parseInt(CANVAS_HEIGHT / 100)
  let ballMoveAttr = {}

  const BRICK_X = parseInt(CANVAS_WIDTH / 10)
  const BRICK_Y = BRICK_X
  const BRICK_ROW_NUM = 9
  const BRICK_COLUMN_NUM = 7
  const BRICK_WIDTH = parseInt((CANVAS_WIDTH - BRICK_X * 2) / BRICK_ROW_NUM)
  const BRICK_HEIGHT = parseInt(CANVAS_HEIGHT / 30)
  const COLORS = ['#33b5e5', '#0099cc', '#aa66cc', '#9933cc', '#99cc00', '#669900', '#ffbb33', '#ff8800', '#ff4444', '#cc0000']
  let bricks = []
  for (let i = 0; i < BRICK_COLUMN_NUM; i++) {
    let row = []
    for (let j = 0; j < BRICK_ROW_NUM; j++) {
      let value = 1
      if ((i % 2 == 0 && j % 2 != 0) || (i % 2 != 0 && j % 2 == 0)) {
        value = 0
      }
      let brick = {
        x: BRICK_X + BRICK_WIDTH * j,
        y: BRICK_Y + BRICK_HEIGHT * i,
        color: COLORS[Math.floor(Math.random() * 10)],
        value
      }
      row.push(brick)
    }
    bricks.push(row)
  }

  const TAN = BRICK_HEIGHT / (Math.sqrt(2) * BALL_RADIUS) + 1

  let startRequestId = null

  const canvas = document.getElementById('canvas')
  const context = canvas.getContext('2d')

  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT

  const renderBar = () => {
    context.beginPath()
    context.moveTo(BAR_X, BAR_POSITION)
    context.lineTo(BAR_X + BAR_WIDTH, BAR_POSITION)
    context.lineWidth = BAR_HEIGHT
    context.strokeStyle = '#fff'
    context.lineCap="round";
    context.stroke()
  }

  const initBall = () => {
    const ballX = parseInt(BAR_X + (BAR_WIDTH - BALL_RADIUS * 2) / 2 + BALL_RADIUS)
    const ballY = parseInt(BAR_POSITION - BAR_RADIUS - BALL_RADIUS)
    context.beginPath()
    context.arc(ballX, ballY, BALL_RADIUS, 0, 2 * Math.PI)
    context.closePath()
    context.fillStyle = '#fff'
    context.fill()
    ballMoveAttr = {
      x: ballX,
      y: ballY,
      vx: -BALL_VX,
      vy: -BALL_VY
    }
  }
  const renderBall = () => {
    let {x, y, vx, vy} = ballMoveAttr
    x += vx
    y += vy
    const barY = parseInt(BAR_POSITION - BAR_RADIUS - BALL_RADIUS)
    if (x <= BALL_RADIUS && vx <= 0) {
      x = BALL_RADIUS
      ballMoveAttr.vx = -vx
    } else if (x >= CANVAS_WIDTH - BALL_RADIUS && vx >= 0) {
      x = CANVAS_WIDTH - BALL_RADIUS
      ballMoveAttr.vx = -vx
    }
    if (y <= BALL_RADIUS && vy < 0) {
      y = BALL_RADIUS
      ballMoveAttr.vy = -vy
    } else if (vy > 0) {
      if ((x >= BAR_X) && (x <= BAR_X + BAR_WIDTH) && (y >= barY) && y - vy < barY + BAR_RADIUS) {
        y = barY
        ballMoveAttr.vy = -vy
      } else if (x > BAR_X + BAR_WIDTH && x <= BAR_X + BAR_WIDTH + BAR_RADIUS && y >= barY && y < BAR_POSITION) {
        ballMoveAttr.vx = vx + parseInt(vy * 2 / 3)
        if (vx > 0) {
          ballMoveAttr.vy = -vy
        }
      } else if (x < BAR_X && x >= BAR_X - BAR_RADIUS && y >= barY && y < BAR_POSITION && vx >= 0) {
        ballMoveAttr.vx = -vx - parseInt(vy * 2 / 3)
        if (vx < 0) {
          ballMoveAttr.vy = -vy
        }
      }
    }
    ballMoveAttr.x = x
    ballMoveAttr.y = y
    const ballX = parseInt(x)
    const ballY = parseInt(y)
    context.beginPath()
    context.arc(ballX, ballY, BALL_RADIUS, 0, 2 * Math.PI)
    context.closePath()
    context.fillStyle = '#fff'
    context.fill()
  }

  const renderBrick = () => {
    const {x: ballX, y: ballY, vx, vy} = ballMoveAttr
    bricks.forEach(row => {
      row.forEach(brick => {
        if (brick.value) {
          const {x, y, color} = brick
          if (ballX + BALL_RADIUS >= x && ballX - BALL_RADIUS <= x + BRICK_WIDTH && ballY - BALL_RADIUS <= y + BRICK_HEIGHT && ballY + BALL_RADIUS >= y) {
            brick.value = 0
            if (vx > 0 && ballX < x && (y + BRICK_HEIGHT / 2 - ballY) / (x - ballX) > -TAN && ((y + BRICK_HEIGHT / 2 - ballY) / (x - ballX) < TAN)) {
              ballMoveAttr.x = x - BALL_RADIUS
              ballMoveAttr.vx = -vx
            } else if (vx < 0 && ballX > x + BRICK_WIDTH && (y + BRICK_HEIGHT / 2 - ballY) / (x + BRICK_WIDTH - ballX) < TAN && (y + BRICK_HEIGHT / 2 - ballY) / (x + BRICK_WIDTH - ballX) > -TAN) {
              ballMoveAttr.x = x + BRICK_WIDTH + BALL_RADIUS
              ballMoveAttr.vx = -vx
            } else {
              if (vy < 0) {
                ballMoveAttr.y = y + BRICK_HEIGHT + BALL_RADIUS
              } else {
                ballMoveAttr.y = y - BALL_RADIUS
              }
              ballMoveAttr.vy = -vy
            }
            return
          }
          context.beginPath()
          context.moveTo(x, y)
          context.lineTo(x + BRICK_WIDTH, y)
          context.lineTo(x + BRICK_WIDTH, y + BRICK_HEIGHT)
          context.lineTo(x, y + BRICK_HEIGHT)
          context.closePath()
          context.fillStyle = color
          context.fill()
        }
      })
    })
  }

  const init = () => {
    renderBar()
    initBall()
    renderBrick()
  }
  init()

  const render = () => {
    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    renderBar()
    startRequestId ? renderBall() : initBall()
    renderBrick()
  }
  const computedBarPosition = (keyCode) => {
    if (keyCode == 37) {
      if (BAR_X > BAR_RADIUS) {
        if (BAR_X - BAR_STEP < BAR_RADIUS) {
          BAR_X = BAR_RADIUS
        } else {
          BAR_X -= BAR_STEP
        }
      }
    } else if (keyCode == 39) {
      if (BAR_X < BAR_RIGHT_POSITION) {
        if (BAR_X + BAR_STEP > BAR_RIGHT_POSITION) {
          BAR_X = BAR_RIGHT_POSITION
        } else {
          BAR_X += BAR_STEP
        }
      }
    }
    if (startRequestId != null) {
      const {x, vx, y} = ballMoveAttr
      if ((BAR_X > BAR_RADIUS) && (BAR_X + BAR_WIDTH < CANVAS_WIDTH -BAR_RADIUS) && (x >= BAR_X - BAR_RADIUS) && (x <= BAR_X + BAR_WIDTH + BAR_RADIUS)) {
        if (y == parseInt(BAR_POSITION - BAR_RADIUS - BALL_RADIUS)) {
          if (keyCode == 37) {
            ballMoveAttr.vx = vx - BALL_ADD_V
          } else if (keyCode == 39) {
            ballMoveAttr.vx = vx + BALL_ADD_V
          }
        } else if (BAR_POSITION - BAR_RADIUS < y) {
          if (keyCode == 37) {
            ballMoveAttr.vx = vx - BALL_ADD_V
            ballMoveAttr.x = BAR_X - BAR_RADIUS - BALL_RADIUS
          } else if (keyCode == 39) {
            ballMoveAttr.vx = vx + BALL_ADD_V
            ballMoveAttr.x = BAR_X + BAR_WIDTH + BAR_RADIUS + BALL_RADIUS
          }
        }
      }
    } else {
      render()
    }
    barRequestId = window.requestAnimationFrame(computedBarPosition.bind(null, keyCode))
  }

  const startGame = () => {
    render()
    if (ballMoveAttr.y > CANVAS_HEIGHT + BALL_RADIUS + ballMoveAttr.vy) {
      window.cancelAnimationFrame(startRequestId)
      startRequestId = null
      alert('Game Over!')
      init()
      return
    }
    startRequestId = window.requestAnimationFrame(startGame)
  }

  window.addEventListener('keydown', ({keyCode}) => {
    if ((keyCode == 37 || keyCode == 39) && barRequestId == null) {
      barRequestId = window.requestAnimationFrame(computedBarPosition.bind(null, keyCode))
      return
    }
    if (keyCode == 32 && startRequestId == null) {
      startRequestId = window.requestAnimationFrame(startGame)
      console.log('start')
    }
  })

  window.addEventListener('keyup', () => {
    window.cancelAnimationFrame(barRequestId)
    barRequestId = null
  })
})()