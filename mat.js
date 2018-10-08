import * as THREE from './libs/threejs/three'
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

var matPools = []
var Mat = function(){
    var numberOfSphersPerSide = 5;
    var stepSize = 1.0 / numberOfSphersPerSide;
    for ( var alpha = 0, alphaIndex = 0; alpha <= 1.0; alpha += stepSize, alphaIndex ++ ) {

        var specularShininess = Math.pow( 2, alpha * 10 );

        for ( var beta = 0; beta <= 1.0; beta += stepSize ) {

            var specularColor = new THREE.Color( beta * 0.2, beta * 0.2, beta * 0.2 );

            for ( var gamma = 0; gamma <= 1.0; gamma += stepSize ) {

                // basic monochromatic energy preservation
                var diffuseColor = new THREE.Color().setHSL( alpha, 0.5, gamma * 0.5 + 0.1 ).multiplyScalar( 1 - beta * 0.2 );

                var material = new THREE.MeshPhongMaterial( {
                    // map: imgTexture,
                    // bumpMap: imgTexture,
                    // bumpScale: bumpScale,
                    color: diffuseColor,
                    specular: specularColor,
                    reflectivity: beta,
                    shininess: specularShininess,
                    // envMap: null//alphaIndex % 2 === 0 ? null : reflectionCube
                } );
                matPools.push(material);
            }
        }
    }
    this.index = 0;
    this.getMat = function(){
        if (this.index++ >  matPools.length)
            this.index = 0;
        return matPools[this.index]
    }

}
module.exports = Mat;
