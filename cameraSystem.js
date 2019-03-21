var camera, scene, renderer;
var container = document.getElementById( 'ThreeJS' );
var mouse = new THREE.Vector2();
var mouse = { x: 0, y: 0 };
var delta;
var updateFunctions = [];
var lastTimeMsec = null;
var composer, clearPass, texturePass, renderPass, cameraP, cubeTexturePassP, texture, effect, controls;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();
var damping = 7.0;

init();

function init() {
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog(0xFFFFFF, 1000, 2000);

	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 5, 20000);
	
	renderer = new THREE.WebGLRenderer( {antialias:true} );
	renderer.setSize(window.innerWidth, window.innerHeight);
	container.appendChild(renderer.domElement);

	var light = new THREE.AmbientLight( 0xffffff ); 
	scene.add( light );
	var light2 = new THREE.PointLight(0xffffff);
	light2.position.set(0,250,0);
	scene.add(light2);
}

var obstructionList = [];
var floor;
function addFloor(){
	var floorMaterial = new THREE.MeshBasicMaterial({
    color: 0x7DDC1F
  });
	var floorGeometry = new THREE.PlaneGeometry(10000, 10000, 100, 100);
	floor = new THREE.Mesh(floorGeometry, floorMaterial);
	floor.position.y = -0.5;
	floor.rotation.x = -90 * Math.PI / 180;
	scene.add(floor);
	floor.name = "floor";
	obstructionList.push(floor);
}
addFloor();

var wall1;
function addWall(){
	var wallMaterial = new THREE.MeshBasicMaterial({
    color: 0x000770,
		side: THREE.DoubleSide
  });
	var wallGeometry = new THREE.PlaneGeometry(500, 200, 10, 10);
	wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
	wall1.position.z = 200;
	wall1.name = "wall 01";
	scene.add(wall1);
	obstructionList.push(wall1);	
}
addWall();

var cube, cubePos;
function addCube(){
	var cubeMat = new THREE.MeshStandardMaterial({
	  color: 0x800080,
		wireframe: true
	});
	var cubeGeom = new THREE.CubeGeometry( 50, 50, 50 );
	cube = new THREE.Mesh( cubeGeom, cubeMat );
	cube.position.set(0, 25, 0);
	cube.name = "hero";
	scene.add( cube );
	obstructionList.push(cube);
}
addCube();

var zoom = 150;
function createRings(){
	var ringGeometry = new THREE.CircleGeometry(250, 32);
	ringGeometry.rotateX(-Math.PI / 2);
	ringGeometry.vertices.shift();
	var ringMaterial = new THREE.LineBasicMaterial({
		color: 0xCC0000,
		visible: false
	});
	ringMesh = new THREE.Line(ringGeometry, ringMaterial);
	ringMesh.rotation.y = Math.PI;
	scene.add(ringMesh);

	var ringGeometry2 = new THREE.CircleGeometry(250, 32);
	ringGeometry2.rotateY(-Math.PI / 2);
	ringGeometry2.vertices.shift();
	ringMesh2 = new THREE.Line(ringGeometry2, ringMaterial);
	ringMesh.add(ringMesh2);
	
	updateFunctions.push(function(){
		ringMesh.position.copy(cube.position);
	});
}
createRings();

var cameraCube;
function createCameraCube() {
	var cubeMat = new THREE.MeshStandardMaterial({
	  color: 0x800080,
		visible: false
	});
	var cubeGeom = new THREE.CubeGeometry( 5, 5, 5 );
	cameraCube = new THREE.Mesh( cubeGeom, cubeMat );
	cameraCube.position.z = -zoom;
	ringMesh2.add( cameraCube );
}
createCameraCube();

var backCamera, backCameraHelper;
function createBackCamera() {
	backCamera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 5);
	backCamera.rotation.y = Math.PI;
	cameraCube.add(backCamera);
}
createBackCamera();

function createMainCamera(){
	camera.rotation.y = Math.PI;
	cameraCube.add(camera);
}
createMainCamera();

var obstruction = false;
var obstructionVec = new THREE.Vector2(0,0);
var intersectedObstruction;
var obstructionRaycaster = new THREE.Raycaster();
function watchObstruction(){
	obstructionRaycaster.setFromCamera(obstructionVec, backCamera);
	intersectedObstruction = obstructionRaycaster.intersectObjects(obstructionList);
	
	if ( intersectedObstruction[0].object.name != "hero" ) {
		obstruction = true;
  } else {
		obstruction = false;
	}
}

function cameraAutoController(){
	watchObstruction();
	
	switch(obstruction){
		case true:
			camera.position.z = intersectedObstruction[0].distance;
			break;
		case false:
			camera.position.set(0,0,0);
			break;
	}
}

