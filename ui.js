import './libs/weapp-adapter/index'
import * as THREE from './libs/threejs/three'
var ThreeUI = require('./libs/threejs/threeUi/ThreeUI.js');

let openDataContext = wx.getOpenDataContext();
let sharedCanvas = openDataContext.canvas;
const ratio = wx.getSystemInfoSync().pixelRatio;
sharedCanvas.width = window.innerWidth * ratio;
sharedCanvas.height = window.innerHeight * ratio;

var family = 'Helvetica';//wx.loadFont('images/num.ttf');
var groupStart, groupPlaying,  rankingTexture, ranking, rankingRetSprite, groupDirs, textDirFile, groupPassLevel, groupTut, groupTut_01;

window.bgColor = '#33ccff'
var difficults = ['[简单]', '[普通]', '[困难]', '[挑战]'];
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
  groupStart = ui.createGroup(0, 0, ui.width, ui.height); 
    var bg = ui.createRectangle(0, 0, ui.width, ui.height, window.bgColor); 
    var gameName = ui.createText('脑力操: 3D快乐方块', 40, family, 'black', 25, 154);
    gameName.textBaseline = 'top';  gameName.fontWeight = 'bold';

    var rectBegin = ui.createRectangle( 98, 447, 218, 64, '#FFFFFF');
      var textTemp = ui.createText('开始游戏', 32, family, 'black', 0, 0);  textTemp.fontWeight = 'bold' ;setTextInRect(textTemp, rectBegin);
    rectBegin.onClick(function() {
      groupStart.visible = false;
      groupPlaying.visible = true;
      ui.dispatchEvent( { type: 'start' } )
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
      rankingSprite.onClick(() => {
        groupStart.visible = false;
        rankingRetSprite.visible = true;
        ranking.visible = true;
        openDataContext.postMessage({
          type: 'friends',
          key: 'score',
          openId: 'oyJjl5dYt5dB4-jS5ifbsbToVYZ0'})
        updateRanking()
        var count_uiRedraw = 0;
        var flag_uiRedraw = setInterval(function(max) {
                if (count_uiRedraw >= max) {
                    clearInterval(flag_uiRedraw);
                    return;
                }
                updateRanking()
                count_uiRedraw = count_uiRedraw + 1;
            }, 1000, 3);
        
        wx.onTouchMove(updateRanking);
        wx.onTouchEnd(updateRanking);
      });

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
    groupDirs = ui.createGroup(0, 0, ui.width, ui.height);  groupDirs.visible = false;  groupDirs.isMov = true;
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
          arrLevelsInADir[this.index].visible = true;
        }
      })
    }
  }

  //playing
  {
    this.groupPlaying = groupPlaying = ui.createGroup(0, 0, ui.width, ui.height);  groupPlaying.visible = false;
    
      var rectReturn = ui.createSprite('images/levels.png', -5, -5, 60,60);
      rectReturn.onClick(function(){
        groupTut.visible = false;
        groupTut_01.visible = false;        
        groupPlaying.visible = false;
        // groupStart.visible = true;
        groupDirs.visible = true;
      });  

    textDirFile = ui.createText('', 24, family, 'black', 70, 5);
    var temp = ui.createSprite('images/fenxiang.png',20, 660, 50, 50);
    temp.onClick(shareApp);

    rectReturn.parent= textDirFile.parent = temp.parent= groupPlaying;
  }

  //过关
  {
  groupPassLevel = ui.createGroup(0, 0, ui.width, ui.height);  groupPassLevel.visible = false;

    var rectTemp = ui.createRectangle( 0, 55, 414, 254, '#99FF00');  rectTemp.parent = groupPassLevel;
    var star1 = ui.createSprite('images/star-on.png',100, 60, 50, 50);  star1.parent = groupPassLevel; 
    var star2 = ui.createSprite('images/star-on.png',150, 60, 50, 50);  star2.parent = groupPassLevel; 
    var star3 = ui.createSprite('images/star-on.png',200, 60, 50, 50);  star3.parent = groupPassLevel; 
    var star4 = ui.createSprite('images/star-on.png',250, 60, 50, 50);  star4.parent = groupPassLevel; 

    var textTemp = ui.createText('太棒了', 40, family, 'black', 143, 124);  textTemp.fontWeight = 'bold';  textTemp.parent = groupPassLevel;
    var textTemp = ui.createText('超越了 0 位好友', 32, family, 'red', 87, 193);  textTemp.parent = groupPassLevel;
    var textTemp = ui.createText('步数: ', 18, family, 'black', 10, 268);  textTemp.parent = groupPassLevel;
    var textTemp = ui.createText('用时: ', 18, family, 'black', 297, 268);  textTemp.parent = groupPassLevel;

    var rectThisAgain = ui.createRectangle(31, 390, 142, 57, 'white');  rectThisAgain.parent = groupPassLevel;
      var textTemp = ui.createText('再来一次', 32, family, 'black', 0, 0);  setTextInRect(textTemp, rectThisAgain);
    rectThisAgain.onClick(function() {
      groupPlaying.visible = true;
      groupPassLevel.visible = false;
      groupStart.visible = false;
      ui.dispatchEvent( { type: 'thisAgain' } )
    });

    var rectPlayBack = ui.createRectangle(233, 390, 142, 57, 'white');  rectPlayBack.parent = groupPassLevel;
      var textTemp = ui.createText('精彩回放', 32, family, 'black', 0, 0);  setTextInRect(textTemp, rectPlayBack);
    rectPlayBack.onClick(function() {
      groupPlaying.visible = true;
      groupPassLevel.visible = false;
      groupStart.visible = false;
      ui.dispatchEvent( { type: 'playBack' } )
    });      
      
    var rectNext = ui.createRectangle(77, 493, 263, 64, 'white');  rectNext.parent = groupPassLevel;
      var textTemp = ui.createText('下 一 关', 32, family, 'black', 0, 0);  setTextInRect(textTemp, rectNext);
      var temp = ui.createSprite('images/scroll_r.png',10, 5, 50, 50);  temp.parent = rectNext; 
      rectNext.onClick(function() {
      groupPlaying.visible = true;
      groupPassLevel.visible = false;
      groupStart.visible = false;
      ui.dispatchEvent( { type: 'next' } )
    });
  }

  //教程0
  {
    this.groupTut = groupTut = ui.createGroup(0, 0, ui.width, ui.height);  groupTut.visible = false;  
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
    this.groupTut_01 = groupTut_01 = ui.createGroup(0, 0, ui.width, ui.height);  groupTut_01.visible = false;
    // groupTut_01.parent = groupPlaying
      var rectTut1 = ui.createRectangle( 130, 530, 152, 67, '#43575F');  rectTut1.parent = groupTut_01;
      var textTut1 = ui.createText('按住空白处拖动\n旋转小屋', 20, family, 'white', 0, 0);
      setTextTopRect(textTut1, rectTut1);

      var leftSprite = ui.createSprite('images/l.png', 30, 480);  leftSprite.parent = groupTut_01;
      var upSprite = ui.createSprite('images/r.png', 316, 480);  upSprite.parent = groupTut_01;
  }

  //排行
  {
    rankingTexture = new THREE.CanvasTexture(sharedCanvas)
    rankingTexture.minFilter = rankingTexture.magFilter = THREE.LinearFilter
    rankingTexture.needsUpdate = true
    let geometry = new THREE.PlaneGeometry(ui.width*ratio, ui.height*ratio)
    let material = new THREE.MeshBasicMaterial({ map: rankingTexture, transparent: true , opacity:0.8}) //
    ranking = new THREE.Mesh(geometry, material)
    ui.scene.add(ranking)

    rankingRetSprite = ui.createSprite('images/return.png', 50, 608, 50,50);  rankingRetSprite.visible = false;
    rankingRetSprite.onClick(() => {
      groupStart.visible = true;
      rankingRetSprite.visible = false;
      ranking.visible = false;
      openDataContext.postMessage({type: 'stopShow'})
      wx.offTouchMove(updateRanking);
      wx.offTouchEnd(updateRanking);
    });    
  }
}

