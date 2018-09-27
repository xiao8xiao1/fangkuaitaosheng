var DisplayObject = require('./DisplayObject.js');

var MvCvsSprite = function(ui, asset, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height) {
    DisplayObject.bind(this)(ui, x, y, width, height);
    this.asset = asset;
    this.sourceX = sourceX
    this.sourceY = sourceY
    this.sourceWidth = sourceWidth;
    this.sourceHeight = sourceHeight;
    this.startY = undefined;
    this.moveY = 0;
    this.onMoveThis = this.onMove.bind(this);
    this.onUpThis = this.onUp.bind(this);   
    this.onClick(() => {
        console.info('You got me!');
        window.addEventListener('mousemove', this.onMoveThis);
        window.addEventListener('mouseup',this.onUpThis);
    });
};
MvCvsSprite.prototype = Object.create(DisplayObject.prototype);
MvCvsSprite.prototype.draw = function(context, x, y, width, height) {
    context.drawImage(this.asset, this.sourceX, this.sourceY, this.sourceWidth, this.sourceHeight, x, y, width, height);
};
// wx.onTouchMove(
MvCvsSprite.prototype.onMove = function (e) {
    var canvasPos = {x:0, y:0};
    canvasPos = ui.windowToUISpace(e.clientX, e.clientY)
    if (this.startY === undefined) {
        this.startY = canvasPos.y + this.moveY;
    }
    this.moveY = this.startY - canvasPos.y;
    console.log(this.moveY);
    this.sourceY = this.moveY;
    ui.shouldReDraw = true;
}
// wx.onTouchEnd(
MvCvsSprite.prototype.onUp = function (e) {
    this.startY = undefined;
    if (this.moveY < 0) { // 到顶
        this.moveY = 0;
    } else if (this.moveY > this.asset.height - this.height) { // 到底
        this.moveY = this.asset.height - this.height;
    }
    console.log(this.moveY);
    this.sourceY = this.moveY;
    ui.shouldReDraw = true;
    window.removeEventListener('mousemove', this.onMoveThis);
    window.removeEventListener('mouseup', this.onUpThis);
};

module.exports = MvCvsSprite;