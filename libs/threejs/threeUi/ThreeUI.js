import * as THREE from '../three'
var anchors = require('./anchors.js');
var DisplayObject = require('./DisplayObject.js');
var BitmapText = require('./BitmapText.js');
var Rectangle = require('./Rectangle.js');
var Sprite = require('./Sprite.js');
var Text = require('./Text.js');
var MvCvsSprite = require('./MvCvsSprite.js');

// All properties that when adjusted will force a redraw of the UI
var dirtyProperties = ['x','y','width','height','rotation','alpha','visible','pivot','anchor','smoothing','stretch','offset','text','scale','parent','textAlign','assetPath','color','left','right','up','down','ActiveInvoke'];
var DPR = window.devicePixelRatio;  
console.log("devicePixelRatio="+DPR);
var observeDirtyProperties = function(object, ui) {
	dirtyProperties.forEach(function(prop) {
		var proxyKey = '_proxied_' + prop;

		// Make sure initial values are set first
		object[proxyKey] = object[prop];

		Object.defineProperty(object, prop, {
			set: function(value) {
				if (object[prop] !== value) {
					ui.shouldReDraw = true;
				}

				object[proxyKey] = value;
			},

			get: function() {
				return object[proxyKey];
			},
		});
	});
};

/**
 * ThreeUI
 *
 * UI Class that renders an internal 2d canvas onto a plane
 *
 * @param {HTMLCanvasElement} gameCanvas
 * @param {int} height The pixel height of this UI -- Default: 720
  */

var ThreeUI = function(gameCanvas, height) {
	this.displayObjects = [];
	this.eventListeners = {
		click: [],
	};

	this.gameCanvas = gameCanvas;
	this.height = height || 720;
	var gameCanvasAspect = this.gameCanvas.width / this.gameCanvas.height;
	this.width = this.height * gameCanvasAspect;

	this.clearRect = null;
	this.shouldReDraw = true;

	this.camera = new THREE.OrthographicCamera(
		-this.width* DPR / 2,
		this.width* DPR / 2,
		this.height* DPR / 2,
		-this.height* DPR / 2,
		1, 5
	);
	this.camera.position.z = 2;
	this.camera.lookAt(0,0,0)
	this.scene = new THREE.Scene();	
	this.movobjCnt = 0;
	this.hasMoved = false;

	this.addPlaneMov()
	this.prepareThreeJSScene();
	// Event listening
    // canvas.addEventListener('touchstart', this.clickHandler.bind(this));
	canvas.addEventListener('touchend', this.clickHandler.bind(this));
	console.log('uiCam', this.camera.position)
};

/**
 * Attach anchor types to ThreeUI
 */

ThreeUI.anchors = anchors;

ThreeUI.prototype = Object.assign( Object.create( THREE.EventDispatcher.prototype ), {constructor: ThreeUI})

/**
 * Internal method that does all preparations related to ThreeJS, creating the scene, camera, geometry etc.
 */
ThreeUI.prototype.prepareThreeJSScene = function() {
	var canvas = document.createElement('canvas');
	canvas.width = this.width * DPR;
	canvas.height = this.height * DPR;
	this.context = canvas.getContext('2d');
	// this.context.scale(DPR, DPR);
	this.context.scale(DPR*this.width/414, DPR*this.height/736)	
	this.context.fillStyle = "#0000ff";
	this.context.fillRect(0,0,50,50);

	this.texture = new THREE.Texture(canvas);
	var material = new THREE.MeshBasicMaterial({ map: this.texture , transparent : true});
	material.map.minFilter = THREE.LinearFilter;

	var planeGeo = new THREE.PlaneGeometry(this.width* DPR, this.height* DPR);
	console.log('plane', this.width* DPR, this.height* DPR)
	this.plane = new THREE.Mesh(planeGeo, material);
	this.plane.matrixAutoUpdate = false;
	this.plane.translateZ(1)
	// this.plane.updateMatrix()
	this.scene.add(this.plane);
	this.texture.needsUpdate = true;
	console.log('uiPlane', this.plane.position)
};

/**
 * Draw the UI
 */