//某个目录下的关卡
function createLevelsInADir(index)  {
  // arrLevelsInADir  
  // window.levelDirs[index]
  var fs = wx.getFileSystemManager();
  var files = fs.readFileSync('levels/'+ window.levelDirs[index] +'/dir.txt', "ascii").split("\r\n");  
  console.log(files)

  var groupRectLevels = ui.createRectangle(0, 0, ui.width, ui.height, window.bgColor);  
  arrLevelsInADir[index] = groupRectLevels;
  var groupLevels = ui.createGroup(0, 0, ui.width, ui.height);  groupLevels.isMov = true;  groupLevels.isMov = true;
  groupLevels.parent = groupRectLevels

  var retSprite = ui.createSprite('images/return.png', 0, 0, 50,50);  retSprite.setParent(groupRectLevels);
  retSprite.onClick(function(){
    this.parent.visible = false
    groupDirs.visible = true;  
    // groupStart.visible = true;
  })

  var textDirName = ui.createText(window.levelDirs[index], 24, family, 'white', 70, 5); textDirName.setParent(groupLevels);
  var row = 0, col = 0, cntArow = 4, startX = 30, startY = 60, w = 60, h = 40, padX = 30, padY = 20;
  for (var i = 0; i < files.length; ++i){
     if (files[i] === '') continue;
     row = Math.floor(i / cntArow);  col = i % cntArow;
     var colorIndex = (col+4) % colors.length;
     var rectLevel = ui.createRectangle(startX+col*(w+padX) , startY+row*(h + padY), w, h, colors[colorIndex][0], colors[colorIndex][1]);  
     rectLevel.setParent(groupLevels);
     
     var name = files[i].split('.');
     var textTemp = ui.createText(name[0], 24, family, 'black', 0, 0);  setTextInRect(textTemp, rectLevel);
     rectLevel.dirIndex = index;  rectLevel.fileIndex = i;
     rectLevel.onClick(function() {
        this.parent.visible = false;
        groupPlaying.visible = true;
        ui.dispatchEvent( { type: 'selectDirFile' , dirIndex: this.dirIndex, fileIndex: this.fileIndex} )
     })     
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

function setTextButtomGroup(text, group){
  text.textAlign = 'center';
  text.textBaseline = 'bottom';
  text.anchor.x = ThreeUI.anchors.center;
  text.anchor.y = ThreeUI.anchors.bottom;
  
  text.setParent( group);  
}

function shareApp() {
  console.log('fenxiang!');
  // wx.showShareMenu({withShareTicket:true})
  wx.shareAppMessage({
    title: '小白逃生'
  })
}

window.setUiDirFile = function(text){
  textDirFile.text = text
}

window.showPassLevel = function(){
  groupTut.visible = false;
  groupTut_01.visible = false;
  groupPlaying.visible = false;
  groupPassLevel.visible = true;
  groupStart.visible = true;
}

module.exports = PlaceUi;
// window.placeUi = placeUi;