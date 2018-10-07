import './libs/weapp-adapter/index'
import './libs/symbol'
import * as THREE from './libs/threejs/three'
import './libs/threejs/controls/OrbitControls'
// import TWEEN from './libs/threejs/tween.min'
var InitMouseMov = require('mouseMov.js');
var TWEEN = require('./libs/threejs/Tween')
var AssetLoader = require('./libs/threejs/threeUi/AssetLoader');
var ThreeUI = require('./libs/threejs/threeUi/ThreeUI.js');
var PlaceUi = require('ui.js');


AssetLoader.add.image('images/fenxiang.png');
AssetLoader.add.image('images/paihang.png');
AssetLoader.add.image('images/message.png');
AssetLoader.add.image('images/mute_off.png');
AssetLoader.add.image('images/mute_on.png');
AssetLoader.add.image('images/suc.png');
AssetLoader.add.image('images/return.png');
AssetLoader.add.image('images/levels.png');
AssetLoader.add.image('images/scroll_r.png');
AssetLoader.add.image('images/star-on.png');
AssetLoader.add.image('images/left.png');
AssetLoader.add.image('images/up.png');
AssetLoader.add.image('images/l.png');
AssetLoader.add.image('images/r.png');

AssetLoader.load(main);

window.levelDirs = ['帮助','水瓶座','双鱼座','白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','魔羯座']
window.DirDiff = [0,0,1,0,1,1,2,2,2,3,3,3,3]

var camera, scene, controls, renderer, ui, placeUi, initMouseMov;
var bgPlane = null;
var rooms = [];
var groups = [];
var roomEdges = null;
var outDoor , movDoors = [];
var fallTweens = [];
var arrMovStepRec = [];
var msheOpas = [];

var fs = wx.getFileSystemManager();

// fs.readdir({dirPath:'levels', complete:function(res){console.log(res)}})
// var files1 = fs.readdirSync('levels')
// console.log(files1)
window.currentDirIndex = 0;
window.currentFileIndex = 0;
var globleDef_string ;
var globleDef ;
var groupsDef ;
var cubeCntX ;
var cubeCntY ;
var cubeCntZ ;
var midP;
var cubeLen = 100;
var cubeShowLen = cubeLen * 0.8;
var groupCubeShowLen = cubeShowLen + 2;

var colorGroupLady = 0xffffff;
var colorGroup = 0x00f000;
// var fallSound = new Audio('audio/bullet.mp3');
var fallSound = wx.createInnerAudioContext();  fallSound.src = 'audio/bullet.mp3';

var colNoMovSound = new Audio('audio/colnomov.mp3');
var colSound = new Audio('audio/ding.mp3');
// var colSound = fallSound;
var winSound = new Audio('audio/level_complete.wav');
// var groundSound = new Audio('audio/fall_2.mp3');
// groundSound.loop = true
// groundSound.play()

wx.showShareMenu()
wx.onShareAppMessage(function () {
  console.log('shared')
  // 用户点击了“转发”按钮
  return {
    title: '转发标题'
  }
})  

function main(){
  // wx.authorize({scope: 'scope.getUserInfo'})  
  // wx.login({
  //   success: function () {
  //     wx.getUserInfo()
  //   }
  // })  
  // var button = wx.createUserInfoButton(
  //   { type: 'text' , 
  //   text: '获取用户信息' , 
  //   style: { left: 10 , top: 76 , width: 200 , height: 40 , lineHeight: 40 , backgroundColor: '#ff0000' , color: '#ffffff' , textAlign: 'center' , fontSize: 16 , borderRadius: 4 } 
  //   }) 
  //   button.onTap(
  //     (res) => { console.log(res) ;button.hide()}
      
  //   )
  [window.currentDirIndex, window.currentFileIndex] = getDirLevel();
  init();
  // initCubes();
  ui.addEventListener ('start', function(e) {initCubes();});
  // ui.addEventListener ('home', removeCubes);  
  ui.addEventListener ('selectDirFile', function(e){
    window.currentDirIndex = e.dirIndex;  window.currentFileIndex = e.fileIndex;
    setDirLevel(window.currentDirIndex, window.currentFileIndex)
    removeCubes()
    arrMovStepRec = [];
    initCubes()
  });
  
  ui.addEventListener ('thisAgain', function(e){
    removeCubes()
    arrMovStepRec = [];
    initCubes()
  });  

  ui.addEventListener ('playBack', function(e){
    removeCubes()
    initCubes(playBack)
  });  

  ui.addEventListener ('next', function(e){
    removeCubes();
    passDirLevel()
    arrMovStepRec = [];
    initCubes();
  });  
  
  animate();
}

