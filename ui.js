// import './libs/weapp-adapter/index'
// import * as THREE from './libs/threejs/three'
// var ThreeUI = ThreeUI||require('./libs/threejs/threeUi/ThreeUI.js');

let openDataContext = wx.getOpenDataContext();
let sharedCanvas = openDataContext.canvas;
console.log('init sharedCanvas',sharedCanvas.width, sharedCanvas.height)
sharedCanvas.width = window.innerWidth * wx.getSystemInfoSync().pixelRatio;
sharedCanvas.height = window.innerHeight * wx.getSystemInfoSync().pixelRatio;

let uiWidth = 414
let uiHeight= 736
var family = 'Helvetica';//wx.loadFont('images/num.ttf');
var groupStart, groupPlaying,  rankingTexture, ranking, rankingRetSprite, groupDirs, 
    textDirFile, groupPassLevel, groupTut, groupTut_01, coinsUi;

window.bgColor = '#33ccff'
var difficults = ['','[简单]', '[普通]', '[困难]', '[挑战]'];
var colors = [['rgba(215, 219, 230, 1)', 'rgba(188, 190, 199, 1)'], 
              ['rgba(255, 231, 220, 1)', 'rgba(255, 196, 204, 1)'], 
              ['rgba(255, 224, 163, 1)', 'rgba(255, 202, 126, 1)'], 
              ['rgba(255, 248, 185, 1)', 'rgba(255, 245, 139, 1)'], 
              ['rgba(218, 244, 255, 1)', 'rgba(207, 233, 210, 1)'], 
              // ['rgba(207, 207, 207, 1)', 'rgba(199, 196, 201, 1)'],
              ['rgba(219, 235, 255, 1)', 'rgba(185, 213, 235, 1)'], 
              ['rgba(216, 218, 255, 1)', 'rgba(165, 176, 232, 1)'], 
              ];
