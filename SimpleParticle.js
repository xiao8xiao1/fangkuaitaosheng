var SimpleParticle = function(camera)
{
var scope = this;
this.particles = [];

this.hide = function (idx){
  if (scope.particles[idx])
    for (var i = 0; i < scope.particles[idx].length; ++i) 
      scope.particles[idx][i].visible = false;
}
this.explode = function (x, y, idx) {
  if (!this.particles[idx]) {
      var colors = [0x00B6F1, 0x1800FF, 0xFF0000, 0xFEFF00, 0x00FF00]//, 0xf25346, 0xd8d0d1, 0x59332e, 0x23190f, 0xF5986E, 0xf4ce93, 0x68c3c0];
      this.materials = [];
      var geometry = new THREE.PlaneGeometry(10, 10);
      for (var i = 0; i < colors.length; ++i) {
          this.materials.push(new THREE.MeshBasicMaterial({ color: colors[i], transparent: true ,opacity: 1}));
      }
      this.particles[idx] = [];
      for (var i = 0; i < 100; ++i) {
          var particle = new THREE.Mesh(geometry, this.materials[i % colors.length]);
          particle.position.set(0, 0, -9.9);
          camera.add(particle);
          this.particles[idx].push(particle);
      }
  }
  var t1 = 1000;
  var t2 = 1000;
  for (var i = 0; i < this.particles[idx].length; ++i) {
      var x0 = x,
          y0 = y;
      this.particles[idx][i].visible = true;
      this.particles[idx][i].position.set(x0, y0, -9.9);
      this.particles[idx][i].rotation.z =  Math.random() * Math.PI/2;
      // 快速 随机左右散开，占 2/3
      var x1 = (1 - 2 * Math.random()) * camera.right + x0;
      var y1 = (1 - 2 * Math.random()) * camera.right + y0;
      var x11 = x0 + (x1 - x0) * 0.95;
      var y11 = y0 + (y1 - y0) * 0.95;
      var tn1 = new TWEEN.Tween(this.particles[idx][i].position).to({
        x: x11,
        y: y11
      }, t1)
      var tn2 = new TWEEN.Tween(this.particles[idx][i].position).to({
        x: x1,
        y: y1
      }, t2)//.onComplete(function(){hide(idx)})

      tn1.chain(tn2)
      tn1.start()
      new TWEEN.Tween(this.particles[idx][i].rotation).to({
        z: "+3"
      }, t1).start()
  }
  // for (var i = 0; i < this.materials.length; ++i) {
  //   this.materials[i].opacity = 1;
  //   new TWEEN.Tween(this.materials[i]).to({ opacity: 0}, t2).delay(t1).start()
  // }
}
}

module.exports = SimpleParticle;