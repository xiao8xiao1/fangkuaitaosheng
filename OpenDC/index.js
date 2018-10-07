

let screenWidth = wx.getSystemInfoSync().screenWidth
let screenHeight = wx.getSystemInfoSync().screenHeight
let ratio = wx.getSystemInfoSync().pixelRatio

let sharedCanvas = wx.getSharedCanvas()
let sharedCtx = sharedCanvas.getContext('2d')

let itemCanvas = wx.createCanvas()
let itemCtx = itemCanvas.getContext('2d')

let myScore = undefined
let myInfo = {}
let myRank = undefined

let datas = []
function fakeData(count){
    var item = new Object()
    myInfo.avatarUrl = 'images/suc.png'
    myInfo.nickName = '宏伟'+'(我)'
    myInfo.score = 100
    myRank = 8848
    for (var i = 0; i < count;  ++i){
        var item = new Object()
        item.avatarUrl = 'images/suc.png'
        if (i === 1)  item.avatarUrl = 'images/suc1.png'
        item.nickname = '宏伟'+i
        item.score = ''+i
        datas.push(item)
    }
}
getUserInfo()
initFrame()
// 初始化标题返回按钮等元素
function initFrame() {
    sharedCtx.restore()
    sharedCtx.save()   

    sharedCtx.clearRect(0, 0, screenWidth * ratio, screenHeight * ratio)

    // 画背景
    sharedCtx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    sharedCtx.fillRect(0, 0, screenWidth * ratio, screenHeight * ratio)
    // sharedCtx.scale(ratio, ratio)
    // 按照 750的尺寸绘制
    let scales = screenWidth*ratio / 750
    sharedCtx.scale(scales, scales)

    // 画标题
    sharedCtx.fillStyle = '#fff'
    sharedCtx.font = 'bold 50px Arial'
    sharedCtx.textAlign = 'center'
    sharedCtx.fillText('好友排行榜', 750 / 2, 220);

    // 排名列表外框
    sharedCtx.fillStyle = '#302F30'
    sharedCtx.fillRect(80, 290, 750 - 80 * 2, 650)

    // 排行榜提示
    sharedCtx.fillStyle = '#8D8D8D'
    sharedCtx.font = '20px Arial'
    sharedCtx.textAlign = 'left'
    sharedCtx.fillText('每周一凌晨刷新', 100, 330)

    // 自己排名外框
    sharedCtx.fillStyle = '#302F30'
    sharedCtx.fillRect(80, 960, 750 - 80 * 2, 120)

    // // 返回按钮
    // let returnImage = wx.createImage()
    // returnImage.src = 'images/return.png'
    // returnImage.onload = () => {
    //     sharedCtx.drawImage(returnImage, 80, 1120, 100, 100)
    // }
}
let itemHeight = 590/6
function initRanklist (list, itemCanvasStartY) {
    if (itemCanvasStartY === undefined){
        itemCanvasStartY = 0
    }
    // 至少绘制6个
    let length = Math.max(list.length, 6)

    // itemCanvas.width = screenWidth - 40 * 2
    // itemCanvas.height = itemHeight * length
    itemCanvas.width = (750 - 80 * 2)
    itemCanvas.height = itemHeight * length

    itemCtx.clearRect(0, 0, itemCanvas.width, itemCanvas.height)

    for (let i = 0; i < length; i++) {
        if (i % 2 === 0) {
            itemCtx.fillStyle = '#393739'
        } else {
            itemCtx.fillStyle = '#302F30'
        }
        console.log(itemCanvas.width)
        itemCtx.fillRect(0, i * itemHeight, itemCanvas.width, itemHeight)
    }
    var listLength = list.length
    if (list && list.length >0) {
        list.forEach((item, index) => {
            let avatar = wx.createImage()
            avatar.src = item.avatarUrl
            avatar.onload = function() {
                itemCtx.drawImage(avatar, 100, index*itemHeight + 14, 70, 70)
                if (--listLength === 0)
                    reDrawItem(itemCanvasStartY)
            }
            avatar.onerror = function() {
                if (--listLength === 0)
                    reDrawItem(itemCanvasStartY)                
            }
            itemCtx.fillStyle = '#fff'
            itemCtx.font = '28px Arial'
            itemCtx.textAlign = 'left'
            itemCtx.fillText(item.nickname, 190, index * itemHeight + 54)
            itemCtx.font = 'bold 36px Arial'
            itemCtx.textAlign = 'right'
            itemCtx.fillText(item.score || 0, 550, index * itemHeight + 60)
            itemCtx.font = 'italic 44px Arial'
            itemCtx.textAlign = 'center'
            itemCtx.fillText(index + 1, 46, index * itemHeight + 64)
        })
    } else {
        // 没有数据
    }

   reDrawItem(itemCanvasStartY)
}