var arrLevelsInADir = []
var ui ;
// var mute;
var PlaceUi = function (paraUi) {
  ui = paraUi;
  this.colors = colors
  //start
  {
  // var colorIndex = 7;
  groupStart = ui.createGroup(0, 0, uiWidth, uiHeight); 
    var bg = ui.createRectangle(0, 0, uiWidth, uiHeight, window.bgColor); 
    var gameName = ui.createText(
      '方块逃生3D'
      ,40, family, 'black', 110, 154);
    gameName.textBaseline = 'top';  gameName.fontWeight = 'bold';

    var rectBegin = ui.createRectangle( 98, 447, 218, 64, '#FFFFFF');
      var textTemp = ui.createText(
        '开始游戏'
        , 32, family, 'black', 0, 0);  textTemp.fontWeight = 'bold' ;setTextInRect(textTemp, rectBegin);
    rectBegin.onClick(function() {
      groupStart.visible = false;
      groupPlaying.visible = true;      ui.dispatchEvent( { type: 'start' } )
      bg.visible = gameName.visible = rectBegin.visible = false;
    });      

    var bg1 = ui.createRectangle(0, 630, 474, 136, window.bgColor);     
    bg1.parent = bg.parent = gameName.parent = rectBegin.parent = groupStart;
  }
  {
    var fenxiang = ui.createGroup(38, 630, 50, 80);
      var temp = ui.createSprite('images/fenxiang.png',0, 0, 50, 50);  temp.parent = fenxiang;
      var textTemp = ui.createText('分享', 20, family, 'white', 0, 0);  setTextButtomGroup(textTemp, fenxiang)
      fenxiang.onClick(shareApp);

    var rankingSprite = ui.createGroup(133, 630, 50, 80);
      var temp = ui.createSprite('images/paihang.png', 0, 0, 50, 50);  temp.parent = rankingSprite;
      var textTemp = ui.createText('排行榜', 20, family, 'white', 0, 0);  setTextButtomGroup(textTemp, rankingSprite)
      rankingSprite.onClick(showRank);

    var xiaoxi = ui.createGroup(228, 630, 50, 80);
      var temp = ui.createSprite('images/message.png',0, 0, 50, 50);  temp.parent = xiaoxi;
      var textTemp = ui.createText('消息', 20, family, 'white', 0, 0);  setTextButtomGroup(textTemp, xiaoxi)    

    var jingyin = ui.createGroup(322, 630, 50, 80);
      var temp = ui.createSprite('images/mute_off.png',0, 0, 50, 50);  temp.parent = jingyin;  jingyin.sprite = temp;
      var textTemp = ui.createText('声音', 20, family, 'white', 0, 0);  setTextButtomGroup(textTemp, jingyin)
      jingyin.onClick(function(){
        if (this.sprite.assetPath === 'images/mute_off.png'){
          Audio.mute = true;
          this.sprite.setAssetPath('images/mute_on.png')
        }
        else if (this.sprite.assetPath === 'images/mute_on.png'){
          Audio.mute = false;
          this.sprite.setAssetPath('images/mute_off.png')
        }
      });

    fenxiang.parent = jingyin.parent =rankingSprite.parent =xiaoxi.parent = groupStart;
  }
  //Dirs
  {
    
    groupDirs = ui.createGroup(0, 0, uiWidth, uiHeight);  groupDirs.visible = false;  groupDirs.isMov = true;
    var retSprite = ui.createSprite('images/return.png', 0, 0, 50,50);
    retSprite.setParent(groupDirs)
    retSprite.onClick(() => {
      groupStart.visible = false
      groupDirs.visible = false;
      groupPlaying.visible = true;
    })
    
    var startX = 50, startY = 50, w = 300, h = 64/*32*/, pad = 14
    for (var i = 0; i < window.levelDirs.length; ++i){
      var colorIndex = i % colors.length;
      var rectLevelDir = ui.createRectangle( startX , startY + i*(h + pad), w, h, colors[colorIndex][0], colors[colorIndex][1]);
      rectLevelDir.setParent(groupDirs);

      var textTemp = ui.createText(window.levelDirs[i], 24, family, 'black', 0, 0);  setTextInRect(textTemp, rectLevelDir);
      var textTemp = ui.createText(difficults[window.DirDiff[i]], 18, family, 'black', 5, 5);  textTemp.setParent(rectLevelDir)

      rectLevelDir.index = i;
      rectLevelDir.onClick(function() {
        groupDirs.visible = false;  groupStart.visible = false;
        if (!arrLevelsInADir[this.index]){
          createLevelsInADir(this.index)
        }
        else {
          setDirLevelState(this.index)
          arrLevelsInADir[this.index].visible = true;
        }
      })
    }
  }

  //playing
  {
    this.groupPlaying = groupPlaying = ui.createGroup(0, 0, uiWidth, uiHeight);  groupPlaying.visible = false;
    
      var rectReturn = ui.createSprite('images/levels.png', -5, -5, 60,60);
      rectReturn.onClick(function(){
        groupTut.visible = false;
        groupTut_01.visible = false;        
        groupPlaying.visible = false;
        // groupStart.visible = true;
        groupDirs.visible = true;
      });  

    textDirFile = ui.createText('', 20, family, 'black', 60, 25);
    var temp = ui.createSprite('images/fenxiang.png',20, 660, 50, 50);
    temp.onClick(shareApp);

    rectReturn.parent= textDirFile.parent = temp.parent= groupPlaying;
  }

  //passLevel
  {
    
  groupPassLevel = ui.createGroup(0, 0, uiWidth, uiHeight);  groupPassLevel.visible = false;

  var rectAllRank = ui.createRectangle(44, 120, 120, 40, 'white');  rectAllRank.parent = groupPassLevel;
      var textTemp = ui.createText('全部排行', 24, family, 'black', 0, 0);  setTextInRect(textTemp, rectAllRank);
    rectAllRank.onClick(showRank)

  coinsUi = ui.createText(''+GetMyCoins()+' 金币', 20, family, 'white', 300, 80);  coinsUi.parent = groupPassLevel;
  var rectSharetoGroup = ui.createRectangle(248, 120, 120, 40, '#99ff00');  rectSharetoGroup.parent = groupPassLevel;
      var textTemp = ui.createText('群排行', 24, family, 'black', 0, 0);  setTextInRect(textTemp, rectSharetoGroup);
    rectSharetoGroup.onClick(function(){
      if (gShareTicket){
        console.log('showRank', gShareTicket)
        showRank.bind(this)(gShareTicket)
      }
      else
        wx.showModal({
          title: '查看群友排行',
          content: '分享到指定群\r\n点击群内游戏卡片\r\n',
          success: shareApp
        })
    })
 
  var rectPlayBack = ui.createRectangle(44, 534, 120, 40, 'white');  rectPlayBack.parent = groupPassLevel;
      var textTemp = ui.createText('精彩回放', 24, family, 'black', 0, 0);  setTextInRect(textTemp, rectPlayBack);
    rectPlayBack.onClick(function() {
      groupPlaying.visible = true;
      ranking.visible = false
      groupPassLevel.visible = false;
      groupStart.visible = false;
      ui.dispatchEvent( { type: 'playBack' } )
    });

  var rectThisAgain = ui.createRectangle(44, 585, 120, 40, 'white');  rectThisAgain.parent = groupPassLevel;
      var textTemp = ui.createText('再来一次', 24, family, 'black', 0, 0);  setTextInRect(textTemp, rectThisAgain);
    rectThisAgain.onClick(function() {
      groupPlaying.visible = true;
      ranking.visible = false
      groupPassLevel.visible = false;
      groupStart.visible = false;
      ui.dispatchEvent( { type: 'thisAgain' } )
    });

  var rectSharetoFriend = ui.createRectangle(248, 534, 120, 40, '#99ff00');  rectSharetoFriend.parent = groupPassLevel;
    var textTemp = ui.createText('分享', 24, family, 'black', 0, 0);  setTextInRect(textTemp, rectSharetoFriend);
    rectSharetoFriend.onClick(shareApp);

    
  var rectNext = ui.createRectangle(200, 585, 180, 50, 'white');  rectNext.parent = groupPassLevel;
      var textTemp = ui.createText('  下一关', 32, family, 'black', 0, 0);  setTextInRect(textTemp, rectNext);
      var temp = ui.createSprite('images/scroll_r.png',5, 5, 40, 40);  temp.parent = rectNext; 
      rectNext.onClick(function() {
      var dirIndex, tmp;
      [dirIndex, tmp] = window.getNextDirLevel()
      if(window.checkAndSubMyCoin(window.DirDiff[dirIndex]) === false){
        console.log('no coins');

        wx.showModal({
          title: '解锁下一关需'+window.DirDiff[dirIndex]+'金币',
          content: '分享给好友 +1 金币\r\n看视频 +5 金币',
          showCancel: false,
        })
       return;
      }
      groupPlaying.visible = true;
      ranking.visible = false
      groupPassLevel.visible = false;
      groupStart.visible = false;
      ui.dispatchEvent( { type: 'next' } )
    });
  }

  //教程0
  {
    this.groupTut = groupTut = ui.createGroup(0, 0, uiWidth, uiHeight);  groupTut.visible = false;  
      var rectTut1 = ui.createRectangle( 110, 70, 160, 80, '#43575F');  rectTut1.parent = groupTut;
      var textTut1 = ui.createText('移开小色块\n\n救出小白块', 20, family, 'white', 0, 0);  
      setTextTopRect(textTut1, rectTut1);

      var rectTut2 = ui.createRectangle( 38, 620, 140, 40, '#43575F');  rectTut2.parent = groupTut;
      var textTut2 = ui.createText('方块只能沿', 24, family, 'white', 0, 0);  
      setTextTopRect(textTut2, rectTut2);
      var rectTut2 = ui.createRectangle( 175, 620, 96, 40, '#43575F');  rectTut2.parent = groupTut;
      var textTut2 = ui.createText('“长边”', 24, family, 'yellow', 0, 0);  
      setTextTopRect(textTut2, rectTut2);
      var rectTut2 = ui.createRectangle( 270, 620, 107, 40, '#43575F');  rectTut2.parent = groupTut;
      var textTut2 = ui.createText('方向拖动', 24, family, 'white', 0, 0);  
      setTextTopRect(textTut2, rectTut2);            

      var leftSprite = ui.createSprite('images/up.png', 100, 450);  leftSprite.rotated = true; leftSprite.parent = groupTut;
      var upSprite = ui.createSprite('images/up.png', 300, 480);  upSprite.parent = groupTut;
  }
  //教程1
  {
    this.groupTut_01 = groupTut_01 = ui.createGroup(0, 0, uiWidth, uiHeight);  groupTut_01.visible = false;
    // groupTut_01.parent = groupPlaying
      var rectTut1 = ui.createRectangle( 130, 530, 152, 67, '#43575F');  rectTut1.parent = groupTut_01;
      var textTut1 = ui.createText('按住空白处拖动\n旋转小屋', 20, family, 'white', 0, 0);
      setTextTopRect(textTut1, rectTut1);

      var leftSprite = ui.createSprite('images/l.png', 30, 480);  leftSprite.parent = groupTut_01;
      var upSprite = ui.createSprite('images/r.png', 316, 480);  upSprite.parent = groupTut_01;
  }

  //排行
  {
    rankingTexture = new THREE.CanvasTexture(openDataContext.canvas)
    rankingTexture.minFilter = rankingTexture.magFilter = THREE.LinearFilter
    rankingTexture.needsUpdate = true
    let geometry = new THREE.PlaneGeometry(sharedCanvas.width ,sharedCanvas.height)
    let material = new THREE.MeshBasicMaterial({ map: rankingTexture, transparent: true , opacity:0.8}) 
    ranking = new THREE.Mesh(geometry, material)
    ranking.matrixAutoUpdate = false;
    ranking.translateZ(-1)
    // ranking.translateY(100)
    ranking.visible = false;
    ui.scene.add(ranking)
    ranking.updateMatrix()


    rankingRetSprite = ui.createSprite('images/return.png', 50, 608, 50,50);  rankingRetSprite.visible = false;
    rankingRetSprite.onClick(function() {
      this.retMenu.visible = true;
      rankingRetSprite.visible = false;
      ranking.visible = false;
      openDataContext.postMessage({type: 'stopShow'})
      wx.offTouchMove(updateRanking);
      wx.offTouchEnd(updateRanking);
      if (this.retMenu === groupPassLevel)
        showPassLevel(0);
    });
  }
}
//某个目录下的关卡