var groupMaterial;
var uniforms1 = {time: { value: 1.0 }};
var clock = new THREE.Clock();
function initMat() {
  var fragment_shader4 = '\
  uniform float time;\
  varying vec2 vUv;\
  void main( void ) {\
    vec2 position = - 1.0 + 2.0 * vUv;\
    float red = abs( sin( position.x * position.y + time / 5.0 ) );\
    float green = abs( sin( position.x * position.y + time / 4.0 ) );\
    float blue = abs( sin( position.x * position.y + time / 3.0 ) );\
    gl_FragColor = vec4( red, green, blue, 0.5 );\
  }'
  var fragment_shader3 = '\
  uniform float time;\
  varying vec2 vUv;\
  void main( void ) {\
    vec2 position = vUv;\
    float color = 0.0;\
    color += sin( position.x * cos( time / 15.0 ) * 80.0 ) + cos( position.y * cos( time / 15.0 ) * 10.0 );\
        color += sin( position.y * sin( time / 10.0 ) * 40.0 ) + cos( position.x * sin( time / 25.0 ) * 40.0 );\
    color += sin( position.x * sin( time / 5.0 ) * 10.0 ) + sin( position.y * sin( time / 35.0 ) * 80.0 );\
    color *= sin( time / 10.0 ) * 0.5;\
    gl_FragColor = vec4( vec3( color, color * 0.5, sin( color + time / 3.0 ) * 0.75 ), 1.0 );\
  }';
  var fragment_shader2 = '\
  uniform float time;\
  uniform sampler2D texture;\
  varying vec2 vUv;\
  void main( void ) {\
    vec2 position = - 1.0 + 2.0 * vUv;\
    float a = atan( position.y, position.x );\
    float r = sqrt( dot( position, position ) );\
    vec2 uv;\
    uv.x = cos( a ) / r;\
    uv.y = sin( a ) / r;\
    uv /= 10.0;\
    uv += time * 0.05;\
    vec3 color = texture2D( texture, uv ).rgb;\
    gl_FragColor = vec4( color * r * 1.5, 1.0 );\
  }';
  
  var fragment_shader1 = '\
    uniform float time;\
    varying vec2 vUv;\
    void main(void) {\
      vec2 p = - 1.0 + 2.0 * vUv;\
      float a = time * 40.0;\
      float d, e, f, g = 1.0 / 40.0 ,h ,i ,r ,q;\
      e = 400.0 * ( p.x * 0.5 + 0.5 );\
      f = 400.0 * ( p.y * 0.5 + 0.5 );\
      i = 200.0 + sin( e * g + a / 150.0 ) * 20.0;\
      d = 200.0 + cos( f * g / 2.0 ) * 18.0 + cos( e * g ) * 7.0;\
      r = sqrt( pow( abs( i - e ), 2.0 ) + pow( abs( d - f ), 2.0 ) );\
      q = f / r;\
      e = ( r * cos( q ) ) - a / 2.0;\
      f = ( r * sin( q ) ) - a / 2.0;\
      d = sin( e * g ) * 176.0 + sin( e * g ) * 164.0 + r;\
      h = ( ( f + d ) + a / 2.0 ) * g;\
      i = cos( h + r * p.x / 1.3 ) * ( e + e + a ) + cos( q * g * 6.0 ) * ( r + h / 3.0 );\
      h = sin( f * g ) * 144.0 - sin( e * g ) * 212.0 * p.x;\
      h = ( h + ( f - e ) * q + sin( r - ( a + h ) / 7.0 ) * 10.0 + i / 4.0 ) * g;\
      i += cos( h * 2.3 * sin( a / 350.0 - q ) ) * 184.0 * sin( q - ( r * 4.3 + a / 12.0 ) * g ) + tan( r * g + h ) * 184.0 * cos( r * g + h );\
      i = mod( i / 5.6, 256.0 ) / 64.0;\
      if ( i < 0.0 ) i += 4.0;\
      if ( i >= 2.0 ) i = 4.0 - i;\
      d = r / 350.0;\
      d += sin( d * d * 8.0 ) * 0.52;\
      f = ( sin( a * g ) + 1.0 ) / 2.0;\
      gl_FragColor = vec4( vec3( f * i / 1.6, i / 2.0 + d / 13.0, i ) * d * p.x + vec3( i / 1.3 + d / 8.0, i / 2.0 + d / 18.0, i ) * d * ( 1.0 - p.x ), 1.0 );\
    }';

  var vertexShader ='\
    varying vec2 vUv;\
    void main(){\
      vUv = uv;\
      vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\
      gl_Position = projectionMatrix * mvPosition;\
    }';

  groupMaterial = new THREE.ShaderMaterial( {
    uniforms: {time: { value: 1.0 }},//uniforms1,
    vertexShader: vertexShader,
    fragmentShader: fragment_shader4
  } );    
}