//CAMERA DOM CONTROLLERS
var fowardBtn = document.getElementById('fowardBtn');
var fowardBtnClicked = false;
fowardBtn.addEventListener('mousedown', function(){
	fowardBtnClicked = true;
});
fowardBtn.addEventListener('mouseup', function(){
	fowardBtnClicked = false;
});
var rightBtn = document.getElementById('rightBtn');
var rightBtnClicked = false;
rightBtn.addEventListener('mousedown', function(){
	rightBtnClicked = true;
});
rightBtn.addEventListener('mouseup', function(){
	rightBtnClicked = false;
});
var backwardsBtn = document.getElementById('backwardsBtn');
var backwardsBtnClicked = false;
backwardsBtn.addEventListener('mousedown', function(){
	backwardsBtnClicked = true;
});
backwardsBtn.addEventListener('mouseup', function(){
	backwardsBtnClicked = false;
});
var leftBtn = document.getElementById('leftBtn');
var leftBtnClicked = false;
leftBtn.addEventListener('mousedown', function(){
	leftBtnClicked = true;
});
leftBtn.addEventListener('mouseup', function(){
	leftBtnClicked = false;
});

var zoomInBtn = document.getElementById('zoomIn');
var zoomInBtnClicked = false;
zoomInBtn.addEventListener('mousedown', function(){
	zoomInBtnClicked = true;
});
zoomInBtn.addEventListener('mouseup', function(){
	zoomInBtnClicked = false;
});

var zoomOutBtn = document.getElementById('zoomOut');
var zoomOutBtnClicked = false;
zoomOutBtn.addEventListener('mousedown', function(){
	zoomOutBtnClicked = true;
});
zoomOutBtn.addEventListener('mouseup', function(){
	zoomOutBtnClicked = false;
});

var angleX = 0;
var angleY = Math.PI;
function cameraDOMcontrol() {
	switch (zoomInBtnClicked) {
		case true:
		if (zoom > 50) {
			zoom -= 5;
			cameraCube.position.z = -zoom;
		}
		break;
	}
	switch (zoomOutBtnClicked) {
		case true:
		if (zoom < 250) {
			zoom += 5;
			cameraCube.position.z = -zoom;
		}
		break;
	}
	switch (backwardsBtnClicked){
		case true:
		if (angleX > -0.06 ) {
			angleX -= Math.PI / 90;
			axisNormalisedX = new THREE.Vector3(1, 0, 0).normalize();
			ringMesh2.quaternion.setFromAxisAngle(axisNormalisedX, angleX);
		}
		break;
	}
	switch (rightBtnClicked){
		case true:
		angleY += Math.PI / 90;
		axisNormalisedY = new THREE.Vector3(0, 1, 0).normalize();
		ringMesh.quaternion.setFromAxisAngle(axisNormalisedY, angleY);
		break;
	}
	switch (fowardBtnClicked){
		case true:
		if (angleX < 1.18) {
			angleX += Math.PI / 90;
			axisNormalisedX = new THREE.Vector3(1, 0, 0).normalize();
			ringMesh2.quaternion.setFromAxisAngle(axisNormalisedX, angleX);
		}
		break;
	}
	switch (leftBtnClicked){
		case true:
		angleY -= Math.PI / 90;
		axisNormalisedY = new THREE.Vector3(0, 1, 0).normalize();
		ringMesh.quaternion.setFromAxisAngle(axisNormalisedY, angleY);
		break;
	}
}

var delta, moveDistance, rotateAngle;
function moveCube(){
	delta = clock.getDelta();
	moveDistance = 200 * delta;
	rotateAngle = Math.PI / 2 * delta;
	
	if ( keyboard.pressed("left") )
		cube.rotateOnAxis( new THREE.Vector3(0,1,0), rotateAngle);
	if ( keyboard.pressed("right") )
		cube.rotateOnAxis( new THREE.Vector3(0,1,0), -rotateAngle);
	if ( keyboard.pressed("up") )
		cube.translateZ( -moveDistance );
	if ( keyboard.pressed("down") )
		cube.translateZ( moveDistance );
}

updateFunctions.push(function(){
	renderer.render( scene, camera );	
	moveCube();	
	cameraDOMcontrol();
	cameraAutoController();
});

requestAnimationFrame(function animate(nowMsec){
	requestAnimationFrame( animate );
	lastTimeMsec	= lastTimeMsec || nowMsec-1000/60;
	var deltaMsec	= Math.min(200, nowMsec - lastTimeMsec);
	lastTimeMsec	= nowMsec;
	updateFunctions.forEach(function(updateFunctions){
		updateFunctions(deltaMsec/1000, nowMsec/1000);
	});
});