// async 
function  createLevelsInADir(index)  {
  var fs = wx.getFileSystemManager();
  // var files = await fs.readFileSync
  var files =  fs.readFileSync
                ('levels/'+ window.levelDirs[index] +'/dir.txt', "ascii")
  files = files.replace(/\r/g, '').split('\n');  
  console.log(files)

  var groupRectLevels = ui.createRectangle(0, 0, uiWidth, uiHeight, window.bgColor);    arrLevelsInADir[index] = groupRectLevels;
  var groupLevels = ui.createGroup(0, 0, uiWidth, uiHeight);  groupLevels.isMov = true;  groupLevels.isMov = true;
  groupLevels.parent = groupRectLevels

  var retSprite = ui.createSprite('images/return.png', 0, 0, 50,50);  retSprite.setParent(groupRectLevels);
  retSprite.onClick(function(){
    this.parent.visible = false
    groupDirs.visible = true;  
    // groupStart.visible = true;
  })

  groupRectLevels.arrLevelUi = []
  var textDirName = ui.createText(window.levelDirs[index], 24, family, 'white', 70, 20); textDirName.setParent(groupLevels);
  var row = 0, col = 0, cntArow = 4, startX = 50, startY = 60, w = 60, h = 40, padX = 30, padY = 20;
  for (var i = 0; i < files.length; ++i){
     if (files[i] === '') continue;
     row = Math.floor(i / cntArow);  col = i % cntArow;
     var colorIndex = (col+4) % colors.length;
     var rectLevel = ui.createRectangle(startX+col*(w+padX) , startY+row*(h + padY), w, h, colors[colorIndex][0], colors[colorIndex][1]);  
     rectLevel.setParent(groupLevels);
     
     var name = files[i].split('.');
     var textTemp = ui.createText(name[0], 24, family, 'black', 0, 0);  setTextInRect_L(textTemp, rectLevel);
    //  textTemp.setParent(rectLevel);

     var textState = ui.createText('   ', 24, family, 'black', 0, 0);  setTextInRect_R(textState, rectLevel);
    //  textState.setParent(rectLevel);

     rectLevel.dirIndex = index;  rectLevel.fileIndex = i;
     rectLevel.onClick(function() {
        this.parent.parent.visible = false;
        groupPlaying.visible = true;
        ui.dispatchEvent( { type: 'selectDirFile' , dirIndex: this.dirIndex, fileIndex: this.fileIndex} )
     })     

     groupRectLevels.arrLevelUi.push(textState)
  }
  setDirLevelState(index);
}
function setDirLevelState(dirIndex)
{
  for(var i = 0; i < arrLevelsInADir[dirIndex].arrLevelUi.length; ++i){
    if (getLevelState(dirIndex, i) === 0)
      arrLevelsInADir[dirIndex].arrLevelUi[i].text = '  -'          
    else if (getLevelState(dirIndex, i) === 1)
      arrLevelsInADir[dirIndex].arrLevelUi[i].text = '  √'
  }  
}
function updateRanking() {
  console.log('updateRanking')
  rankingTexture.needsUpdate = true
}