var matShaderRgb = new THREE.ShaderMaterial( {
  uniforms: {},
  vertexShader: [
    "varying vec2 vUV;",
    "varying vec3 vNormal;",
    "void main() {",
      "vUV = uv;",
      "vNormal = vec3( normal );",
      "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
    "}"
  ].join("\n"),
  fragmentShader: [
    "varying vec2 vUV;",
    "varying vec3 vNormal;",
    "void main() {",
      "vec4 c = vec4( abs( vNormal ) + vec3( vUV, 0.0 ), 0.0 );",
      "gl_FragColor = c;",
    "}"
  ].join("\n")
} );

function animate() {
  // var delta = clock.getDelta();
  // uniforms1.time.value += delta * 5;
  // uniforms2.time.value = clock.elapsedTime;  
  TWEEN.update();
  requestAnimationFrame(animate);
  // renderer.render(scene, camera);

  renderer.clear();
  renderer.render( scene, camera );
  ui.render(renderer);
}

function getDirLevel(){
  var dirIndex = 0, levelIndex = 0;
  try
  {
    var DirLevel = fs.readFileSync(`${wx.env.USER_DATA_PATH}/level.txt`,"ascii").split(',')
    var dirIndex = Number(DirLevel[0]);  var levelIndex = Number(DirLevel[1]);
  }
  catch(errMsg)
  {
    console.log(errMsg)
  }
  return [dirIndex, levelIndex];
}

function setDirLevel(dirIndex, fileIndex){
  var text = ''+dirIndex+','+fileIndex
  try
  {
    fs.writeFileSync(`${wx.env.USER_DATA_PATH}/level.txt`,text,"ascii")
  }
  catch(errMsg)
  {
    console.log(errMsg)
  }
}

function passDirLevel(){
  var files = fs.readFileSync('levels/'+window.levelDirs[window.currentDirIndex]+'/dir.txt', "ascii").split("\r\n");
  files.length --;
  console.log(files)
  if (window.currentFileIndex + 1 < files.length)
    window.currentFileIndex++
  else if (window.currentDirIndex + 1 < window.levelDirs.length){
    window.currentDirIndex++;
    window.currentFileIndex = 0;
  }
  else{
    console.log('pass all levels')
    window.currentDirIndex = 0
    window.currentFileIndex = 0
  }
  setDirLevel(window.currentDirIndex, window.currentFileIndex)
}

function init() {
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.autoClear = false; // To allow render overlay on top of sprited sphere
  scene = new THREE.Scene();
  // scene.background = new THREE.Color(window.bgColor);//0xc2ebce);

  ui = new ThreeUI(renderer.domElement, window.innerHeight, true);  
  placeUi = new PlaceUi(ui);

  // camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 2000);
  var w = Math.sqrt(400*400 + 400*400), h = w* window.innerHeight/window.innerWidth
  console.log(w, h)
  camera = new THREE.OrthographicCamera( -w/2, w/2, h/2, -h/2, 1, 2000 );
  // camera.position.set( w/2, h/2, 1000);
  //  camera.position.set(0, 0, 1000);
  scene.add(camera)
  camera.remove(bgPlane)
  bgPlane = creatGradPlane(0,0, -1500, w, h, [[0, '#fc3'], [1, '#fcc']])
  camera.add(bgPlane);  

  var axesHelper = new THREE.AxesHelper(400);
  scene.add(axesHelper);
  


  initMouseMov = new InitMouseMov(renderer, scene, camera, groups, placeUi.groupPlaying);
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  initMouseMov.controls = controls;
  // controls.enablePan = false;  
}

function creatGradPlane(x,y,z, w,h, colors ,startX, startY, endX, endY){
  if (startX === undefined){
      startX= 0;  startY = 0;
      endX = 0; endY = h;
  }
  var canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  var ctx = canvas.getContext('2d');

  var gradient = ctx.createLinearGradient(startX, startY, endX, endY);
  if(Array.isArray(colors))
  colors.forEach(element => {
      gradient.addColorStop(element[0], element[1]);
  });
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  var texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  var material = new THREE.SpriteMaterial( {map: texture} );
  material.map.minFilter = THREE.LinearFilter;
  var sprite = new THREE.Sprite(material);
  sprite.scale.set(w, h , 1)
  sprite.position.set(x,y,z)
  return sprite;
}

