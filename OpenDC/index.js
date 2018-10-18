let screenWidth = wx.getSystemInfoSync().screenWidth
let screenHeight = wx.getSystemInfoSync().screenHeight
let ratio = wx.getSystemInfoSync().pixelRatio

let sharedCtx = wx.getSharedCanvas().getContext('2d')
let scalesX = screenWidth*ratio / 414, scalesY = screenHeight*ratio / 736
sharedCtx.scale(scalesX, scalesY)

let itemCanvas = wx.createCanvas()
let itemCtx = itemCanvas.getContext('2d')

let myScore = undefined
let myInfo = {}
let myRank = undefined
let stY = 120 
var listLength ;

var fakedatas = []
getUserInfo()

var imgNo = [wx.createImage(),wx.createImage(),wx.createImage()]
imgNo[0].src = 'images/first.jpg'
imgNo[1].src = 'images/second.jpg'
imgNo[2].src = 'images/third.jpg'
imgNo[0].onload = function() { 
    imgNo[0].loaded = true }
imgNo[1].onload = function() {
    imgNo[1].loaded = true }
imgNo[2].onload = function() {
    imgNo[2].loaded = true }

// wx.removeUserCloudStorage({
//     keyList: ['score', 'maxScore'],
// })

function fakeData(count){
    var item = new Object()
    myInfo.avatarUrl = 'images/suc.png'
    myInfo.nickName = '宏伟'
    myScore = '16'
    myRank = 4
    for (var i = 0; i < count;  ++i){
        var item = new Object()
        item.avatarUrl = 'images/suc.png'        
        if (i === 1)  item.avatarUrl = 'images/suc1.png'
        item.nickname = '宏伟'+i
        // item.score 
        item.KVDataList = [{value:''+i}]
        fakedatas.push(item)
    }
    fakedatas[4].nickname = '宏伟'
}

let itemHeight = 50
// 初始化标题返回按钮等元素
function initFrame(type) {
    sharedCtx.restore()
    sharedCtx.save()

    sharedCtx.clearRect(0, 0, 414, 736)

    // 画背景
    sharedCtx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    sharedCtx.fillRect(0, 0, 414, 736)

    // 画标题
    sharedCtx.fillStyle = '#fff'
    sharedCtx.font = 'bold 32px Arial'
    sharedCtx.textAlign = 'center'
    if (type === undefined)
        sharedCtx.fillText('通关', 414 / 2, stY - 20);
    else if (type === 1) 
        sharedCtx.fillText('好友排行榜', 414 / 2, stY - 20);
    else if (type === 2) 
        sharedCtx.fillText('群友排行榜', 414 / 2, stY - 20);        

    // 排名列表外框
    sharedCtx.fillStyle = '#302F30'
    sharedCtx.fillRect(40, stY, 414 - 40 * 2, itemHeight*7)
}
function drawAPerson(item, index, YStart, itemCanvasStartY) {
    let avatar = wx.createImage()
    avatar.src = item.avatarUrl
    avatar.onload = function() {
        itemCtx.drawImage(avatar, 50, YStart + 5, 40, 40)
        if (itemCanvasStartY !== undefined && --listLength === 0)
            reDrawItem(itemCanvasStartY)
    }
    avatar.onerror = function() {
        if (itemCanvasStartY !== undefined && --listLength === 0)
            reDrawItem(itemCanvasStartY)
    }
    itemCtx.fillStyle = '#fff'
    itemCtx.font = '16px Arial'
    itemCtx.textAlign = 'left'
    itemCtx.fillText(item.nickname, 110, YStart + 35)

    itemCtx.font = 'bold 24px Arial'
    itemCtx.textAlign = 'right'
    itemCtx.fillText(item.score || 0, 300, YStart + 35)

    drawRankingNum(itemCtx, index, 0, YStart)
}

function initRanklist (list, itemCanvasStartY) {
    if (itemCanvasStartY === undefined){
        itemCanvasStartY = 0
    }
    // 至少绘制6个
    let length = Math.max(list.length, 6)
    itemCanvas.width = (414 - 40 * 2) * scalesX
    itemCanvas.height = itemHeight * length * scalesY
    itemCtx.scale(scalesX, scalesY)
    topPosMax = itemHeight * length - 300

    itemCtx.clearRect(0, 0, itemCanvas.width, itemCanvas.height)

    for (let i = 0; i < length; i++) {
        if (i % 2 === 0) {
            itemCtx.fillStyle = '#393739'
        } else {
            itemCtx.fillStyle = '#302F30'
        }
        itemCtx.fillRect(0, i * itemHeight, itemCanvas.width, itemHeight)
    }
    listLength = list.length
    list.forEach((item, index) => {
        drawAPerson(item, index, itemHeight * index, itemCanvasStartY)
    })
    reDrawItem(itemCanvasStartY)
}

/**
 * 绘制名次
 */
function drawRankingNum(ctx, num, x, y) {
    // 名次从0开始
    if (num < 3 && imgNo[num] && imgNo[num].loaded) {
        ctx.drawImage(imgNo[num], x + 10, y+10, 30, 30)
    } else{
        ctx.font = 'italic 28px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(num + 1, x + 20, y + 35)
    }
} 