function setTextTopRect(text, rect){
  text.textAlign = 'center';
  text.textBaseline = 'top';
  text.anchor.x = ThreeUI.anchors.center;
  text.anchor.y = ThreeUI.anchors.top;
  
  text.setParent( rect);  
}

function setTextInRect(text, rect){
  text.textAlign = 'center';
  text.textBaseline = 'middle';
  text.anchor.x = ThreeUI.anchors.center;
  text.anchor.y = ThreeUI.anchors.center;
  
  text.setParent( rect);  
}

function setTextInRect_L(text, rect){
  text.textAlign = 'right';
  text.textBaseline = 'middle';
  text.anchor.x = ThreeUI.anchors.center;
  text.anchor.y = ThreeUI.anchors.center;
  
  text.setParent( rect);  
}

function setTextInRect_R(text, rect){
  text.textAlign = 'left';
  text.textBaseline = 'middle';
  text.anchor.x = ThreeUI.anchors.center;
  text.anchor.y = ThreeUI.anchors.center;
  
  text.setParent( rect);  
}

function setTextButtomGroup(text, group){
  text.textAlign = 'center';
  text.textBaseline = 'bottom';
  text.anchor.x = ThreeUI.anchors.center;
  text.anchor.y = ThreeUI.anchors.bottom;
  
  text.setParent( group);  
}