function removeCubes(){
  for (var i = 0; i < groups.length; ++i){
    scene.remove(groups[i]);
  }
  // groups = [];
  groups.splice(0,groups.length);

  msheOpas.forEach(function(item){
    scene.remove(item);
    item = null;
  })
  msheOpas.splice(0,msheOpas.length);

  rooms = [];
  scene.remove(roomEdges);
  roomEdges = null;

  TWEEN.removeAll();
  movDoors.forEach(function(item){ 
    scene.remove(item); 
    item = null;
  })
  movDoors = []
  scene.remove(outDoor);  
  outDoor = null;  
  
  placeUi.groupTut.visible = false;  
  placeUi.groupTut_01.visible = false;  
}
function initCubes(funcPlayBack) {
  if (window.currentDirIndex > window.levelDirs.length)
    window.currentFileIndex = 0;
  var files = fs.readFileSync('levels/'+window.levelDirs[window.currentDirIndex]+'/dir.txt', "ascii").split("\r\n");
  files.length--;
  if (window.currentFileIndex >= files.length)
    window.currentFileIndex = 0;  

  globleDef_string = fs.readFileSync('levels/'+window.levelDirs[window.currentDirIndex]+'/'+files[window.currentFileIndex], "ascii");
  var temp = files[window.currentFileIndex].split(".");
  window.setUiDirFile(window.levelDirs[window.currentDirIndex] +' : '+ temp[0])
  globleDef = JSON.parse(globleDef_string);
  groupsDef = globleDef.groupsDef;
  cubeCntX = new Number(globleDef.cubeCntX);
  cubeCntY = new Number(globleDef.cubeCntY);
  cubeCntZ = new Number(globleDef.cubeCntZ);
  midP = new THREE.Vector3((cubeCntX / 2 - 0.5) * cubeLen, (cubeCntY / 2 - 0.5) * cubeLen, (cubeCntZ / 2 - 0.5) * cubeLen);

  var w = Math.sqrt(cubeCntX*cubeCntX + cubeCntZ*cubeCntZ)*cubeLen, h = w* window.innerHeight/window.innerWidth
  camera.left=-w/2;camera.right=w/2;camera.top=h/2;camera.bottom=-h/2;camera.near=1;camera.far=2000
  console.log(w, h)
  console.log(midP)
  camera.position.copy(midP); camera.position.z +=1000;
  camera.lookAt(midP.x, midP.y, midP.z);
  camera.updateProjectionMatrix()

  var index = window.currentFileIndex % placeUi.colors.length;
  camera.remove(bgPlane)
  bgPlane = creatGradPlane(0,0, -1500, w, h, [[0,placeUi.colors[index][0]], [1,placeUi.colors[index][1]]])
  camera.add(bgPlane);  

  controls.target.copy(midP);  controls.rotateLeft(Math.PI/4);  controls.rotateUp(Math.PI/6)
  controls.update();

  //room
  var geometry = new THREE.BoxGeometry(cubeCntX * cubeLen, cubeCntY * cubeLen, cubeCntZ * cubeLen);
  roomEdges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), 
                                  new THREE.LineBasicMaterial({ color: 0xf0f0f0, linewidth: 5 }));
  // var material = new THREE.MeshBasicMaterial({ color: 0x00ffff, opacity : 1 });
  // var geometry = new THREE.BoxGeometry(cubeCntX * cubeLen, cubeCntY * cubeLen, cubeCntZ * cubeLen);
  // var roomEdges = new THREE.Mesh(geometry, material);  
  roomEdges.position.copy(midP);
  scene.add(roomEdges);
  //room
  var materials = [];
  var startH = Math.floor(Math.random()*360);
  for ( var i = 0; i < 6; i ++ ) {
    startH += 60
    materials.push(new THREE.MeshBasicMaterial({
      color: 'hsla('+ startH +',50%,50%)' ,
      side: THREE.BackSide
    }));
  }
  var geometry = new THREE.BoxBufferGeometry( cubeCntX * cubeLen, cubeCntY * cubeLen, cubeCntZ * cubeLen );
  var mesh = new THREE.Mesh( geometry, materials );
  // mesh.position.copy(midP);
  roomEdges.add( mesh );

  // Cube
  var i, j, k;
  var index = 0;
  for (i = 0; i < cubeCntX; ++i)
    for (j = 0; j < cubeCntY; ++j)
      for (k = 0; k < cubeCntZ; ++k) {
        var room = new THREE.Vector3(i, j, k);
        rooms.push(room);
        room.index = index++;
        room.occupied = false;
      }

  for (var i = 0; i < groupsDef.length; ++i) {
    formOneGroup(groupsDef[i].s, groupsDef[i].e, groupsDef[i].lady);
  }

  fallTweens = [];
  for (var i = 0; i < groups.length; ++i)
    fallTweens.push(
      new TWEEN.Tween( groups[i].position ).to( groups[i].posTo, 200 ).delay(1000+i*250).
      onComplete(function() {
        fallSound.stop();
        fallSound.play();
      }).start()
    );

  // for (var i = 0; i < fallTweens.length-1; ++i)
  //   fallTweens[i].chain(fallTweens[i+1]);

  if (funcPlayBack)
    fallTweens[fallTweens.length-1].onComplete(function(){
      playBack();
    })
  else if (window.currentDirIndex === 0){
    fallTweens[fallTweens.length-1].onComplete(function(){
      if (window.currentFileIndex === 0) 
        initTut_0();
      else if (window.currentFileIndex === 1) 
        initTut_1();    
    })    
  }
    
  // fallTweens[0].delay(1000).start();
}