// 绘制自己的排名
function drawMyRank () {
    // 自己排名外框
    sharedCtx.fillStyle = '#302F30'
    sharedCtx.fillRect(40, stY + itemHeight*7.5, 414 - 40 * 2, itemHeight*1.2)

    if (myInfo.avatarUrl && myScore) {
        var YStart = stY + itemHeight *7.6
        var XStart = 40
        let avatar = wx.createImage()
        avatar.src = myInfo.avatarUrl
        avatar.onload = function() {
            sharedCtx.drawImage(avatar, XStart + 50, YStart + 5, 40, 40)
        }
        sharedCtx.fillStyle = '#fff'
        sharedCtx.font = '18px Arial'
        sharedCtx.textAlign = 'left'
        sharedCtx.fillText(myInfo.nickName, XStart + 110, YStart + 35)

        sharedCtx.font = 'bold 24px Arial'
        sharedCtx.textAlign = 'right'
        sharedCtx.fillText(myScore || 0, XStart + 300, YStart + 35)

        drawRankingNum(sharedCtx, myRank, XStart, YStart)
    }
}
// 因为头像绘制异步的问题，需要重新绘制
function reDrawItem(y) {
    // console.log('reDrawItem', y)
    sharedCtx.clearRect(40, stY + itemHeight, 414 - 40 * 2, itemHeight*6)
    sharedCtx.fillStyle = '#302F30'
    sharedCtx.fillRect(40, stY + itemHeight, 414 - 40 * 2, itemHeight*6)
    sharedCtx.drawImage(itemCanvas, 0, y*scalesY, (414 - 40 * 2)*scalesX, (itemHeight*6)*scalesY,
                                    40, stY + itemHeight, 414 - 40 * 2, itemHeight*6)
    //
    // sharedCtx.drawImage(itemCanvas, 40, y+175, screenWidth - 40 * 2, 295)
}
function sortByScore (data) {
    let array = []
    data.forEach(item => {
        var score = item['KVDataList'][0] && item['KVDataList'][0].value!='undefined' ? item['KVDataList'][0].value : 0;
        if (item.nickname === myInfo.nickName && item.avatarUrl === myInfo.avatarUrl){
            if (!myScore)
                myScore = score            
            else if (parseInt(myScore) > parseInt(score))
                score = myScore
        }
        array.push({
            avatarUrl: item.avatarUrl,
            nickname: item.nickname,
            openid: item.openid,
            score: score
        })

    })
    array.sort((a, b) => {
        var ia = parseInt(a['score']), ib = parseInt(b['score'])
        if (ia < ib)
            return 1;
        else if (ia > ib)
            return -1;
        else
            return 0;        
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
            if (res.data[0])
                myInfo = res.data[0]
            // fakeData(20)
        },
        fail: res => {

        }
    })
}

// 获取自己的分数
function getAndSetMyScore (addScore) {
    wx.getUserCloudStorage({
        keyList: ['score'],
        success: res => {
            let data = res
            var score = 0
            if (data.KVDataList[0])
                score = parseInt(data.KVDataList[0].value)
            score += parseInt(addScore)
            saveMyScore(score)
        }
    })
}

function saveMyScore(score) {
    myScore = score
    wx.setUserCloudStorage({
        KVDataList: [{ 'key': 'score', 'value': (''+score) }],
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
    keyList: ['score'],
    success: res => {
        let datas = res.data
        initFrame(1)
        initRanklist(sortByScore(datas), 0)
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
        let datas = res.data
        initFrame()
        initRanklist(sortByScore(datas), (myRank-2)*itemHeight)
        console.log('getAndDrawMe', res)
    },
    fail: res => {
        console.log('getAndDrawMe fail', res)
    }    
  })
}
  

function getGroupRanking (ticket) {
    console.log('getGroupRanking', ticket)
    wx.getGroupCloudStorage({
        shareTicket: ticket,
        keyList: ['score'],
        success: res => {
            let datas = res.data
            initFrame(2)
            initRanklist(sortByScore(datas))
            drawMyRank()
        },
        fail: res => {
            console.log('getGroupCloudStorage fail', res)
        }
    })
}
// getGroupRanking()
wx.onMessage(data => {
    console.log('index>', data)    
    if (data.type === 'friends') {
        getAndDrawFriendsRanking()
        show = true
    } else if(data.type === 'aboutMe'){
        console.log('aboutMe', data.score)
        if (data.score)
            getAndSetMyScore(data.score)
        getAndDrawMe()
    } else if (data.type === 'group') {
        getGroupRanking(data.text)
        show = true
    } else if (data.type === 'updateMaxScore') {
        // 更新最高分
        console.log('更新最高分')
    } else if (data.type === 'stopShow') {
        wx.offTouchMove(onMoveRank)
        wx.offTouchEnd(onUpRank)
        show = false
        console.log('off')    
    }
})
wx.onTouchMove(onMoveRank)
wx.onTouchEnd(onUpRank)

let lastY = undefined, topPos = 0;
let show = false
let screenHvs736 = screenHeight/736
var topPosMax;
function onMoveRank(e) {
    if (!show)  return
    // let touch = e.touches[0]
    var touch = e.changedTouches ? e.changedTouches[0] : e;    
    // 触摸移动第一次触发的位置
    if (lastY === undefined) {
        lastY = touch.clientY
        return;
    }
    var movedY = (lastY - touch.clientY)*screenHvs736
    topPos += movedY
    reDrawItem(topPos)
    lastY = touch.clientY
}

function onUpRank(e) {
    if (!show)  return;

    lastY = undefined
    if (topPos < 0) { // 到顶
        topPos = 0
    } else if (topPos > topPosMax) { // 到底
        topPos = topPosMax
    }
    reDrawItem(topPos)
}