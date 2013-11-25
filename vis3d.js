/* global d3, ko, THREE*/
'use strict';

function makeModelPlot(model) {
    //var renderer = new THREE.WebGLRenderer();
    var renderer = new THREE.CanvasRenderer();
    var width = 480, height = 450;
    renderer.setSize(width, height);
    document.getElementById('vis3d').appendChild(renderer.domElement);
    var camera = new THREE.PerspectiveCamera(45, width / height, 1, 500);
    camera.position.set(0, 0, 100);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    var scene = new THREE.Scene();

    var material = new THREE.LineBasicMaterial({
        color: 0x0000ff,
        vertexColors: THREE.VertexColors,
        linewidth: 3
    });

    var geometry = new THREE.Geometry();
    var controls = new THREE.TrackballControls( camera, renderer.domElement );
    var line = new THREE.Line(geometry, material);
    scene.add(line);
    scene.add(new THREE.AxisHelper(30));

    var i, x, y, z, v, colors = [], c, nPts = 100;
    for (i = 0; i < nPts; i++) {
        x = model.mean.x();
        y = model.mean.y();
        z = model.mean.z();
        v = new THREE.Vector3(x,y,z);
        geometry.vertices.push(v);
        c = new THREE.Color( 0xffffff );
        c.setHSL( 0.67, 1.0, .5 + .5*(nPts - i - 1)/(nPts - 1) );
        colors.push(c);
    }

    geometry.colors = colors;

    function animate() {
        var x, y, z, v;
        requestAnimationFrame( animate );
    
        x = model.mean.x();
        y = model.mean.y();
        z = model.mean.z();
        v = new THREE.Vector3(x,y,z);
        geometry.vertices.push(v);
        geometry.vertices.shift();
        geometry.verticesNeedUpdate = true;
        //geometry.colorsNeedUpdate = true;

        renderer.render(scene, camera);
        controls.update();

    }
    animate();
}