function initTut_0() {
  placeUi.groupTut.visible = true;
  // var rectTut1Height = placeUi.rectTut1.height;
  // new TWEEN.Tween( placeUi.rectTut1 ).delay(1000).to( {height:0}, 1000).start().onComplete(function(){
  //   placeUi.rectTut1.visible = false;
  //   placeUi.rectTut1.height = rectTut1Height;
  // })
  var p0 = groups[0].geometry.parameters;
  msheOpas[0] = new THREE.Mesh(new THREE.BoxGeometry(p0.width*0.99 , p0.height*0.99 , p0.depth*0.99), 
                                new THREE.MeshBasicMaterial({ color: 0xffffff, transparent :true, opacity :0.5 }));  
  msheOpas[0].position.copy(groups[0].position)  

  var p1 = groups[1].geometry.parameters;
  msheOpas[1] = new THREE.Mesh(new THREE.BoxGeometry(p1.width*0.99 , p1.height*0.99 , p1.depth*0.99), 
                                new THREE.MeshBasicMaterial({ color: 0xffffff, transparent :true, opacity :0.5 }));  
  msheOpas[1].position.copy(groups[1].position)  

  var p2 = groups[2].geometry.parameters;
  msheOpas[2] = new THREE.Mesh(new THREE.BoxGeometry(p2.width*0.99 , p2.height*0.99 , p2.depth*0.99), 
                                new THREE.MeshBasicMaterial({ color: 0xffffff, transparent :true, opacity :0.5 }));  
  msheOpas[2].position.copy(groups[2].position)  

  var t0 = new TWEEN.Tween( msheOpas[0].position ).delay(500).to( {x:50}, 500).repeat(Infinity)
  var t1 = new TWEEN.Tween( msheOpas[1].position ).delay(500).to( {y:50}, 500).repeat(Infinity)
  var t2 = new TWEEN.Tween( msheOpas[2].position ).delay(500).to( {z:400}, 500).repeat(Infinity)

  scene.add(msheOpas[0])
  t0.start()
  initMouseMov.addEventListener('moved', t0_1)

  function t0_1(){
    t0.stop();
    scene.remove(msheOpas[0])

    scene.add(msheOpas[1])
    t1.start()
    initMouseMov.removeEventListener('moved', t0_1);
    initMouseMov.addEventListener('moved', t1_2)
  }

  function t1_2(){
    t1.stop();
    scene.remove(msheOpas[1])

    scene.add(msheOpas[2])
    t2.start()
    initMouseMov.removeEventListener('moved',t1_2);
    initMouseMov.addEventListener('moved', Tut_end)
  }

  function Tut_end(){
    placeUi.groupTut.visible = false;
    t2.stop();
    scene.remove(msheOpas[2])    

    initMouseMov.removeEventListener('moved',Tut_end);
  }
}

