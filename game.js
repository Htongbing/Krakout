class Krakout {
  constructor(ele, {height, colors, tip, tipNum, failAttrs, successAttrs} = {height: null, colors: null, tip: null, tipNum: null, failAttrs: null, successAttrs: null}) {
    this.ele = ele

    this.ele && ele.setAttribute('tabindex', -1)

    this.height = (typeof height == 'number' && height > 0) ? height : document.documentElement.clientHeight
    this.width = this.height / 1.2

    const barHeight = this.height / 50
    const barWidth = this.height / 3.6
    this.barAttrs = {
      x: barWidth,
      y: this.height - 2 * barHeight,
      width: barWidth,
      height: barHeight,
      radius: barHeight / 2,
      step: this.height / 60
    }
    this.bar = {}

    this.ballAttrs = {
      radius: barHeight,
      xAcceleration: this.height / 100,
      yAcceleration: this.height / 100
    }
    this.ball = {}

    this.colors = Array.isArray(colors) ? colors : ['#33b5e5', '#0099cc', '#aa66cc', '#9933cc', '#99cc00', '#669900', '#ffbb33', '#ff8800', '#ff4444', '#cc0000']
    
    const BRICK_X = this.height / 12
    const BRICK_Y = BRICK_X
    const BRICK_COLUMN_NUM = 7
    const BRICK_ROW_NUM = 9
    const BRICK_WIDTH = (this.height / 1.2 - BRICK_X * 2) / BRICK_ROW_NUM
    const BRICK_HEIGHT = this.height / 30
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
    this.time = 0

    this.tip = Array.isArray(tip) ? tip : ['暂无提示信息']
    this.tipNum = (typeof tipNum == 'number' && tipNum > 0) ? tipNum : 20

    this.stage = 0

    this.barRequestId = null
    this.renderRequestId = null

    this.tan = BRICK_HEIGHT / (Math.sqrt(2) * this.ballAttrs.radius) + 1

    const failImage = new Image()
    failAttrs = (failAttrs && typeof failAttrs == 'object') ? failAttrs : {}
    this.failAttrs = Object.assign({
      tip: ['游戏失败'],
      imgSrc: 'data:image/jpg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCAD4ASoDASIAAhEBAxEB/8QAHAAAAQUBAQEAAAAAAAAAAAAAAAEEBQYHAwII/8QAUBAAAQMDAgIEBw0GAwYEBwAAAQIDBAAFEQYSITEHE0FRFBUWImFxkRcyNDVCUlZzdIGTsbIjVFWSocEk0eElRFNicuImMzfwNjhDgoSU8f/EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAFREBAQAAAAAAAAAAAAAAAAAAABH/2gAMAwEAAhEDEQA/ANiHMVk8jUd7TLfSm6SAlLqgBu5DJrWBzFYtK+GyPrl/qNA+8pb7/FZH81HlLff4rI/mqMooJPylvv8AFZH81IdS33+KyP5qjaDjHE4oH51Lfuy6yP5v9KReq7400Sq6yP5qi1OhvKjyA51U73f9+5lkqBzzoJK89ImpEulMe+y0YOPNWP8AKor3RNYfSKd+JVcWtS1FSjkmkAoLJ7omsPpDO/EpPdE1h9IZ34lV3aSOFeaCye6JrD6QzvxKPdE1h9IZ34lVuigsnuiaw+kM78Sj3RNYfSGd+JVbxRQWT3RNYfSGd+JR7omsPpDO/Eqt0UFk90TWH0hnfiUo6RNYfSKd+JVaxRyoLL7omsPpDO/Eo90TWH0hnfiVW80maCy+6JrD6QzvxKD0iaw+kM78Sq1mg0Fk90TWH0hnfiUe6JrD6QzvxKrdFBZPdE1h9IZ34ldG+kXV6VBStQzSAeI6z/SqvQOPCg1m0a2v0yMlRu0hSu3Kqkzqm+/xKR/NWZ6bufgzwbcJxmruy+h5sLRxBoJUanvquHjOQP8A7qXylvv8VkfzVFF1Ixnhk0u5O7AOaCU8pb7/ABWR/NR5S33+KyP5qjKKCT8pb7/FZH81OLdqG9O3SG25c5CkLkISpJVwIKhkVCU6tfxzA+0t/qFBsh5mig8zRQA5isWlfDZH1y/1GtpHMVi0r4bI+uX+o0HKiigZyMDJ7BQGR31zdWlKCVcqnbFHtsrrIMlAbdXxBPfTeZpa6PLcERSVbcgZVgYoM+vF2kK3ssbtnaQKq6lKUsqUSVVsmjtJXiE7LiXSNHXGlBQzvGQrsqtT+jC+mdJXGZbWwlRCMKoKBw2HvNPI1rlvxHJLLRW22Bv9FSF203PsUpqJKbQt1wcAg5IPdV101p+5t6HurBiPb3AkoQU++58qDMCgkZCSCeGBS+DP/wDCV/Kasum7a9E1hAYmRyhYcT+zeHprQ9RX29Qb1IiQLCy80g7krDfOgxRbS0e/QpPrGK81quv3HJeiIEyZb0RJTjqtyUpxjlWY9UcnkrhnNBzbZW4cJBJ7gKQoUFlG07h2YrR9C29m22WTqeakBtKChrI7a6dHFo8e6ofuzrQWynOdw4ZoMyIIOCCD6aK1nUnRheLrdH5cRDKW1HgkHHCq1P6L9Q2+GZb7aOrT3K40FMpQkqPDjU5Y2rc1cym8NLWynuNaNptWlJpuL1utKFKgsdYhbnPPHh/Sgx1TS0DKkkesV5wav6Ls3re9wrVIitx2VOEKU2MK5HlUhNs2g7fMVFlypaXGT1Z2+igzDBoq86x0/ZrVYbdcLS66tqYV7SscSMDnURp1qxqmLF6KkMhGEqR86grtFaSpPR1HZVhb7yj2VJ3dvSOnLRb5ibMZHhKeZP8ApQZL1a8Z2Kx6q8jgc1e7hr2GqEuDCtDLTahgKIGRVM81aieeTk45Cg8Nh1J6xAIA7cVZ9N3ZYKWXFE44U90zq23Wy3qtN1tzbzLvDrUjimmybCm7ahWnS5U42lWUqdOAaC0toXIBU2jdgZxXhCRxLg24q06N09donXi5JaKlMKSAFAgGmS9I3JtCn/2JQUk4zQQ9FCQWsg8xwooCnVr+OYH2lv8AUKa06tfxzA+0t/qFBsh5mig8zRQA5isWlfDZH1y/1GtpHMVi0r4bI+uX+o0HKkJwMg4x291LSLO1BUeygm7fp9c9hqQie2hwnjx86uM6RHt70iJdX3WuSeuQrHOmtsKhd2wNww+jgDwwcU26TUuruclDLJdUSBsxkGgjLxpO/wAZ9uVaLg9PjOkdWtt0kjPfT6/zntKaOatLkpxVyfWFrc3klFSnR2w/pe3OTr3JXGjOjCWnTyzyxUB0gabemZvltfXNiuHJI44oKQu4zTMbfVILryDncTmtN0xqu+zNHXSQFuuPMBIZIA83nnHCsqjNtKktofUW0k4Wr5ora9JSLFpvSUyRClJmpQEqdHtoIDSEhct+bfdRsOvyoSdzSduCasdz1c9co9qlQQqMHncLStA3K9HKmdg1Si5TrjMZsrj8V1ISAgDB41KTbfKv7cUx7WuC1Bc3oCgMrPcKDhO1JZ9QXzxBc4Lu9GQCU9tZpG043ctcu25hxLEdLvnEnkkVrzk//Hh8aXdMlCTudUE5z7axS+yZUHU0uStC463lHKe0eyg1LVkGG9oJiz2t1Aa67aV+mvKA3pbTke2QnAqUrBdUjt76gbKwqV0Wg7lqc8JJCs8e2vDXXLbbBUUrSoDco9lBfbnb7nKahvwCVILeVDfg59PGoC7Wa9uW5aZCFdUef7Xl/WpTUJm9XAERTqUFriUZwarj7lzcYWl5UgNA++JOKCvW612uzSFyrlEVLa7AkmtD0i3YJlomzoNmdjtnKVNnmrhVYjtrkKSw2guZPvQK0S3IRboXUsqCXGkdatOO/s/pQZ3Z5mm3NY26FCta48hEhRKl884NUTWLm3V1yISPhK1f1NaVKsyF6+tV9jqSUvOEOIT8nzTWZ6zBVq6ckccvq/Ogsuq1k9GOmcKyRvOMcuAqC09cbRCcW5draqWlwcEg8jU5q4FPRppsEY4LI9IwKZWew6XlW1tydfxFkfKQScigkjqfQqAUjTbiSeZCqs+prrpaHYbQ5Jta3mnEZZTnmKqidMaJK/P1SnHrNWvVlj08/p+xIlXhLLEdopZcycLFBVjqTQave6ZdClnid3AVULkuK7c3lwmVMRTxUnIzirWNM6L3hKtTgDn21Aalt9mgPoFpufhqT77aTQWJGntNahtAdt8wRJTKMqDhHnGqrGg3RpTvgQkOBtRSVMJV/amlsiSZk9EaKFFxw4G3sq8W3Ut06PJDlqXGZkPlQK8qoJDo1TemnLgqaJRAjK6tLoV77I76eMvXhwKSpuSRxBHHFT7uuZEHSSr3LhNMOunDaM8Vj1VEROlCaUxi7bEsof8AlqTwoIte8ObHkFC6XaU8CQfVXa4TvDZHXLQEknsrkdp4p7aBKdWv45gfaW/1CmtOrX8cwPtLf6hQbIeZooPM0UAOYrFpXw2R9cv9RraRzFYlKQ74bJ87/wCsv9RoEry4nc2pPeKQIc7VkUvVqPDeeNBNWK1Sp09EgJDbaFpVuPbj/wDlWW9rTDclXBqCiW6pIxwzxFUxq5TY8fwdtagnlwr3FvNyhKCUSFEA5wRkUFK1Jdr5f5SjMjvx2W+TSUnFPNJ6in2Q+DGI/IgO8FoWgnFT941teoh65EaM4En5SBUIela/dYV+CwG+/DdBXdQgqu78lERTDKydiSMZqzafjFno4valNqStxCPfdvPlVZ1Bqq4ahfbXLDKNnFIaTwp5K13dX7KLWEsoZxglCcFXroJXSWn9SSEZjyZUG3hIU45xCcZ4mtJtmrGUInMxHRNYtzGeu+ceHGscc1pe3rUi3eEFDKeB2nHCuNp1LLtMaY20hChJG1S+8UGhXWTN1TbGrpYLmvwhacORUqxgjnWZXhFwTLWzclOJk596eRrjGuU21v8AXwpKmiofINPYkW4X2el94qUVZJWqg0nSrKmuitsrGCp84/rTJhBDqMHiSedOIVxdY0+1aur8xJyBjtpvhTSeuI4pVQXW93+bZ4lvDCG/PawdwzVfe1XdJMdbJ6kBfPAppdLt4zSwk8eqTgeio9SEpO4bs0E9pqbGgOuvvpClAcB3VJ6fmv3CRdXlKBQWzjP31UWysBXEZVzp/a7g7bmn0t7R1gwTQd9PrVJvsNpayNj6sew0ah6ObRPvT0ty8BhSnOIzyqOjPS4khMhopQrcSkjsoeflvvKcWoKUo5JPaaDj0lW1m2aOskSLI8Jba3J394wKzFZAJBGU5/tWnXNhy529EV5ZUhvO1PYCapE6wPR95aSSEnOKCLbivLVvSy9s7wnNX3pDBGkNMBWUrS0rck+oVGWjX1ytEHwVEJhYAxlSBUPf9Uz9Q9UJZTtZyEJHyc0EQ6pJdUQTjsrylO5QweNIT6x66EqIOAaDTtBWyParLK1TcCkFKSlpKu+orTdqla21l4Q8jcneVrUTwIFV17Uk960C1uOFUdPJHZXG16gutmUtVvlrjqWMKKe0UGn6z03fL7JRHjNtNxI+EtIKsA47amoWnlv6ZTDufg/WsDCA2QTWNydVX6aEh64vL2jA44x7Kn9JS7pElplpddXw45JP50FiUnqn+qWnlw416UeOMYxXmSt6S71vNXPOKQl044cfVQeqdWv45gfaW/1CmRDuOX9Kc2rrfHMDI4eEt9n/ADCg2g8zRQeZooCoo6atS1qUYwJUSTUrQnnQRY0zaU/7qk0eTdp/dE1LK7K80EYNO2oDHgqa4vabtafOEZOKma8rT1g2nlQV+RpqySmShcVsZ4Z7azTWHRUtnrJtqSFJHEoPOtjMRCVA8zmuUxfgkdx5ZHVgcjQfL0WyXF6eqKGVJcTz83lXCbaJsRZ65o8TzxX0Bpm1MSJ867LYSW5GUo4VKXPSNumLBVGR73u7aD5f84DaUkAV6bbW6ra2kkHsFb1K6L4jjm5EdOKWJ0Zw23goRkpGaDI7BpeTc5SEKZISVcq3LTmh7db4CC+yCrFS9q0xCtuFoaTvB7qlJRKY6lAcUjgKCFlWmxRGAXGUJINQc3xZIBahxkqzTK+3X9stcrIaTzqsr6QLXb3f8Ok7hwzQOLhZ7o0tS2oQSgcsVCO3mdblEPxQQPRTpzpKuFwkJjRxkL4DhXm/aV1FLhpljkoZoHFr1nay+lMuGkZNX+M/pqXG60MN5IwAK+eX2ZEOUG5YKVA1YbPMnrWlqMtRBV30GwJatD+EJjoAB7acqj2KM2C7HQKr9vgzWYgceB3HjVW1jqNyMksZINBOaq1DaLehSIbCdwqjJ1gmSSgxBhRxyqtPyJM94ZcJ3ngM1ods6N5C7ImcEjO3cKBqxo1q8IS6P2ZWM4BrnP6MZLYJaR7Ca4Wu93SBfRBXnYg4rcrIrw2HvcSDwHOg+dndEXRCynqScd9Q061yLa7skoKK+r1W6KeKmEHt5VmvS7puMYjE5lpKEpxvxQYiRuwE5IPdXdi3SJC9qGz99bppvozsrlpYkuoSpbicip2BoG1xyFBlHsoMg0voh+VKaL7QKDzraLVou1QY6R1AyU1LRLTFgpHVNJBHop7ntPKgixpu0jlFTSnTdp/dRUnRQRfk3af3UV7Rp+1tOIcRGAUhQUD6RUjRQFFFFAUqeVJTLxxEQSkq4g4NA97TRTHxxE+caPHET5xoH1FMvG8P55o8bxOxVA7WAU7T8rhVD6QLuptpm2xCS88rqyB3GrbIvEVLJIVxFZ23OjXzpDS+TiPHGOHHzqDQbBbzb7KxHV74IGfXUoRxz6Kj03eIlXv+XCvfjeJz3mge0Uy8bw/nmkVeYaeajQPqRQBSQe2mCb3DVyXXQXWJjO+giLvpRq6kk4Garr/RLBdBJ2ZPHlV58bxPn4pBdopVneeFBlrWjIWm7oiQ7jak8KsMvpDtjLXgwTuwMcqmL9HgXhASXdhByagGdJWhLu9biV476Cmv2RrUNyXKjsEJWrtFaTp3RUK3x2nFNp3jjyp7bmrTAG1oJx6hUn42iION/soO7sRlbWzYAOXKs41vopqWovJA41oHjiIeG/hTWbOhyU7SRQYWjTqbbMSst5CDnlV/hasD0VuEygpKU4PCrII1nWrLoST91IxbbCy5vSOPPkKDna9JQHx4e82lTiuPKrPHYRGTtbximzNxgtJCULISByr34yifPNA8wQTntFVzXUFczTUhDYytLZIFS/jaIjgVk01uN4hmE/x3eYRg0EL0azVS9LIZcPntLINXEcqy/ozuSI7lwYUrzEOlQzWhJu0TaPPoH1FMvG0XsXR42jfOFA9opn41jfPHtpDdoo5rFA9opj43i/PFKm6xVrSgLGVEAUD2iiigBzFZg/LeEp4buTivzNaeOYrKn/hT/wBar8zQe/C3vnUnhj2PfVypDyoOvhr/AM6uapkkqOF/1rxXGQUoSVqXtHbQJPur0eA88VbglPIGoPRvWKTIe4jrVFe/091ROo9Qp2uQ2CFBXMip7SSS3YWz2qoLCmY/gZV2V6M1/sVTelTzoO3hr/ea5OTZK++g8q80HlMl8HJ3V3E97bjJFcsZpNtB18OkfOrz4dIB4rx99clebXnrAVjJHCg6mbIKue6kcnuNjiQPvpjOuTcXtBJ4VGeFvzFeak4oLE1cVnkon767ic6rkqo6CgobIWRmnKQRniOdA4VLdUnG/nXLwl4fKPtrzgnhkV5ISOaqCNnXKW1MGNxTmpRi4uuoTtznFNJDDbgJ3p9tM2nlRneKgU8hQT4mSBwJNePDJPzzTBiZ1ztOqDr4ZIzxUa5vSX3EKSScEcaSlSQFAkZoK5p2UqJd5kdIIKznFWYTl4xuPtqiicIurlE+aFHFXFsoUkKByDQO0zHVHAUfbXrwl35x9tcEgdleqD34U984+2lEp3tUfbXOig6+FOd59td7fKWbnEGTxfQOf/MKZHlXa3fGkP7Qj9QoNTPM0UHmaKAHMVlUj4U/9ar8zWqjmKyqR8Kf+tV+ZoPFeVcEn1V6pDyOKBs5I6tWVcABxqn6i1KFKcjMq7OYqz3QHwR1auxJ5Vkz6yX1nOfONB1j7XZKd/EqPHNapY20M21lvHAjzayVtexYV2itP0zLTLtbODlbfOgnccePOjFG8KOaWgSjApaKBBwoPKlpDyoGcl4oFQMyctpwqCjxqwSWN4qAmxAVEKHbwoI1LUmdJ3FRKOdWqFGSwyMJwcVwt8dtDCcDjipNKcJ5GgiZ7UtpBdaJwOyq87qqey6ULZUABzxV2UlB4FRIqPuMKHtKi0CMd3GgrUbWSyvzzgjvof1g464ENIyT3CuidNx5S1LQjGTUhA0lHZdS4tIwKDlCVNnt9YSobhkCuLzj7bnVqzkGrYzHajbQ0kBIFNptvQ6vrQBxoG1sRkbiOOKlqbxGko4DhinFAoGaXHPHOkBxXraSDjnQZVqJ1xq+qWFYKTwNWnSt78NQmO+5uWkYFVXVI/2uvPPNNbPKXDuDS0qwCeNBraQUnBNe8nvprDlIksIWFZO2nGRjPOg9ZPfRk99JQTigXJrvbvjSH9oR+oU23CnFuP8AtWH9oR+oUGqHmaKDzNFADmKyqR8Kf+tV+ZrVRzFZVI+FP/Wq/M0HikpaE++FBHXX4uf/AOk1kTv/AJy/+o1rtx+L3vq1VkK/fq9dAqMbvO7qtei7mmPJ8FWffcqqacZ412jyFxZAeb5ig2UejlXSq1p3UDc+OGnVYUE9tTzawoYByBQd6K8pr1QFIeVLSK5UCKRuTUXLjhRUe6pOmkk8DQQrtwVEIANevKpLKcKpHIYedG4ZGad+JoQbBcQOXdQNE6pZUknbXPyiiyF/tDgcsVIIsEBafNArydNRjxwBQK3d4LTRWjGRXNWrIaTtUcUK00yobc4BqOmaNDj6S2rgPTQSLWo477mEq4HlUsiU280NpqHhabajlO5OSOdSpaajoSEDB5UHVKSOIrrXJs5FdaAr0tW1tau4VzWQCMc6itQXdq2RFgqytSeGKDPtQudZeHD6ajkq2ZxzHKvUh4yZK3T2muXbQW3S97KVpjvrPLhV9bKcJKTkEVjkJ/weW253GtctclEq2tuJ7E0DmvJ50teVc6sC04t3xrD+0I/UKa05t3xrD+0I/UKg1Y8zRQeZooAcxWVSPhT/ANar8zWqjmKyqR8Kf+tV+ZoPFCffCihPvhQRtx+L3fq1f3rIl+/V66124/F7v1av71kS/fq9dAlG499FFA4iynIjgdbURjszWhafv0aSylDiwlwgdtZrXtp5bLgW2ogig2w4AyDkGk3pPKqDY9YrZIalcQcAEmrrDltzEb28Eeg0DoZ7aCM0gPDKuFLkYzmgTFMpQ4mn2R302kDPKgZJO1QwKduHrUAYxTRwEYOKdxBvFBHOiTGcynOBSovzSFBMgbT66merQoELwarOoLIqQC4yccMcKCbF6gYBCgQe3NeVXuCgEhzjWbLt89pWzrVHjyrqxap78lCdysHmaDQo91TKXtQOHfXp3K1YKj7K4Wi1qhRUlSwVBNSKWd6AVYzQc2cJHOu6fOPDlXNaW2Rla0p9ZxUHddQxoyVBpQJ9BoJG63GPBjLW4sBWOGDWY3a5OXCSVKUSkHhxoulzenukqUrb3E0xUoEAAYxQJ6qTNLmkoFTxz6q0nRDinbWpKj70VmorRNCE+LnPVQWjspCM0uD3UVR5205tyf8AasP7Qj9QrhTi3fGkP7Qj9QoNUPM0UHmaKgBzFZVI+FP/AFqvzNaqOYrKpHwp/wCtV+ZoPFCffCigHBzQRtx+L3fq1f3rIl+/V66164j/AAD5zgBJArI3Rh1YHLcaDxRRiigKKKKAHOpW336Xb1DqlkozyJqKpeNBf4mt2XdqJCQlVTMe9QZBGx5IJ7M1k5J5V6bcWhQKVEEdxoNlaeQ5jYpKvvr0U7jWYW/UsqDgA5x31Ms68fGN7ST91BdSwO0ZzXtLQbGQcVUTr5OBloCmkvXTix+zT/SgvKVlXdQ41vTg4rO0azlp+RXQ62llPvRQXB21MFe8lIxXEIjRFZ3p9tUt/Vs51JGMA1Gv3aXJ5rNBoT+pIkZJBUk7fTURJ16OKGGhw7ao6lFR89aiaTzccz7KCXuOo5k9R/aFA9BqJccWs+csqpPN7zSDI7P6UCGilOT2UmPQaAoox6DRj0GgB21o2hPi1z1VnQGM57q0XQYJtbnfigtNIedKOVLgHjQeKcW/40h/aEfqFcDzrvbvjWH9oR+oUGpnmaKDzNFADmKyuQD4U/8AWq/M1qg5isqkK/xT/wBar8zQeCMUh5UZzS8+FAynNeERVtDPnDFUd7RcouqKVYBOcZrQ1IKfejNABx52Ae6gzkaJmE430vkPM/4grRSE9pApMI+eKDPPIab8+jyGmj5daFvR/wA3soDjY5hVBnvkLNxneK8+RUv/AIg9taIVJPLdXnYO6gz3yJl/8QUeRUrtWDWh7O7ApNh7waDPDoqX2EfzV6GiJpH+taDsHdXobcdtBnydDTTniB99KNCz+0j21oKSkH5VLvT/AM1Bnp0LN7D/AFryNCzvR7a0XrG/TXlS0k8N1Bnh0POHMjH/AFV58iZneP5q0TcnPI/fS7k9woM68iJ3o9tHkPP7x7a0ccRwSaRQPq9dBnPkPO7x7aXyIn/PHtrRMK+cKMK+cKDO/ImePlj20nkTP+ePbWijhzIpcjvFBnPkTP8Anj20eRM/549taNkeijI7xQZydFTRxJ3ejNWrS0B62sKZUnBIqbJwOGDQ0ghWdwFB7ORzpAoAGvSq50CniacW8HxpD+0I/UKbU4tyv9qw/tCP1Cg1M8zRQeZooAc6qLmiVOPOOdePPUVe05q3UmD3j2UFRGiCDxkgeipKHpmLFTh1kO+mpzHfj2Uv30Ed4ltpOBFT6a8KsFtUciLnPcKi9f6kc0zp1T8RYTNeUERgpG4KVnjw9VTdtkuu2ONLlgh5cdLjoAxhW3J4UDdWm7atO3wYJ9IFNHtH25zkkimWh9UzdUSbo+qOpNvbe2xHlI27hnik+kf3q3ed3igrw0bAwPfe2kOj7ekglKlffU+S4CO7try4HSM8OB78UEY1YLY0MGPn1118RWz91HsqC1LrZ2w3+NZotneuMmQz1qUtK87GT2Y9FNDrzUP0GuX9f8qCz+IrZ+6D2Uosdsz8EHsqr+XmovoLcv6/5U2ndJl4tkRcudo2dGYb9846ohI7uOKC4+JLZ+6D2UviK2/uo9lPIEnw23x5YTt69pLm3PLIBx/WofUutLTpRUcXPwj/ABAUUdU3u5Yzn20Ds2K3D/dR7KTxHbh/uoH3VV/dl0qTjbcP/wBb/Wq9p7pkSJ8031SzECj4MI8bzsZ4buPdQaT4itvMRAfupDYbcolPgwHDuqnzemXTxhveBpnCTsPVb43DPp41H6Z6ZYabavyiLy5fWq2mNG83Z2Z48+dBe4+mbc2slTO7j2048QWz91T7KgrN0oaev12YtkJM3r3yQkuMbU8Bnic1cMjuoIzxLbhw8HSAKRdmtpAzEGO6oPXWtUadZRBt6RJvMkgR46RuIz2kfl31ZLS7Mftkdy4MJYlKQC62hW4JVQRE/SsSQnLW1GOzlTLyJV/x0g1217q1jStkUttxIuDwxFbKd3H5xHcK8dH+pxqayl2RMQ/OQf26EtdX1fcMZ4jng9tByOh1KOUSE4pPIZz95TVx9ODRgdoFBTvIZf7yn7qBoZz94TRpjUlxuusL7a5ZbMeA9sYCW9pA9J7auOMdlBTjodwD4Qk02d0fOR7wpIqwaxucmy6RuNyhlKZEdregqTkZyOdNtCXmXqHTDNwnltb61qBKE7Rw5cKCHRpO4fKxXU6MkujKnUox2d9XbiKCAo5xyoKpG0WwlJDz24mnUfSUGO+26N25tYUOPaDmrDjuAFGTQFFFFAUUUUBRzFBJ7OdVnXOq2NLWRbhcX4bJSpuKlCcqK+/HLAoKXf7k1q/pVtdiLrngMJwk9WtJStxI3bh+R9Rqf6U7+5DtLVigZVOuiurCEoJIbzxIx28qoejLRJtPSRY0TkKRKkNuPuoV8kkKPZ7a1KTo62+Vx1ZOlurWygbG3FYbZIGNwoKtaujfV9mgiJbNZJix9xX1aGDzPOnvkbr/AOnqvwKnbxfIV30HdrjaJfXNpjupS43lOFAdnbTPRd6jWzowtd0u8wpaQ1lx9wlRyVkDPMmgrFkd1jH6TkWGVf3rgxFSl6VnCUlBHcRx4kVq4Pm5PA1WNLaWtdvuMvUUWc7PdufnpeWrO1B47R6OXOrRknI7aDLtbO3drpWtCrHHZkThBV1aHjhPys5PqqS8Y9Kn8EtX4v8A3V31Zo+/3PVUO+2K5RobsaP1KeuSScknPYew038Q9J/0qgfgf9tAvjHpV/glq/F/7qruu5mvXtJS0X22QI8AlPWOMuZUOPDAye2rD4h6T/pVA/A/7aZXjRPSDfba5brjqSA9GdxuT1RHI5HEJoNAsR/8P277K1+kU6cZacI6xtC8ctyQa5W6MuHbIsVZClsMobJHIkADP9KgNdXm82m1ttWK3OyZctzqkOpwUtE9vr7uygitd6za06tFts9tZm3Vwbur6rcG095A5n0VE6fn6P0x4Rc3RcUuyk7pHXwllttROTjzeAzUJp63vv7r7Z7wqRqVgb5kGUlKcjtSCrkPTUve7xM6Q7hH05ZowTGZKHLjJ+QPnIB7Rnh3/dQPbrre2G+C3TIqW7LPh7mJKIp6xxSgOA4V603fdE6Yty4MVU55tbqnCp+EpSgT2Z28qkNe6JF007FTaGAmVa8GOncQdg5pHpOBxqET0jpn2dmDbrOnygeV1Co5a4MkfL49n+XGguNh1Tp++z3ItsH+IYR1iwuMWyE5x2ivWsr5MsFgVKt0ByZKcWG2kISVYUc8SB2Vy0dpNrTsLrngHLm+CZT+Sd5Jzj0AeirC44hppTji0pQjiVK4BI76DOLBZmNHRntYawlddNk7dy1IK1MKV2cP7VaNTa1tWl7WzMkEvOSAFMsIOFuA9voHpqiSLwz0g9J0W0olO+KIgU4lAA2uqRxJPeDy41apXRnapl4l3KRJfc65vYy0o7kx+GMpz+VBFaOtV01RfnNV39gpjJyLfGfGSgE++/8AfOveq9NXaxXlzVmmEoLhSkPwkNk9ae1XCozUnRwqwaZm3FnU92cVEZ3pbLmEnHIcOQrpp/o3cvOn4Vyc1VeGlyWUuFCXchOewUFy0prS2aogoW26mPLB2ORXFALSocwB2051Dqyz6XQ0u6yFsh0+btQVZ9lNGtCWaNf4t8jNFmYxnepPJ7zNvEch38O2p5+HGlBPhMdp8J5BxsKx7aDHNL65sFq1nf7nMlKbjzn9zCktKJUPSOyrHrrVEqXZLDM03dHYrdzlFtLyU4yDw4g9xprouDDc6RdUMuRGFttv+albSSlIyeQxwrv0tIMOJp4QYyCtuflplI2pJxwHDlk0EZq7S+soGlLhKuOsVTIrTWXWOqx1gyOGa4aI01q24abZkWrVht8YqUEsdVuwe05pzq7UOuJelLgxdNKMxIa28PPpeyUDI44zxptoi/azhaaaZs+mGp8QLUUvKd2kntGM0E9oKdfk6yvtmvF4cuPgDSAlShhOSeJArRBntrMOjeTOl9IWpn7nDEOYttsvMJVuCDnlmtQzQFJRRQFFFFAUUUUBUXeNOW2+yIT89pS1wXOsZwrAB9PfyqUooMxuPDp2tQHDDK/0mpPpXvPg1iRY2Bvk3VQb6vGT1eeJH34qMuf/AK72r6lf6TU3I0xcbj0nt3meCq2QmQYf7Qea5gZ83njnQd51lZ090XzraxtIZgL3LCdpWrbxUR3mm+ibaxduie3QJCEqbfjKSdydwBKjg49B41N6wB8jbwCP90c/KmHRn/6dWX6k/qNBDdGM922vTtHzELQ/blqUxvTgrbJ98fWSKuF+tLt5tpiMz5EBW8K65g4UMdn31AydJTE9I8fUUCQtpl1rbNyoHfjACAO7t+6rcopbQVKICUjJJ5CgzS/WRGnVwUztXX3M58MtdW4Vece/jwHGpj3Ppnbq68evrlf51StQquOvtSvXXT0dTrViCS2XQdshaVZOPT6Kv2ltf2m/28GY+1AnNqDb8Z9YSQv0Z5/25UFP0xaLjer3fYMjVN0aRbZAabPhBBUOPPj6Ks3kI9n/AOMrr6vCT/nVUsmjbbq3WGqDOelN+DzfM8Hc25yTz7+VWH3GtO5x4ZdT/wDkf6UEtaNHPW65MzTqW4zEtKJLTrxUhXDtGak7/qe16bih64vhsrBLbQGVuY7EjtrnpjScHSkV6PBdkuofWFqMhzcQQMcKkpsOHLS2qYy04GFh1BWM7FDkr7qDHZk5eqboubNbh6Xt8xkgTXWx1sjn71XDOeRHdUwIWjIsKLFtWtxbW2UbXDHkbS+r5ysdv9qk9Xaj0hMUiEba3qKc2nexGjp3jHbgjgMd1TEXQWkpEVh9zTcRpbiEqLak8UkjOOdBVOpsAGfdMlcOHws/51wu0DSqlxbha9asRLtFbKVSC7kyT2bz6e08eFLoLSlhuV+1QxNtcd9uHO2MJWng2nKuArrOc0BZrrKhXrSKYDDS9rElTClIkd+3FBN6V1XqRy4RrTfrI4C4k7bg2P2bvaDjsGO2pPWunLlqaJHgRbh4LDW4BLQE8Vo9f9u2pi1TrbcYbblsksvsoSEgtKCtgxwHo4dlP8ZFBjumbXFsvTUm3wkkMsRnEpycn3vMmrff9LXOVcJFxTrCVbYzik7Wkp81HIc89pquQP8A5gHcfu7v3+bXfVdye1vqlnR1onDwBI3XB1pJOCD73PLHL76Dlq7Rl3gaUuMt/V02Y00xuVHWjzXBkcDxr1prRd4maZt0tvWU2G06wlSWUJ81sdwOas2tobcHoyuUNncW2IXVpKjkkDA4nvppbtPNam6K7bbVvLZKorakOIPJQzjPeO8UD/TulblZJq5MzUsu5tqTgNvDAHp5mrPnHtrPtFapuUK7HR+pEnxg1kRnwM9ckDPE+rt+6pvVcjWTUiOnTEOG+0tCuuMhWFJV2Y40Fc0QpKeknVeSB/iOZPpNdOlt9plOnZDjgDbdxC1K9AAzUTaeii9z3HJWobspoynd8pllWVOY5HcOHfV0kdH9ol2e12t56Wpi2OdY1lwblnuUccRQQOudbafueirpCiT0OPvM7UJHbxFNOjrWVjs+kmYc+c20+lxRKDzweVTWv7Daoeg7u+xb2G3UM5SpCMEcRTPovs1sl6KZekwmnXC4sFak5OOFA20FOj3LpM1VNir6xh1DZQodozWlg9nOoOz6RtdkvU+6wQ4h2ekBxGfMSB80dlTYGM91AtJS5pKAooooCiiigKDyoooKjL0fLf6RoWpUyGRHjoUlTRzuOQRw7O2rJcoablbZENwqCXkFPmKKSPvFFFBmUHokvTzpbu2onFxFJIww6sqPrCuFaZaLbFs1sj22C2UR4yNiBnP50UUD0VX9Yadmakgsw49zdhNdYC+lsf8AmI7ePPPd2UUUD2wWONp2zs22JlSGhgrUAFLPecdtMb5obT1/X10u3I69IIS615ihk5zw5nPfRRQVpvobgMrWpq/XVtTity1IcAKj6e+ug6JI30kvH41FFA9s3RwxZbvHuSL5dJKmFEhp13KVZGONWO/WSNqC0u26S462lfELaWUqSe/h+XKiig5WTS9m06z1VrgNscSSvGVZIwTk8ag79ZNczru+5a9RR4lvcwEMKaypIxg8ceuiigkdJaQiaTgutMOOPSJKgqQ+4clZ/wDeamJ9th3OKuPOjNvtqSUkLSDwPA47qKKCF05oe16XusqZa1PNNyEBHgxVltGO0enhVl++iigpcfRkxnpMVqgyWDHU2tHVDO/iPZVhasluimauHHRHen5LrjYAUTjGaKKDPpPRtqW5vIj3PUwetgXgpTuC9g5Dlgn11o9sgx7XbWIEYEMRmw2jJ7BRRQe1Q4hmpmFhvwjbsDhSNwHrruFZVjlRRQe6KKKCH1ZaHr/pefamHEtuSm9iVK5DiD/amuidPyNM6dbtcp5t5xC1K3N5xg+uiigsORivNFFAUUUUBRRRQf/Z'
    }, failAttrs)
    failImage.src = this.failAttrs.imgSrc
    failImage.onload = () => {
      this.failAttrs.image = failImage
    }

    const successImage = new Image()
    successAttrs = (successAttrs && typeof successAttrs == 'object') ? successAttrs : {}
    this.successAttrs = Object.assign({
      tip: ['恭喜通关'],
      imgSrc: 'data:image/jpg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAA8AAD/4QMZaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjMtYzAxMSA2Ni4xNDU2NjEsIDIwMTIvMDIvMDYtMTQ6NTY6MjcgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjQ0MDNGMTg3OEM2RjExRTlBNEMzQ0VERTFENDk4RUUxIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjQ0MDNGMTg2OEM2RjExRTlBNEMzQ0VERTFENDk4RUUxIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDUzYgV2luZG93cyI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSI0Qzk0Qzc0MDcwQjhGODdEMjlFRDRERTUwN0EwQ0FFMSIgc3RSZWY6ZG9jdW1lbnRJRD0iNEM5NEM3NDA3MEI4Rjg3RDI5RUQ0REU1MDdBMENBRTEiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7/7gAOQWRvYmUAZMAAAAAB/9sAhAAGBAQEBQQGBQUGCQYFBgkLCAYGCAsMCgoLCgoMEAwMDAwMDBAM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'
    }, successAttrs)
    successImage.src = this.successAttrs.imgSrc
    successImage.onload = () => {
      this.successAttrs.image = successImage
    }
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
    this.time = 0

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
    const ballX = x + width / 2
    const ballY = y - ballRadius - radius
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
  moveBar(direction, num) {
    if (num != null) {
      this.startMoveBar(direction, num)
      return
    }
    if (this.barRequestId != null) {
      return
    }
    this.startMoveBar(direction)
  }
  startMoveBar(direction, num) {
    let { bar, barAttrs: {radius, step, width: barWidth, y: barY}, bar: {x: barX}, width, stage, ball, ballAttrs: {radius: ballRadius, xAcceleration: vxA}, brickAttrs: {width: brickWidth} } = this
    step = num ? num : step
    if (direction == 'left') {
      if (bar.x > radius) {
        if (bar.x - step < radius) {
          bar.x = radius
        } else {
          bar.x -= step
        }
      }
    } else if (direction == 'right') {
      const right = width - barWidth - radius
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
      if ((barX > radius) && (parseInt(barX + barWidth) < parseInt(width - radius)) && (x >= barX - radius) && (x <= barX + barWidth + radius)) {
        if (y >= barY - radius - ballRadius) {
          if (direction == 'left') {
            ball.vx = Math.max(vx - vxA, -brickWidth / 2)
          } else if (direction == 'right') {
            ball.vx = Math.min(vx + vxA, brickWidth / 2)
          }
        } else if (barY - radius < y) {
          if (direction == 'left') {
            ball.vx = Math.max(vx - vxA, -brickWidth / 2)
            ball.x = barX - radius - ballRadius
          } else if (direction == 'right') {
            ball.vx = Math.min(vx + vxA, brickWidth / 2)
            ball.x = barX + barWidth + radius + ballRadius
          }
        }
      }
    }
    if (num == null) {
      this.barRequestId = window.requestAnimationFrame(() => {
        this.startMoveBar(direction, num)
      })
    }
  }
  stopMoveBar() {
    if (this.barRequestId != null) {
      window.cancelAnimationFrame(this.barRequestId)
      this.barRequestId = null
    }
  }
  start() {
    this.stage = 2
    this.time = Date.now()
    this.renderRequestId = window.requestAnimationFrame(this.render.bind(this))
  }
  render() {
    const { context, width, height, ballAttrs: {radius}, ball: {y}, score, bricksNum } = this
    if (this.stage == 1) {
      context.clearRect(0, y - radius - 1, width, height - y + radius)
      this.renderBar()
      this.initBall()
      return
    }
    context.clearRect(0, 0, width, height)
    this.renderBar()
    this.renderBall()
    this.renderBrick()
    this.renderInfo()
    if (y - radius >= height) {
      this.fail()
      window.cancelAnimationFrame(this.renderRequestId)
      return
    }
    if (score >= bricksNum * 100) {
      this.success()
      window.cancelAnimationFrame(this.renderRequestId)
      return
    }
    this.renderRequestId = window.requestAnimationFrame(this.render.bind(this))
  }
  renderBall() {
    let { context, ball: {x, y, vx, vy}, ballAttrs: {radius}, barAttrs: { radius: barRadius, y: barY, width: barWidth }, bar: {x: barX}, width } = this
    x += vx
    y += vy
    const barTop = barY - barRadius - radius
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
      } else if (x > barX + barWidth && x - radius <= barX + barWidth + barRadius && y >= barTop && y < barY) {
        if (vx >= 0) {
          this.ball.vy = -vy
          this.ball.vx += vy * 2 / 3
        } else {
          this.ball.vx = -vx - vy * 2 / 3
        }
      } else if (x < barX && x + radius >= barX - barRadius && y >= barTop && y < barY) {
        if (vx <= 0) {
          this.ball.vy = -vy
          this.ball.vx -= vy * 2 / 3
        } else {
          this.ball.vx = -vx + vy * 2 / 3
        }
      }
    }
    this.ball.x = x
    this.ball.y = y
    context.beginPath()
    context.arc(x, y, radius, 0, 2 * Math.PI)
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
          if (vx > 0 && (ballX - vx) < x && Math.abs((y + height / 2 - (ballY - vy)) / (x - (ballX - vx))) < tan) {
            this.ball.x = x - radius
            this.ball.vx = -vx
          } else if (vx < 0 && (ballX - vx) > x + width && Math.abs((y + height / 2 - (ballY - vy)) / (x + width - (ballX - vx))) < tan) {
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
  renderInfo() {
    const { context, height, width, brickAttrs: {height: brickHeight}, map, score, time } = this
    const interval = height / 20
    const fontSize = parseInt(width / 20)
    const top = map[map.length - 1][0].y + brickHeight + interval * 2
    context.beginPath()
    context.font = `${fontSize}px serif`
    context.fillStyle = 'rgba(255, 230, 0, 0.7)'
    context.textBaseline = 'top'
    context.textAlign = 'center'
    context.fillText(`得分：${score}`, width / 2, top + interval)
    context.fillText(`用时：${Math.max((Date.now() - time) / 1000, 0).toFixed(2)}秒`, width / 2, top + fontSize + 2 *interval)
    context.closePath()
  }
  fail() {
    this.stage = 3
    this.end()
  }
  success() {
    this.stage = 4
    this.end()
  }
  end() {
    this.stopMoveBar()
    const { context, width, height, score, time } = this
    const imageAttrs = this.stage == 3 ? this.failAttrs : this.successAttrs
    let { image, tip } = imageAttrs
    context.clearRect(0, 0, width, height)
    let initY = height
    const fontSize = parseInt(width / 20)
    const yInterval = fontSize
    if (image) {
      initY *= 3 / 2
      const wScale = image.width / width
      const hScale = image.height / height * 2
      let x = 0, y = 0, imgWidth, imgHeight
      if (wScale < hScale) {
        imgHeight = height / 2
        imgWidth = imgHeight / image.height * image.width
        x = (width - imgWidth) / 2
      } else {
        imgWidth = width
        imgHeight = imgWidth / image.width * image.height
        y = (height / 2 - imgHeight) / 2
      }
      context.drawImage(image, x, y, imgWidth, imgHeight)
    }
    tip = Array.isArray(tip) ? tip : ['游戏结束']
    tip = [...tip, `得分：${score}   用时：${Math.max((Date.now() - time) / 1000, 0).toFixed(2)}秒`]
    const tipY = (initY - tip.length * fontSize - yInterval * (tip.length - 1)) / 2
    context.beginPath()
    context.font = `${fontSize}px serif`
    context.fillStyle = 'rgb(255, 230, 0)'
    context.textBaseline = 'top'
    context.textAlign = 'center'
    tip.forEach((text, index) => {
      context.fillText(text.slice(0, 20), width / 2, tipY + (yInterval + fontSize) * index)
    })
    context.closePath()
  }
}