window.shareMsg = {
  title: '3D版华容道，一起来烧脑',
  imageUrl: 'https://mmbiz.qpic.cn/mmbiz_png/hPjqozbzm2KhyTGg6dZArbX91LY2NqXupjtSJ4haxAZyUeicuwdHerRhfXGHxxiaeUJHgXOXcAaaNBjFGdmg2nRw/0?wx_fmt=png',
  success: (res) => {
    console.log('share ok', res)
    if (res.shareTickets[0]) {
        gShareTicket = res.shareTickets[0];
    }
  },
  fail: (res) => {
    console.log('share failed', res)
    var coin = GetMyCoins() - 1;
    SetMyCoins(coin)
    coinsUi.text = ''+coin+' 金币'
  }
}

window.shareApp = function () {
  wx.shareAppMessage(shareMsg)
  var coin = GetMyCoins() + 1;
  SetMyCoins(coin)
  coinsUi.text = ''+coin+' 金币'
}

function showRank(ticket) {
  this.parent.visible = false;
  rankingRetSprite.visible = true;
  rankingRetSprite.retMenu = this.parent;
  ranking.visible = true;
  if (ticket)
    openDataContext.postMessage({type: 'group',text: ticket,})
  else
    openDataContext.postMessage({type: 'friends',})
  updateRanking()
  var flag_uiRedraw = setInterval(function() {updateRanking()}, 500);
  setTimeout(function(){clearInterval(flag_uiRedraw);},5*1000)

  wx.onTouchMove(updateRanking);
  wx.onTouchEnd(updateRanking);
}

window.setUiDirFile = function(text){
  textDirFile.text = text
}

window.showPassLevel = function(score){
  openDataContext.postMessage({type: 'aboutMe', score: score})

  updateRanking()
  var flag_uiRedraw = setInterval(function() {updateRanking()}, 500);
  setTimeout(function(){clearInterval(flag_uiRedraw);},5*1000)
  
  groupTut.visible = false;
  groupTut_01.visible = false;
  groupPlaying.visible = false;
  ranking.visible = true;
  groupPassLevel.visible = true;
  // groupStart.visible = true;
}
module.exports = PlaceUi;
// window.placeUi = placeUi;