function initTut_1() {
  controls.enabled = false;
  var rotL = {ms:500, degree:0.05};
  var tLeft = new TWEEN.Tween( rotL ).to({}, rotL.ms).onUpdate(function(target){
    controls.rotateLeft(target.degree);
    controls.update();
  });
  var tRight = new TWEEN.Tween( rotL ).to({}, rotL.ms).onUpdate(function(target){
    controls.rotateLeft(-target.degree);
    controls.update();
  });
  var tUp = new TWEEN.Tween( rotL ).to({}, rotL.ms).onUpdate(function(target){
    controls.rotateUp(-target.degree);
    controls.update();
  });
  var tDown = new TWEEN.Tween( rotL ).to({}, rotL.ms).onUpdate(function(target){
    controls.rotateUp(target.degree);
    controls.update();
  });
  tDown.onComplete(function(){
    controls.enabled = true;
    placeUi.groupTut_01.visible = true;
  });
  tLeft.chain(tRight)
  tRight.chain(tUp)
  tUp.chain(tDown)
  tLeft.start()
}

function Group(geometry, mat, posFrom, pos, s, e){
  THREE.Mesh.call(this, geometry, mat);
  this.position.copy(posFrom);  this.posTo = pos;
  this.start = s; this.end = e;
}

Group.prototype = Object.create(THREE.Mesh.prototype);
Group.prototype.getGroupDir =function(){
  var line = new THREE.Vector3(); 
  line.subVectors(rooms[this.end], rooms[this.start]).normalize();
  return line;    
}

Group.prototype.moveGroup = function (movVec, selectMeshInitPos) {
  var s = this.start;
  var e = this.end;
  var stepVec3 = new THREE.Vector3();
  var mov = getStepAxisVec3(movVec, stepVec3);
  var steps;
  if (mov === 0)
    return 0;

  if (mov > 0)
    steps = Math.ceil(mov / cubeLen);
  else
    steps = Math.floor(mov / cubeLen);
  steps = Math.abs(steps);

  var workVec3 = new THREE.Vector3();
  if (mov > 0)
    workVec3.set(rooms[e].x, rooms[e].y, rooms[e].z);
  else
    workVec3.set(rooms[s].x, rooms[s].y, rooms[s].z);

  for (var i = 1; i <= steps; ++i) {
    workVec3.add(stepVec3);
    var index = getIndexFromVec3(workVec3);
    if (rooms[index] === undefined || rooms[index].occupied) {
      if (this.lady === true && rooms[index] === undefined && stepVec3.z > 0) {
        console.log("succeed.");
      }
      else{
        if (rooms[index] === undefined){
            shakeGroup(this, i);
        }
        else {
            var temp = getGroupFromPos(workVec3);
            shakeGroup(temp, i);
        }
        break;
      }
    }
  }
  i--;

  if (i == steps) {
    this.position.copy(selectMeshInitPos).add(movVec);
  }
  else {
    this.position.copy(selectMeshInitPos).add(stepVec3.clone().multiplyScalar(i * cubeLen));
  }

  return stepVec3.multiplyScalar(i);
}


Group.prototype.onPointerUp = function (movedSteps, selectMeshInitPos) {
    if (!(movedSteps.x===0 && movedSteps.y===0 && movedSteps.z===0)) {
    arrMovStepRec.push([groups.indexOf(this), movedSteps.x, movedSteps.y, movedSteps.z]);
    var nowStartVec3 = new THREE.Vector3().copy(rooms[this.start]);
    var nowEndVec3 = new THREE.Vector3().copy(rooms[this.end]);
    nowStartVec3.add(movedSteps);
    nowEndVec3.add(movedSteps);
    if (this.lady === true && nowEndVec3.z >= cubeCntZ) {
      winSound.play();
      window.showPassLevel(1);
    }
    else {
      setRoomsOccupied(this.start, this.end, false);
      this.start = getIndexFromVec3(nowStartVec3);
      this.end = getIndexFromVec3(nowEndVec3);
      setRoomsOccupied(this.start, this.end, true);
      this.position.copy(selectMeshInitPos).add(movedSteps.multiplyScalar(cubeLen));
    }
  }
}

// Group.prototype = Object.assign( Object.create( THREE.Mesh.prototype ), {
//   constructor: Group,
//   getGroupDir: function(){
//     var line = new THREE.Vector3(); line.subVectors(rooms[this.end], rooms[this.start]).normalize();
//     return line;    
//   }
// })

