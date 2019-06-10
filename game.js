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
        }
      }
      bricks.push(row)
    }
    this.map = bricks
    this.bricks = []

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
    const { context, ballAttrs: {radius}, barAttrs: {y, width, radius: ballRadius}, bar: {x}} = this
    const ballX = parseInt(x + width / 2)
    const ballY = parseInt(y - ballRadius - radius)
    context.beginPath()
    context.arc(ballX, ballY, radius, 0, 2 * Math.PI)
    context.closePath()
    context.fillStyle = '#fff'
    context.fill()
    this.ball = {
      x: ballX,
      y: ballY
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
    const { bar, barAttrs: {radius, step, width: barWidth}, width } = this
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
    if (this.stage == 1) {
      this.render()
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
    const { context, width, height, ballAttrs: {radius}, ball: {y} } = this
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
    this.renderRequestId = window.requestAnimationFrame(this.render.bind(this))
  }
  renderBall() {}
  renderBrick() {
    const { context, bricks, brickAttrs: {width, height} } = this
    for (let i = 0; i < bricks.length; i++) {
      for (let j = 0; j < bricks[i].length; j++) {
        const {x, y, color} = bricks[i][j]
        context.beginPath()
        context.fillStyle = color
        context.fillRect(x, y, width, height)
        context.closePath()
      }
    }
  }
}