ThreeUI.prototype.draw = function() {
	if (!this.shouldReDraw) return;
	// Reset canvas
	if (this.clearRect) {
		this.context.clearRect(this.clearRect.x, this.clearRect.y, this.clearRect.width, this.clearRect.height);
	} else {
		this.context.clearRect(0, 0, 414, 736);
		this.contextMov.clearRect(0, 0, 414, this.newHeightIphone6P);
	}
	var self = this;
	var length = this.displayObjects.length;
	this.movobjCnt = 0;
	for (var i = 0;i < length;i++) {
		if (!this.displayObjects[i].isMov)
			this.displayObjects[i].render(self.context);
		else{
			if (this.displayObjects[i].render(self.contextMov))
				this.movobjCnt++;
		}
	}

	// Make sure the texture gets re-drawn
	this.texture.needsUpdate = true;
	this.textureMov.needsUpdate = true;

	this.shouldReDraw = false;
};


/**
 * Render the UI with the provided renderer
 *
 * @param {THREE.WebGLRenderer} renderer
 */

ThreeUI.prototype.render = function(renderer) {
	this.draw();
	renderer.render(this.scene, this.camera);

	// if (this.colorReplace) {
	// 	this.context.save();

	// 	this.context.fillStyle = this.colorReplace
	// 	this.context.globalCompositeOperation = 'source-atop';
	// 	this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

	// 	this.context.restore();
	// }
};

/**
 * Create a new Sprite
 *
 * @param {string} imagePath
 * @param {int} x
 * @param {int} y
 * @param {int} width
 * @param {int} height
 *
 * @return {Sprite}
 */

ThreeUI.prototype.createSprite = function(imagePath, x, y, width, height) {
	var displayObject = new Sprite(this, imagePath, x, y, width, height);
	this.displayObjects.push(displayObject);
	observeDirtyProperties(displayObject, this);
	return displayObject;
};

/**
 * Create a new Sprite from a sheet
 *
 * @param {string} imagePath
 * @param {string} sheetImagePath
 * @param {string} sheetDataPath
 * @param {int} x
 * @param {int} y
 * @param {int} width
 * @param {int} height
 *
 * @return {Sprite}
 */

ThreeUI.prototype.createSpriteFromSheet = function(imagePath, sheetImagePath, sheetDataPath, x, y, width, height) {
	var displayObject = new Sprite(this, imagePath, x, y, width, height, sheetImagePath, sheetDataPath);
	this.displayObjects.push(displayObject);
	observeDirtyProperties(displayObject, this);
	return displayObject;
};

/**
 * Create a new Rectangle
 *
 * @param {string} color
 * @param {int} x
 * @param {int} y
 * @param {int} width
 * @param {int} height
 *
 * @return {Rectangle}
 */

ThreeUI.prototype.createRectangle = function(x, y, width, height, color, colorStop) {
	var displayObject = new Rectangle(this, x, y, width, height, color, colorStop);
	this.displayObjects.push(displayObject);
	observeDirtyProperties(displayObject, this);
	return displayObject;
};

ThreeUI.prototype.createGroup = function(x, y, width, height) {
	var displayObject = new DisplayObject(this, x, y, width, height);
	this.displayObjects.push(displayObject);
	observeDirtyProperties(displayObject, this);
	return displayObject;	
}