function formOneGroup(s, e, lady) {
  var pos = new THREE.Vector3();
  pos.copy(rooms[s]).add((rooms[e])).divideScalar(2).multiplyScalar(cubeLen);
  var posFrom = pos.clone();  posFrom.y = cubeLen*cubeCntY*4;

  var size = new THREE.Vector3();
  size.copy(rooms[e]).sub(rooms[s]).multiplyScalar(cubeLen);

  if (size.x === 0)
    size.x = groupCubeShowLen;
  else
    size.x += cubeShowLen;
  if (size.y === 0)
    size.y = groupCubeShowLen;
  else
    size.y += cubeShowLen;

  if (size.z === 0)
    size.z = groupCubeShowLen;
  else
    size.z += cubeShowLen;

  // var material = new THREE.MeshBasicMaterial({ color:colorGroup });
  // var material = new THREE.MeshNormalMaterial()
  // var groupMaterial = new THREE.ShaderMaterial( {
  //   uniforms: {time: { value: 4096*Math.random() }},//uniforms1,
  //   vertexShader: vertexShader,
  //   fragmentShader: fragment_shader4
  // } );    
  var geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
  var group = new Group(geometry, matShaderRgb, posFrom, pos, s, e);

  scene.add(group); groups.push(group);
  var edges = new THREE.LineSegments(new THREE.EdgesGeometry(group.geometry), 
                                    new THREE.LineBasicMaterial({ color: 0x1000000 - colorGroup , linewidth: 5}));
  group.add(edges); group.edges = edges;
  if (lady === true) {
    group.lady = true;
    // group.material.color.setHex(colorGroupLady);
    group.material = new THREE.MeshBasicMaterial({ color:colorGroupLady });
    group.edges.material.color.setHex(0x888888)//0x1000000 - colorGroupLady);

    var outPos = new THREE.Vector3();
    getOutPosition(s, e, outPos); 
    // var outDoor = new THREE.Mesh(new THREE.BoxGeometry(cubeLen, cubeLen, cubeLen), 
    //                               new THREE.MeshBasicMaterial({ color: 0xffffff, opacity : 1 }));  
    outDoor = new THREE.Mesh( new THREE.CylinderBufferGeometry( 2, 10, 50, 12 ), new THREE.MeshNormalMaterial());
    outDoor.rotateX( Math.PI / 2 );    outDoor.position.copy(outPos);  outDoor.position.z -= 20
    scene.add(outDoor);
    var tmpPos = new THREE.Vector3().copy(outDoor.position);  tmpPos.z += 80
    var time = 4000
    new TWEEN.Tween( outDoor.position ).to(tmpPos, time).repeat(1000).start()

    for (var i = 0; i < 2; ++i){
      movDoors.push(new THREE.Mesh( new THREE.TorusBufferGeometry( 60, 4, 4, 4 ), 
                    new THREE.MeshBasicMaterial({ color: 0xffffff , transparent:true, opacity: 0.8}) ));  
      movDoors[i].position.copy(outPos); movDoors[i].position.z -= 50
      movDoors[i].rotation.set(0, 0, Math.PI / 4);

      scene.add( movDoors[i] );
      var t0 = new TWEEN.Tween( movDoors[i].scale ).to(new THREE.Vector3(1.5,1.5,1.5), time).repeat(1000)
      var t1 = new TWEEN.Tween(movDoors[i].material).to({opacity: 0}, time).repeat(1000)
      if (i == 0){
        t0.start();  t1.start();
      }
      else{
        setTimeout(function(){t0.start();  t1.start();}, time/2);
      }
    }
  }
  setRoomsOccupied(s, e, true);
}
function getOutPosition(s, e, outPos){
  var size = new THREE.Vector3();
  size.copy(rooms[e]).sub(rooms[s]).multiplyScalar(cubeLen);

  if (size.x === 0)
    outPos.x = rooms[e].x;
  else
    outPos.x = cubeCntX+0.5;

  if (size.y === 0)
    outPos.y = rooms[e].y;
  else
    outPos.y = cubeCntY+0.5;

  if (size.z === 0)
    outPos.z = rooms[e].z;
  else
    outPos.z = cubeCntZ;
  
  outPos.multiplyScalar(cubeLen);
}

