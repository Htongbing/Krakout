class Krakout {
  constructor(ele, {height, colors, tip, tipNum} = {height: null, colors: null, tip: null, tipNum: null}) {
    this.ele = ele

    this.height = (typeof height == 'number' && height > 0) ? height : document.documentElement.clientHeight
    this.width = parseInt(this.height / 1.2)

    const barHeight = parseInt(this.height / 50)
    const barWidth = parseInt(this.height / 3.6)
    this.barAttrs = {
      x: barWidth,
      y: parseInt(this.height - 2 * barHeight),
      width: barWidth,
      height: barHeight,
      radius: parseInt(barHeight / 2),
      step: parseInt(this.height / 60)
    }
    this.bar = {}

    this.ballAttrs = {
      radius: barHeight,
      xAcceleration: parseInt(this.height / 100),
      yAcceleration: parseInt(this.height / 100)
    }
    this.ball = {}

    this.colors = Array.isArray(colors) ? colors : ['#33b5e5', '#0099cc', '#aa66cc', '#9933cc', '#99cc00', '#669900', '#ffbb33', '#ff8800', '#ff4444', '#cc0000']
    
    const BRICK_X = parseInt(this.height / 12)
    const BRICK_Y = BRICK_X
    const BRICK_COLUMN_NUM = 7
    const BRICK_ROW_NUM = 9
    const BRICK_WIDTH = parseInt((this.height / 1.2 - BRICK_X * 2) / BRICK_ROW_NUM)
    const BRICK_HEIGHT = parseInt(this.height / 30)
    this.brickAttrs = {
      x: BRICK_X,
      y: BRICK_Y,
      columnNum: BRICK_COLUMN_NUM,
      rowNum: BRICK_ROW_NUM,
      width: BRICK_WIDTH,
      height: BRICK_HEIGHT
    }

    let bricks = []
    let num = 0
    for (let i = 0; i < BRICK_COLUMN_NUM; i++) {
      let row = []
      for (let j = 0; j < BRICK_ROW_NUM; j++) {
        if ((i % 2 == 0 && j % 2 == 0) || (i % 2 != 0 && j % 2 != 0)) {
          let brick = {
            x: BRICK_X + BRICK_WIDTH * j,
            y: BRICK_Y + BRICK_HEIGHT * i,
            color: this.colors[Math.floor(Math.random() * this.colors.length)]
          }
          row.push(brick)
          num++
        }
      }
      bricks.push(row)
    }
    this.map = bricks
    this.bricksNum = num
    this.bricks = []
    this.score = 0

    this.tip = Array.isArray(tip) ? tip : ['暂无提示信息']
    this.tipNum = (typeof tipNum == 'number' && tipNum > 0) ? tipNum : 20

    this.stage = 0

    this.barRequestId = null
    this.renderRequestId = null

    this.tan = BRICK_HEIGHT / (Math.sqrt(2) * this.ballAttrs.radius) + 1
  }
  init() {
    const { ele, width, height, tip, tipNum } = this
    if (!ele) {
      return
    }
    ele.width = width
    ele.height = height
    
    const context = ele.getContext('2d')
    this.context = context
    context.clearRect(0, 0, width, height)

    const tipWidth = 0.75 * width
    const tipHeight = tipWidth / 2
    const x = (width - tipWidth) / 2
    const y = (height - tipHeight) / 2

    context.beginPath()
    context.fillStyle = '#222'
    context.lineJoin = 'round'
    context.fillRect(x, y, tipWidth, tipHeight)
    context.closePath()

    const tipLength = tip.length
    const fontSize = parseInt(tipWidth / tipNum)
    const tipX = x + tipWidth / 2
    const yInterval = (tipHeight - fontSize * tipLength) / (tipLength + 1)
    const tipY = y + yInterval
    context.beginPath()
    context.font = `${fontSize}px serif`
    context.fillStyle = 'rgb(255, 230, 0)'
    context.textBaseline = 'top'
    context.textAlign = 'center'
    tip.forEach((text, index) => {
      context.fillText(text.slice(0, tipNum), tipX, tipY + (yInterval + fontSize) * index)
    })
    context.closePath()

    this.stage = 0
    this.score = 0

    ele.setAttribute('tabindex', -1)
    ele.focus()
  }
  initGame() {
    const { bar, barAttrs, context, width, height, map } = this

    context.clearRect(0, 0, width, height)

    bar.x = barAttrs.x
    this.renderBar()

    this.initBall()

    this.bricks = JSON.parse(JSON.stringify(map))
    this.initMap()

    this.stage = 1
  }
  renderBar() {
    const { context, bar: {x}, barAttrs: {y, width, height} } = this
    context.beginPath()
    context.moveTo(x, y)
    context.lineTo(x + width, y)
    context.lineWidth = height
    context.strokeStyle = '#fff'
    context.lineCap="round";
    context.closePath()
    context.stroke()
  }
  initBall() {
    const { context, ballAttrs: {radius, yAcceleration: vy}, barAttrs: {y, width, radius: ballRadius}, bar: {x}} = this
    const ballX = parseInt(x + width / 2)
    const ballY = parseInt(y - ballRadius - radius)
    context.beginPath()
    context.arc(ballX, ballY, radius, 0, 2 * Math.PI)
    context.closePath()
    context.fillStyle = '#fff'
    context.fill()
    this.ball = {
      x: ballX,
      y: ballY,
      vx: 0,
      vy: -vy
    }
  }
  initMap() {
    const { context, brickAttrs: {width, height} } = this
    this.map.forEach(row => {
      row.forEach(brick => {
        const {x, y, color} = brick
        context.beginPath()
        context.fillStyle = color
        context.fillRect(x, y, width, height)
        context.closePath()
      })
    })
  }
  bind(eventType, callback) {
    this.ele.addEventListener(eventType, callback.bind(this))
    return this
  }
  moveBar(direction) {
    if (this.barRequestId != null) {
      return
    }
    this.startMoveBar(direction)
  }
  startMoveBar(direction) {
    const { bar, barAttrs: {radius, step, width: barWidth, y: barY}, bar: {x: barX}, width, stage, ball, ballAttrs: {radius: ballRadius, xAcceleration: vxA} } = this
    if (direction == 'left') {
      if (bar.x > radius) {
        if (bar.x - step < radius) {
          bar.x = radius
        } else {
          bar.x -= step
        }
      }
    } else if (direction == 'right') {
      const right = parseInt(width - barWidth - radius)
      if (bar.x < right) {
        if (bar.x + step > right) {
          bar.x = right
        } else {
          bar.x += step
        }
      }
    }
    if (stage == 1) {
      this.render()
    } else if (stage == 2) {
      const {x, vx, y} = ball
      if ((barX > radius) && (barX + barWidth < width - radius) && (x >= barX - radius) && (x <= barX + barWidth + radius)) {
        if (y == parseInt(barY - radius - ballRadius)) {
          if (direction == 'left') {
            ball.vx = vx - vxA
          } else if (direction == 'right') {
            ball.vx = vx + vxA
          }
        } else if (barY - radius < y) {
          if (direction == 'left') {
            ball.vx = vx - vxA
            ball.x = barX - radius - ballRadius
          } else if (direction == 'right') {
            ball.vx = vx + vxA
            ball.x = barX + barWidth + radius + ballRadius
          }
        }
      }
    }
    this.barRequestId = window.requestAnimationFrame(this.startMoveBar.bind(this, direction))
  }
  stopMoveBar() {
    if (this.barRequestId != null) {
      window.cancelAnimationFrame(this.barRequestId)
      this.barRequestId = null
    }
  }
  start() {
    this.stage = 2
    this.renderRequestId = window.requestAnimationFrame(this.render.bind(this))
  }
  render() {
    const { context, width, height, ballAttrs: {radius}, ball: {y}, score, bricksNum } = this
    if (this.stage == 1) {
      context.clearRect(0, y - radius, width, height - y + radius)
      this.renderBar()
      this.initBall()
      return
    }
    context.clearRect(0, 0, width, height)
    this.renderBar()
    this.renderBall()
    this.renderBrick()
    if (y - radius >= height) {
      this.fail()
      return
    }
    if (score == bricksNum * 100) {
      this.success()
      return
    }
    this.renderRequestId = window.requestAnimationFrame(this.render.bind(this))
  }
  renderBall() {
    let { context, ball: {x, y, vx, vy}, ballAttrs: {radius}, barAttrs: { radius: barRadius, y: barY, width: barWidth }, bar: {x: barX}, width } = this
    x += vx
    y += vy
    const barTop = parseInt(barY - barRadius - radius)
    if (x <= radius && vx <= 0) {
      x = radius
      this.ball.vx = -vx
    } else if (x >= width - radius && vx >= 0) {
      x = width - radius
      this.ball.vx = -vx
    }
    if (y <= radius && vy < 0) {
      y = radius
      this.ball.vy = -vy
    } else if (vy > 0) {
      if ((x >= barX) && (x <= barX + barWidth) && (y >= barTop) && y - vy < barTop + barRadius) {
        y = barTop
        this.ball.vy = -vy
      } else if (x > barX + barWidth && x <= barX + barWidth + barRadius && y >= barTop && y < barY) {
        if (vx > 0) {
          this.ball.vy = -vy
        }
        this.ball.vx = vx + parseInt(vy * 2 / 3)
      } else if (x < barX && x >= barX - barRadius && y >= barTop && y < barY && vx >= 0) {
        if (vx < 0) {
          this.ball.vy = -vy
        }
        this.ball.vx = -vx - parseInt(vy * 2 / 3)
      }
    }
    this.ball.x = x
    this.ball.y = y
    const ballX = parseInt(x)
    const ballY = parseInt(y)
    context.beginPath()
    context.arc(ballX, ballY, radius, 0, 2 * Math.PI)
    context.closePath()
    context.fillStyle = '#fff'
    context.fill()
  }
  renderBrick() {
    const { context, bricks, brickAttrs: {width, height}, ball: {x: ballX, y: ballY, vx, vy}, ballAttrs: {radius}, tan } = this
    for (let i = 0; i < bricks.length; i++) {
      for (let j = 0; j < bricks[i].length; j++) {
        const {x, y, color} = bricks[i][j]
        if (ballX + radius >= x && ballX - radius <= x + width && ballY - radius <= y + height && ballY + radius >= y) {
          this.score += 100
          bricks[i].splice(j--, 1)
          if (vx > 0 && ballX < x && (y + height / 2 - ballY) / (x - ballX) > -tan && ((y + height / 2 - ballY) / (x - ballX) < tan)) {
            this.ball.x = x - radius
            this.ball.vx = -vx
          } else if (vx < 0 && ballX > x + width && (y + height / 2 - ballY) / (x + width - ballX) < tan && (y + height / 2 - ballY) / (x + width - ballX) > -tan) {
            this.ball.x = x + width + radius
            this.ball.vx = -vx
          } else {
            if (vy < 0) {
              this.ball.y = y + height + radius
            } else {
              this.ball.y = y - radius
            }
            this.ball.vy = -vy
          }
          continue
        }
        context.beginPath()
        context.fillStyle = color
        context.fillRect(x, y, width, height)
        context.closePath()
      }
    }
  }
  fail() {
    console.log('fail')
    this.stage = 3
    const { context, width, height } = this
    const image = new Image()
    image.src = 'data:image/jpg;base64,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'
    image.addEventListener('load', () => {
      context.clearRect(0, 0, width, height)
      context.drawImage(image, 0, 0, width, height)
    })
  }
  success() {
    console.log('success')
    this.stage = 4
  }
}