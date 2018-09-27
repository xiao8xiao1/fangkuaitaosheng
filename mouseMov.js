import * as THREE from './libs/threejs/three'
var initMouseMov = function (renderer, scene, camera, groups, groupPlaying){
    var ray, pointerVector, selectMesh, plane = null, planeXY, planeXZ, planeYZ, _dragging = false, mov;
    var startPos = new THREE.Vector2();
    var mov2 = new THREE.Vector2();
    var eye = new THREE.Vector3();
    var selectMeshInitPos = new THREE.Vector3(0, 0, 0);
    var scope = this;

    // var axis3o = new THREE.Vector3(0, 0, 0), axis3x = new THREE.Vector3(1, 0, 0), axis3y = new THREE.Vector3(0, 1, 0), axis3z = new THREE.Vector3(0, 0, 1);
    // var ortho = new THREE.Vector2(0, 0), orthx = new THREE.Vector2(0, 0), orthy = new THREE.Vector2(0, 0), orthz = new THREE.Vector2(0, 0);
    // var ox = new THREE.Vector2(0, 0), oy = new THREE.Vector2(0, 0), oz = new THREE.Vector2(0, 0), screenDir = new THREE.Vector2(0, 0);
    // var lengthOx = 0, lengthOy = 0, lengthOz = 0;
  
    var planeInitPos = new THREE.Vector3(0, 0, 0);
    var chooseDir = new THREE.Vector3(0, 0, 0);
    var movedSteps = new THREE.Vector3(0, 0, 0);
    {
      var planeGeometry = new THREE.PlaneBufferGeometry(window.innerWidth , window.innerHeight, 2, 2);
      var planeMaterial = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide, color: 0x808000 });
  
      planeXY = new THREE.Mesh(planeGeometry, planeMaterial); scene.add(planeXY);
      planeXZ = new THREE.Mesh(planeGeometry, planeMaterial); scene.add(planeXZ); planeXZ.rotation.set(Math.PI / 2, 0, 0);
      planeYZ = new THREE.Mesh(planeGeometry, planeMaterial); scene.add(planeYZ); planeYZ.rotation.set(0, Math.PI / 2, 0);
  
      ray = new THREE.Raycaster();
      pointerVector = new THREE.Vector2();
      mov = new THREE.Vector3();
      // renderer.domElement.addEventListener("mousedown", onPointerDown, false);
      // renderer.domElement.addEventListener("mousemove", onPointerMove, false);
      // renderer.domElement.addEventListener("mouseup", onPointerUp, false);
      canvas.addEventListener('touchstart', onPointerDown)
      canvas.addEventListener('touchmove', onPointerMove)
      canvas.addEventListener('touchend', onPointerUp)    
    }
  
    function onPointerDown(event) {
      if (!groupPlaying.visible)  {
        scope.controls.enabled = false;
        return;
      }

      scope.controls.enabled = true;
        
      movedSteps.set(0, 0, 0);
      _dragging = false;
      if (event.button !== undefined && event.button !== THREE.MOUSE.LEFT) return;
      var pointer = event.changedTouches ? event.changedTouches[0] : event;
  
      if (pointer.button === THREE.MOUSE.LEFT || pointer.button === undefined) {
        var intersect = intersectObjects(pointer, groups);
        if (intersect) {
          event.preventDefault();
          event.stopPropagation();
          startPos.x = pointer.clientX; startPos.y = pointer.clientY;
          selectMesh = intersect.object;
  
          planeXY.position.copy(intersect.point); planeXZ.position.copy(intersect.point); planeYZ.position.copy(intersect.point);
          // move at self_axis begin
          // selectMesh.matrixWorld.extractBasis (axis3x, axis3y, axis3z);  
          // planeXY.quaternion.copy(selectMesh.quaternion);
          // planeXZ.quaternion.copy(selectMesh.quaternion);  planeXZ.rotateOnWorldAxis(axis3x.normalize(), Math.PI/2);
          // planeYZ.quaternion.copy(selectMesh.quaternion);  planeYZ.rotateOnWorldAxis(axis3y.normalize(), Math.PI/2);
          // move at self_axis end
  
          planeXY.updateMatrixWorld(); planeXZ.updateMatrixWorld(); planeYZ.updateMatrixWorld();
          selectMeshInitPos.copy(selectMesh.position);
          planeInitPos.copy(intersect.point);
          plane = null;
          _dragging = true;
          scope.controls.enabled = false;
          return;
        }
      }
    }
    function minNearest(ox, oy) {
      var oxN = ox.clone().normalize();
      var oyN = oy.clone().normalize();
      var xy = Math.abs(oxN.dot(oyN));
      if (xy > 0.99) {
        if (ox.lengthSq() > oy.lengthSq()) {
          oy.set(0, 0);
        }
        else {
          ox.set(0, 0);
        }
      }
    }
  
    function onPointerMove(event) {
      if (!groupPlaying.visible)  return;
      if (_dragging === false)
        return;
      event.preventDefault();
      event.stopPropagation();
      var pointer = event.changedTouches ? event.changedTouches[0] : event;
  
      if (pointer.button === 0 || pointer.button === undefined) {
        mov2.x = pointer.clientX - startPos.x;
        mov2.y = startPos.y - pointer.clientY;
        if (Math.abs(mov2.x) <= 2 && Math.abs(mov2.y) <= 2)
          return;
        // console.log("mouse move", mov2.x, mov2.y)
        if (plane === null) {
          chooseDir.copy(selectMesh.getGroupDir());
          eye.copy(camera.position).sub(selectMesh.position);
          if (chooseDir.x === 1) {
            plane = planeXY;
            if (Math.abs(eye.y) > Math.abs(eye.z))
              plane = planeXZ;
          }
          else if (chooseDir.y === 1) {
            plane = planeXY;
            if (Math.abs(eye.x) > Math.abs(eye.z))
              plane = planeYZ;
          }
          else if (chooseDir.z === 1) {
            plane = planeXZ;
            if (Math.abs(eye.x) > Math.abs(eye.y))
              plane = planeYZ;
          }
          else
            console.log("chooseDir error.", chooseDir);
          // movSound.currentTime = 0;   movSound.play();
        }
        var intersect = intersectObjects(pointer, [plane]);
        if (intersect) {
          mov.copy(intersect.point).sub(planeInitPos);
          var ActMov = chooseDir.clone();
          ActMov.multiplyScalar(mov.dot(chooseDir))
  
          // selectMesh.position.copy(selectMeshInitPos).add(ActMov);	selectMesh.__dirtyPosition = true;
          movedSteps = selectMesh.moveGroup(ActMov, selectMeshInitPos);
          console.log('move',movedSteps)
          plane.position.copy(intersect.point);
          plane.updateMatrixWorld();
          selectMesh.updateMatrixWorld();
        }
      }
    }
  
    function onPointerUp(event) {
      if (!groupPlaying.visible)  return;
      // console.log('up',movedSteps)
      if (movedSteps.x != 0 || movedSteps.y != 0|| movedSteps.z != 0)
      {
        scope.dispatchEvent({ type: 'moved' });
      }

      if (selectMesh){
        selectMesh.onPointerUp(movedSteps, selectMeshInitPos);
        scope.controls.enabled = true;
      }
      event.preventDefault();
      selectMesh = null;
      movedSteps.set(0, 0, 0);
      _dragging = false;
      plane = null;
    }
  
    function intersectObjects(pointer, objects) {
      var rect = renderer.domElement.getBoundingClientRect();
      var x = (pointer.clientX - rect.left) / rect.width;
      var y = (pointer.clientY - rect.top) / rect.height;
  
      pointerVector.set((x * 2) - 1, - (y * 2) + 1);
      ray.setFromCamera(pointerVector, camera);
  
      var intersections = ray.intersectObjects(objects, false);
      return intersections[0] ? intersections[0] : false;
    }
  }

  initMouseMov.prototype = Object.create( THREE.EventDispatcher.prototype );
  initMouseMov.prototype.constructor = initMouseMov;  

  module.exports = initMouseMov;