function setRoomsOccupied(s, e, val) {
  var line = new THREE.Vector3(); line.subVectors(rooms[e], rooms[s]);
  var step = new THREE.Vector3(); step.copy(line).normalize();

  var endVec3 = new THREE.Vector3(rooms[e].x, rooms[e].y, rooms[e].z);
  endVec3.add(step);
  var workVec3 = new THREE.Vector3(rooms[s].x, rooms[s].y, rooms[s].z);

  for (; !workVec3.equals(endVec3); workVec3.add(step)) {
    var index = getIndexFromVec3(workVec3);
    rooms[index].occupied = val;

  }

}
function getIndexFromVec3(pos) {
  if (pos.x < 0 || pos.x >= cubeCntX || pos.y < 0 || pos.y >= cubeCntY || pos.z < 0 || pos.z >= cubeCntZ)
    return -1;

  return cubeCntY * cubeCntZ * pos.x + cubeCntZ * pos.y + pos.z;
}
function getVec3FromIndex(index) {
  var pos = new THREE.Vector3();
  pos.x = Math.floor(index / (cubeCntY * cubeCntZ));
  var yz = index - (cubeCntY * cubeCntZ) * pos.x;
  pos.z = yz % cubeCntZ;
  pos.y = Math.floor(yz / cubeCntZ);

  return pos;
}
function getStepAxisVec3(movVec, step) {
  if (movVec.x !== 0) {
    if (movVec.x > 0)
      step.set(1, 0, 0);
    else
      step.set(-1, 0, 0);
    return movVec.x;
  }
  else if (movVec.y !== 0) {
    if (movVec.y > 0)
      step.set(0, 1, 0);
    else
      step.set(0, -1, 0);
    return movVec.y;
  }
  else if (movVec.z !== 0) {
    if (movVec.z > 0)
      step.set(0, 0, 1);
    else
      step.set(0, 0, -1);
    return movVec.z;
  }
  return 0;
}



function getGroupFromPos(pos){
  var s, e;
  for (var i = 0; i < groups.length; ++i ){
        s = groups[i].start;  e = groups[i].end;
        console.log(i)
        console.log(rooms[s])
        console.log(pos)
        console.log(rooms[e])
        if (pos.x === rooms[s].x && pos.x === rooms[e].x && 
            pos.y === rooms[s].y && pos.y === rooms[e].y &&
            pos.z >=  rooms[s].z && pos.z <=  rooms[e].z){
              return groups[i];
            } else 
        if (pos.x === rooms[s].x && pos.x === rooms[e].x && 
            pos.z === rooms[s].z && pos.z === rooms[e].z &&
            pos.y >=  rooms[s].y && pos.y <=  rooms[e].y){
              return groups[i];
          } else 
        if (pos.z === rooms[s].z && pos.z === rooms[e].z && 
            pos.y === rooms[s].y && pos.y === rooms[e].y &&
            pos.x >=  rooms[s].x && pos.x <=  rooms[e].x){
              return groups[i];
          }
  }
  return null;
}

function shakeGroup(shakeedGroup, step){
  if (shakeedGroup === null)
      console.log('error')
  if (step == 1){
    colNoMovSound.currentTime = 0;   colNoMovSound.play();
  }
  else{
    colSound.currentTime = 0;   colSound.play();
  }
  // shakeedGroup.material.color.setHex(0xff0000);
  var t1 = new TWEEN.Tween(shakeedGroup.scale).to(new THREE.Vector3(0.9,0.9,0.9), 100)
  var t2 = new TWEEN.Tween(shakeedGroup.scale).to(new THREE.Vector3(1,1,1), 100)
  t1.chain(t2);
  t1.start();
}
function shakeOutSide(workVec3){}

function isIntersect(start1, end1, start2, end2) {
  var zero = new THREE.Vector3(0, 0, 0);
  if (start1 === start2 || start1 == end2 || end1 == start2 || end1 == end2)
    return true;

  var s1e1 = new THREE.Vector3(); s1e1.subVectors(end1, start1);
  var s1s2 = new THREE.Vector3(); s1e1.subVectors(start2, start1);
  var s1e2 = new THREE.Vector3(); s1e1.subVectors(end2, start1);

  var cross_s2 = new THREE.Vector3(); cross_s2.crossVectors(s1e1, s1s2);
  var cross_e2 = new THREE.Vector3(); cross_e2.crossVectors(s1e1, s1e2);

  if (cross_s2 === zero && cross_e2 === zero) {

  }
}

function playBack(){
  var movTweens = []
  for (var i = 0; i < arrMovStepRec.length; ++i) {
    var selectMesh = groups[arrMovStepRec[i][0]] ;
    var movedSteps = new THREE.Vector3(arrMovStepRec[i][1], arrMovStepRec[i][2], arrMovStepRec[i][3]) 
    var dstPostion = selectMesh.posTo.clone().add(movedSteps.multiplyScalar(cubeLen))
    var tween = new TWEEN.Tween(selectMesh.position).to(dstPostion, 1000).delay(1000)
    selectMesh.posTo.copy(dstPostion);
    movTweens.push(tween)
  }

  for (var i = 0; i < movTweens.length-1 ; ++i) 
    movTweens[i].chain(movTweens[i+1])

  movTweens[movTweens.length-1].onComplete(function(){
    winSound.play();
    window.showPassLevel(0);
  })
      
  movTweens[0].delay(1000).start()
}
