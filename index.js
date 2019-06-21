window.addEventListener('load', () => {
  const isPhone = (() => {
    const phoneType = ['Android', 'iPhone', 'SymbianOS', 'Windows Phone', 'iPad', 'iPod']
    const agent = navigator.userAgent
    return phoneType.some(item => {
      return agent.includes(item)
    })
  })()
  const canvas = document.getElementById('canvas')
  if (isPhone) {
    const {clientWidth: winWidth, clientHeight: winHeight} = document.documentElement
    const game = new Krakout(canvas, {
      tip: ['左右滑动控制棒子，点击发射小球', '点击继续'],
      failAttrs: {
        tip: ['点击重置游戏']
      },
      successAttrs: {
        tip: ['点击重置游戏']
      },
      height: Math.min(winHeight, winWidth * 1.2)
    })
    game.init()
    let startX
    game.bind('click', function () {
      if (this.stage == 0) {
        this.initGame()
        return
      }
      if (this.stage == 1) {
        this.start()
        return
      }
      if (this.stage == 3 || this.stage == 4) {
        this.init()
      }
    }).bind('touchstart', function(e) {
      if (this.stage == 2) {
        startX = e.touches[0].pageX
      }
    }).bind('touchmove', function (e) {
      e.preventDefault()
      if (this.stage == 2) {
        const currentX = e.touches[0].pageX
        if (currentX != startX) {
          this.moveBar(currentX > startX ? 'right' : 'left', Math.abs(currentX - startX))
          startX = currentX
        }
      }
    })
  } else {
    const game = new Krakout(canvas, {
      tip: ['左右箭头控制棒子，空格发射小球', '按回车键继续'],
      failAttrs: {
        tip: ['按回车键重置游戏']
      },
      successAttrs: {
        tip: ['按回车键重置游戏']
      }
    })
    game.init()
    game.bind('keydown', function({keyCode}) {
      if ((keyCode == 37 || keyCode == 39) && (this.stage == 1 || this.stage == 2)) {
        this.moveBar(keyCode == 37 ? 'left' : 'right')
      }
    }).bind('keyup', function({keyCode}) {
      if (keyCode == 13) {
        if (this.stage == 0) {
          this.initGame()
          return
        }
        if (this.stage == 3 || this.stage == 4) {
          this.init()
          return
        }
      }
      if (keyCode == 32 && this.stage == 1) {
        this.start()
        return
      }
      if (this.stage == 1 || this.stage == 2) {
        this.stopMoveBar()
      }
    })
  }
})