ThreeUI.prototype.createMvCvsSprite = function(asset, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height) {
	var displayObject = new MvCvsSprite(this, asset, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
	this.displayObjects.push(displayObject);
	observeDirtyProperties(displayObject, this);
	return displayObject;	
}
/**
 * Create a new Text
 *
 * @param {string} text
 * @param {string} font
 * @param {string} color
 * @param {int} x
 * @param {int} y
 *
 * @return {Text}
 */

ThreeUI.prototype.createText = function(text, size, font, color, x, y) {
	var displayObject = new Text(this, text, size, font, color, x, y);
	this.displayObjects.push(displayObject);
	observeDirtyProperties(displayObject, this);
	return displayObject;
};

/**
 * Create a new BitmapText
 *
 * @param {string} text
 * @param {string} font
 * @param {string} color
 * @param {int} x
 * @param {int} y
 *
 * @return {BitmapText}
 */

ThreeUI.prototype.createBitmapText = function(text, size, x, y, sheetImagePath, sheetDataPath) {
	var displayObject = new BitmapText(this, text, size, x, y, sheetImagePath, sheetDataPath);
	this.displayObjects.push(displayObject);
	observeDirtyProperties(displayObject, this);
	return displayObject;
};

/**
 * Add a new event listener, called by ThreeUI.DisplayObject
 * Shouldn't be used directly
 *
 * @param {string} type
 * @param {Function} callback This callback is called when the event is triggered, and is passed the DisplayObject as a first argument
 * @param {ThreeUI.DisplayObject} displayObject
 */

ThreeUI.prototype.UiAddEventListener = function(type, callback, displayObject) {
	this.eventListeners[type].push({
		callback: callback,
		displayObject: displayObject
	});
};

/**
 * Used internally to determine which registered click event listeners should be called upon click
 *
 * @param {MouseEvent} event
 */

ThreeUI.prototype.clickHandler = function(event) {
	if (this.hasMoved)	
		return;

	// Hack to make sure we're not doing double events
	var coords = null;
	if (typeof TouchEvent !== 'undefined' && event instanceof TouchEvent) {
		this.listeningToTouchEvents = true;

		if (event.changedTouches.length > 0) {
			coords = { x: event.changedTouches[0].pageX, y: event.changedTouches[0].pageY };
		} else if (event.pageX && event.pageY) {
			coords = { x: event.pageX, y: event.pageY };
		} else {
			this.listeningToTouchEvents = false;
		}
	} else {
		// Mouse event
		coords = { x: event.pageX, y: event.pageY };
		console.log('coords'+coords)		
	}

	if (this.listeningToTouchEvents && event instanceof MouseEvent || coords === null) return;

	// coords = this.windowToUISpace(coords.x, coords.y);
    if (this.planeMov){
        var coordsMov = {x:coords.x,
			y: coords.y + this.planeMov.position.y/DPR + (this.heightMovCanvas/DPR - this.height)/2 };
		coordsMov = this.uiToIphone6p(coordsMov.x, coordsMov.y);
	}
	coords = this.uiToIphone6p(coords.x, coords.y);

	var callbackQueue = [], callbackQueueMov = [];
	this.eventListeners.click.forEach(function(listener) {
		var displayObject = listener.displayObject;
		if (!displayObject.shouldReceiveEvents()) return;
		var bounds = displayObject.getBounds();
		if (!displayObject.isMov && ThreeUI.isInBoundingBox(coords.x, coords.y, bounds.x, bounds.y, bounds.width, bounds.height)) {
			// Put listeners in a queue first, so state changes do not impact checking other click handlers
			callbackQueue.push(listener);
		}
		else if (displayObject.isMov && ThreeUI.isInBoundingBox(coordsMov.x, coordsMov.y, bounds.x, bounds.y, bounds.width, bounds.height)) {
			// Put listeners in a queue first, so state changes do not impact checking other click handlers
			callbackQueueMov.push(listener);
		}
	});
	callbackQueue.forEach(function(listener){
		listener.callback.bind(listener.displayObject)();
	});
	if (callbackQueue.length === 0)
		callbackQueueMov.forEach(function(listener){
			listener.callback.bind(listener.displayObject)();
		});
}

/**
 * Helper method that converts a point to UI space from window space
 *
 * @param {int} x
 * @param {int} y
 *
 * @return {Object} x,y coordinates
 */

ThreeUI.prototype.windowToUISpace = function(x, y) {
	var bounds = this.gameCanvas.getBoundingClientRect();
	var scale = this.height / bounds.height;

	return {
		x: (x - bounds.left) * scale,
		y: (y - bounds.top) * scale,
	};
}

ThreeUI.prototype.uiToIphone6p = function(x, y) {
	return {
		x: x/this.width * 414,
		y: y/this.height * 736,
	};
}

/**
 * Moves a ui element to the back of the displayobject queue
 * which causes it to render above other objects
 *
 * @param {ThreeUI.DisplayObject} displayObject
 */
ThreeUI.prototype.moveToFront = function(displayObject) {
	var elIdx = this.displayObjects.indexOf(displayObject);

	if (elIdx > -1) {
		this.displayObjects.splice(elIdx, 1);
	}

	this.displayObjects.push(displayObject);
};

/**
 * Helper method used to determine whether a point is inside of a given bounding box
 *
 * @param {int} x
 * @param {int} y
 * @param {int} boundX
 * @param {int} boundY
 * @param {int} boundWidth
 * @param {int} boundHeight
 *
 * @return {bool}
 */

ThreeUI.isInBoundingBox = function(x, y, boundX, boundY, boundWidth, boundHeight) {
	return (
		x >= boundX &&
		x <= boundX + boundWidth &&
		y >= boundY &&
		y <= boundY + boundHeight
	);
};

var scope;
var DPR = window.devicePixelRatio
ThreeUI.prototype.addPlaneMov = function() {
    scope = this;
    this.startY = 0;
    this.enableMov();
    this.setPlaneMovHeight(this.height)
}
ThreeUI.prototype.setPlaneMovHeight = function(newHeight) {
	this.scene.remove(this.planeMov)
	this.newHeightIphone6P = newHeight;
	this.heightMovCanvas = newHeight/736*this.height * DPR;
	var canvas = document.createElement('canvas');
	canvas.width = this.width * DPR;
	canvas.height = this.heightMovCanvas;
	this.contextMov = canvas.getContext('2d');
	this.contextMov.scale(DPR*this.width/414, DPR*this.height/736)
	console.log('setPlaneMovHeight')
	console.log(this.newHeightIphone6P, this.heightMovCanvas)
	console.log(this.newHeightIphone6P/this.heightMovCanvas, 736/(this.height*DPR))

	this.textureMov = new THREE.Texture(canvas);
	var material = new THREE.MeshBasicMaterial({ map: this.textureMov , transparent : true});
	material.map.minFilter = THREE.LinearFilter;

	var planeGeo = new THREE.PlaneGeometry(canvas.width, canvas.height);
	this.planeMov = new THREE.Mesh(planeGeo, material);	
	this.planeMov.matrixAutoUpdate = false;
	this.planeMov.translateY(-0.5*(canvas.height - this.height*DPR))
	this.planeMov.translateZ(1)
	this.planeMov.updateMatrix()
	this.scene.add(this.planeMov);
	this.textureMov.needsUpdate = true;
	console.log('uiPlaneMov', this.planeMov.position)
}

ThreeUI.prototype.enableMov = function() {
	window.addEventListener('mousedown', onDown);

    window.addEventListener('touchstart',onDown);	
}
ThreeUI.prototype.disableMov = function() {
    window.removeEventListener('mousedown', onDown);
    window.removeEventListener('mousemove',onMove);
	window.removeEventListener('mouseup',onUp);

	window.removeEventListener( 'touchstart', onDown );
	window.removeEventListener( 'touchmove', onMove );	
	window.removeEventListener( 'touchend', onUp );
}
var startPosY, moveY, clickStartY;
function onDown(e) {
	if (scope.movobjCnt === 0)	return;

	if (typeof TouchEvent !== 'undefined' && e instanceof TouchEvent) {
		clickStartY = e.changedTouches[0].clientY;
	}            
	else{
		clickStartY = e.pageY;
	}		

    startPosY = scope.planeMov.position.y
    window.addEventListener('mousemove',onMove);
	window.addEventListener('mouseup',onUp);

    window.addEventListener('touchmove',onMove);
    window.addEventListener('touchend',onUp);	
}
function onMove(e) {
	if (scope.movobjCnt === 0)	return;

	var eClientY;
	if (typeof TouchEvent !== 'undefined' && e instanceof TouchEvent) {
		eClientY = e.changedTouches[0].clientY;
	}            
	else{
		eClientY = e.pageY;
	}
    moveY = clickStartY - eClientY;
	// console.log('moveY', moveY)	
	// if (moveY < 5 && moveY > -5)
	// 	return;
	moveY *= DPR
    scope.planeMov.position.y = startPosY + moveY;    scope.planeMov.updateMatrix()
	// console.log(scope.planeMov.position)
	scope.hasMoved = true;
}
function onUp(e) {
	if (scope.movobjCnt === 0)	return;

	var eClientY;
	if (typeof TouchEvent !== 'undefined' && e instanceof TouchEvent) {
		eClientY = e.changedTouches[0].clientY;
	}            
	else{
		eClientY = e.pageY;
	}	
    moveY = clickStartY - eClientY;
    var maxY = (scope.heightMovCanvas - scope.height*DPR)/2
	var minY = -maxY

	if (scope.planeMov.position.y < minY) {
        scope.planeMov.position.y = minY;  scope.planeMov.updateMatrix()
    } else if (scope.planeMov.position.y > maxY) {
        scope.planeMov.position.y = maxY;  scope.planeMov.updateMatrix()
    }
    window.removeEventListener('mousemove',onMove);
	window.removeEventListener('mouseup',onUp);   
	
	window.removeEventListener( 'touchmove', onMove );	
	window.removeEventListener( 'touchend', onUp );	
	scope.hasMoved = false;
};

// Export ThreeUI as module
module.exports = ThreeUI;

// Expose ThreeUI to the window
// window.ThreeUI = ThreeUI;
