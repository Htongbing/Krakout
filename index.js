window.addEventListener('load', () => {
  const game = new Krakout(document.getElementById('canvas'), {
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
      console.log('move')
      this.moveBar(keyCode == 37 ? 'left' : 'right')
    }
  }).bind('keyup', function({keyCode}) {
    if (keyCode == 13) {
      if (this.stage == 0) {
        console.log('init')
        this.initGame()
        return
      }
      if (this.stage == 3 || this.stage == 4) {
        console.log('reset')
        this.init()
        return
      }
    }
    if (keyCode == 32 && this.stage == 1) {
      console.log('start')
      this.start()
      return
    }
    if (this.stage == 1 || this.stage == 2) {
      console.log('stop move')
      this.stopMoveBar()
    }
  })
})