// 绘制自己的排名
function drawMyRank () {
    if (myInfo.avatarUrl && myScore) {
        let avatar = wx.createImage()
        avatar.src = myInfo.avatarUrl
        avatar.onload = function() {
            sharedCtx.drawImage(avatar, 180, 960 + 24, 70, 70)
        }
        sharedCtx.fillStyle = '#fff'
        sharedCtx.font = '28px Arial'
        sharedCtx.textAlign = 'left'
        sharedCtx.fillText(myInfo.nickName, 270, 960 + 72)
        sharedCtx.font = 'bold 36px Arial'
        sharedCtx.textAlign = 'right'
        sharedCtx.fillText(myScore || 0, 630, 960 + 76)
        // 自己的名次
        if (myRank !== undefined) {
            sharedCtx.font = 'italic 44px Arial'
            sharedCtx.textAlign = 'center'
            sharedCtx.fillText(myRank + 1, 126, 960 + 80)
        }
    }
    // sharedCtx.fillRect(40, 480, screenWidth - 40 * 2, 60)
}
// 因为头像绘制异步的问题，需要重新绘制
function reDrawItem(y) {
    console.log('reDrawItem', y)
    sharedCtx.clearRect(80, 350, 750 - 80 * 2, 590)
    sharedCtx.fillStyle = '#302F30'
    sharedCtx.fillRect(80, 350, 750 - 80 * 2, 590)
    sharedCtx.drawImage(itemCanvas, 0, y, 750 - 80 * 2, 590, 80, 350, 750 - 80 * 2, 590)
    //
    // sharedCtx.drawImage(itemCanvas, 40, y+175, screenWidth - 40 * 2, 295)
}
function sortByScore (data) {
    let array = []
    data.map(item => {

        array.push({
            avatarUrl: item.avatarUrl,
            nickname: item.nickname,
            openid: item.openid,
            score: item['KVDataList'][0] && item['KVDataList'][0].value!='undefined' ? item['KVDataList'][0].value : 0 // 取最高分
        })

    })
    array.sort((a, b) => {
        return a['score'] < b['score']
    })
    myRank = array.findIndex((item) => {
       return item.nickname === myInfo.nickName && item.avatarUrl === myInfo.avatarUrl
    })
    if (myRank === -1)
        myRank = array.length

    return array
}
// 开放域的getUserInfo 不能获取到openId, 可以在主域获取，并从主域传送
function getUserInfo() {
    wx.getUserInfo({
        openIdList:['selfOpenId'],
        lang: 'zh_CN',
        success: res => {
            console.log(res)
            myInfo = res.data[0]
        },
        fail: res => {

        }
    })
}

// 获取自己的分数
function getAndSetMyScore (score) {
    wx.getUserCloudStorage({
        keyList: ['score'],
        success: res => {
            let data = res
            console.log(data)
            let myScore = parseInt(data.KVDataList[0].value) || 0
            myScore += parseInt(score)
            saveMyScore(myScore)
        }
    })
}

function saveMyScore(myScore) {
    wx.setUserCloudStorage({
        KVDataList: [{ 'key': 'score', 'value': (''+myScore) }],
        success: res => {
            console.log(res)
        },
        fail: res => {
            console.log(res)
        }
    })
}

function getAndDrawFriendsRanking () {
  wx.getFriendCloudStorage({
    keyList: ['score', 'maxScore'],
    success: res => {
        let data = res.data
        console.log(res.data)
        initRanklist(sortByScore(data))
        drawMyRank()
    },
    fail: res => {
        console.log('getFriendsRanking:fail')
        console.log(res.data)
    }    
  })
}

function getAndDrawMe () {
  wx.getFriendCloudStorage({
    keyList: ['score'],
    success: res => {
        let data = res.data
        console.log(res.data)
        var sortedData = sortByScore(data)
        initRanklist(sortedData, (myRank-2)*itemHeight)
    },
    fail: res => {
        console.log('getFriendsRanking:fail')
        console.log(res.data)
    }    
  })
}
  

function getGroupRanking (ticket) {
    wx.getGroupCloudStorage({
        shareTicket: ticket,
        keyList: ['score', 'maxScore'],
        success: res => {
            console.log('getGroupCloudStorage:success')
            console.log(res.data)
            let data = res.data
            initRanklist(sortByScore(data))
            drawMyRank()
        },
        fail: res => {
            console.log('getGroupCloudStorage:fail')
            console.log(res.data)
        }
    })
}
// getGroupRanking()
wx.onMessage(data => {
    if (data.type === 'friends') {
        // getFriendsRanking()
        // getMyScore()
        
        initFrame()
        fakeData(20)
        var y = 3*itemHeight
        initRanklist(datas, y)
        getMyScore()
        drawMyRank()

        // show = true
        console.log('on')    
    } else if(data.type === 'aboutMe'){
        console.log('aboutMe')
        getAndSetMyScore(data.score)
        getAndDrawMe()
    } else if (data.type === 'group') {
        getGroupRanking(data.text)
        getMyScore()
    } else if (data.type === 'updateMaxScore') {
        // 更新最高分
        console.log('更新最高分')
        getMyScore()
    } else if (data.type === 'stopShow') {
        // wx.offTouchMove(onMove)
        // wx.offTouchEnd(onUp)
        show = false
        console.log('off')    
    }
})
wx.onTouchMove(onMove)
wx.onTouchEnd(onUp)

let startY = undefined, moveY = 0

let show = false
function onMove(e) {
    if (!show)  return
    let touch = e.touches[0]
    // 触摸移动第一次触发的位置
    if (startY === undefined) {
        startY = touch.clientY*ratio + moveY
    }
    moveY = startY - touch.clientY*ratio
    reDrawItem(moveY)
}
function onUp(e) {
    if (!show)  return
    startY = undefined
    if (moveY < 0) { // 到顶
        moveY = 0
    } else if (moveY > itemCanvas.height - 590) { // 到底
        moveY = itemCanvas.height - 590
    }
    reDrawItem(moveY)
}