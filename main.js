const pathModelsBin = './models/bin/';
const objects = [];
window.gameObjects = objects;
// todo: figure out how to clear the trash

// required for input
const canvas = document.querySelector("#c");;

function main(){
	const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });

	if (!gl) {
		throw new Error('WebGL not supported');
	}


	// creating shaders/programs
	let vertexShader   = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
	let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

	let program = createProgram(gl, vertexShader, fragmentShader);

	gl.useProgram(program);


	//for 3d, only draw triangles on top
	gl.enable(gl.DEPTH_TEST);


	//finding uniform placement inside the shader
	const MVPUniformLoc       = gl.getUniformLocation(program, `MVP`);
	const ColorUniformLoc     = gl.getUniformLocation(program,  `color`);
	const NormalMatUniformLoc = gl.getUniformLocation(program,  `NormalMat`);
	
	// const pointSizeUniformLoc = gl.getUniformLocation(program, `pointSize`);
	// //defining uniform
	// let line_width = 5;
	// // pushing uniform into shaders
	// gl.uniform1f(pointSizeUniformLoc, line_width);



	// creating buffers
	const positionBuffer = gl.createBuffer();
	const normalBuffer    = gl.createBuffer();

	// tying buffer to shader
	const positionLocation = gl.getAttribLocation(program, `position`);
	gl.enableVertexAttribArray(positionLocation);
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

	// tying buffer to shader
	const normalLocation = gl.getAttribLocation(program, `normal`);
	gl.enableVertexAttribArray(normalLocation);
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

	// setup camera object
	// camera creates the projected_view matrix
	// this is the relative position between the camera and player ship
	let main_cam = new camera.camera([50,30,-110], [0,1,0], [0,0,1], 1, 1000);
	
	// initialization ready, tie everything up into one context structure
	// this context around instead of making functions with a thousand parameters
	const WebGL = new context.context(gl, positionBuffer, normalBuffer, main_cam, MVPUniformLoc, NormalMatUniformLoc, ColorUniformLoc);


	// callbacks... not driving anything for now
	const bodyElement = document.querySelector("body");
	bodyElement.addEventListener("keydown", onKeyPress, false)
	bodyElement.addEventListener("keyup", onKeyRelease, false)
	// add click callback
	// canvas.addEventListener("mousedown", onMouseCick, false);	// as long as mouse is pressed
	canvas.addEventListener("click", onMouseClick, false);	//only the frame that the mouse is pressed
	// add mouse motion callback
	document.addEventListener("mousemove", onMouseMove, false);
	document.addEventListener("pointerlockchange", onPointerLockToogle, false);



	
	// clean screen and depth buffer
	gl.clearColor(1.0, 1.0, 1.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


	// keeps track of time
	let last_T = Date.now();
	process();
	// gets called to draw every single frame
	function process()
	{
		// delta, anything that depends on time must be multiplied by this
		let delta = Date.now() - last_T;
		last_T = Date.now();
		
		//main_cam.mov();
		
		//clean screen
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		const needSpawn = checkSpawnEnemy();

		if(needSpawn) {
			spawnEnemyLayer();
		}

		// console.log(objects.length);

		// WebGL.gl.viewport(0,0, canvas.width/2, canvas.height/2);
		// console.log(obj);

		// compute collisions for all pair of objects
		physics_process(objects);

		// remove objects that should remove after the colision
		for(let i = 0; i < objects.length; i++)
		{
			if(objects[i].shouldRemove){
				objects.splice(i, 1);
			}
		}
		
		// give a chance for all the objects to update themselves
		for(obj of objects)
		{
			obj.process(delta);
		}
		// and then draw every single thing in the scene
		for(obj of objects)
		{
			obj.draw(WebGL);
		}
		// drawCube(WebGL, mat4Transform(cube_pos), [32,32,32], [.8,.5,.5]);

		// makes so this function loops
		requestAnimationFrame(process);
	}
	
}


function physics_process(physics_objects)
{
	for(let i = 0; i < physics_objects.length; i++)
	{
		let a = physics_objects[i];
		for(let j = i+1; j < physics_objects.length; j++)
		{
			// (n^2)/2 comparisons
			let b = physics_objects[j];
			
			// both a and b have to exist in the same collision 'world'
			// consider it in binary, (0b001 = 1) and (0b010 = 2) woudn't intersect
			if(!(a.collision_mask & b.collision_mask)) continue;
			
			// maximum distance from the two, that would still cause a collision
			let compound_size;
			// distance of the two objects
			let distance;
			// |--a--|     // |--a--|     
			//     |--b--| //        |--b--| 
			// presumes that everything is a box
			// and nothing is spining.

			//collision calculation is axis independant
			let collision = true;
			for(let axis = 0; axis < 3; axis++)
			{
				compound_size = a.size[axis] + b.size[axis];
				distance = a.position[axis] - b.position[axis];
				if((-compound_size > distance)||(distance > compound_size))
				{
					collision = false;
					break;
				}
			}
			if(!collision) continue;
			
			//collision!
			a.collided(b);
			b.collided(a);
		}
	}
	return
}

function spawnEnemyLayer() {
    const enemysToSpawn = enemy_group.maxQtd - enemy_group.qtd;
    const depthSlots = Math.floor(enemysToSpawn / (enemy_group.maxQtdPerLine * enemy_group.maxQtdPerColumn));

    for(let d = 0; d < depthSlots; d++) {
        for(let i = 0; i < enemy_group.maxQtdPerColumn; i++) {
            for(let j = 0; j < enemy_group.maxQtdPerLine; j++) {
                const position = [
                    (-200 + (j * 40)),
                    (-30 + (i * 20)),
                    (-300 + (d * 30))
                ];
                
                const willShoot = Math.random() < 0.4;
                const model = new enemy_model(position);
                const enemy = new Enemy(position, willShoot, model);
                
                if(enemy_group.addEnemyInGroup(enemy)) {
                    objects.push(enemy);
                    enemy.ready();
                }
            }
        }
    }
}

// Initializate enemys in group enemys and return all enemys created
function initializePlayer() {
	// const position = [-20, -20, -20];
	const position = [-70, -30, 70];
	const model = new spaceShip_model(position);

	player.init(5, position, model);
}

// Create enemys in group enemys
function initializeEnemys() {
	enemy_group.enemy_group(0, 48, 6, 4, 2, []);

	// Calculate spacing
    const SPACING_X = 40;
    const SPACING_Y = 20;
    const SPACING_Z = 50;

	// Base position
    const START_X = -190;
    const START_Y = -40;
    const START_Z = -300;

	//shared model
	THE_enemy_model =  new enemy_model();
	
	// Create 3D grid of enemies
    for(let z = 0; z < enemy_group.maxQtdPerDepth; z++) {
        for(let y = 0; y < enemy_group.maxQtdPerColumn; y++) {
            for(let x = 0; x < enemy_group.maxQtdPerLine; x++) {
                const position = [
                    START_X + (x * SPACING_X),
                    START_Y + (y * SPACING_Y),
                    START_Z + (z * SPACING_Z)
                ];

				let willShoot;
				// Choose randomly if the enemy will be able to shoot or not
				if (Math.random() < 0.4) {
					willShoot = true;
				}
				else{
					willShoot = false;
				}

				const enemy = new Enemy(position, willShoot, THE_enemy_model);

                enemy_group.addEnemyInGroup(enemy);
            }
        }
    }
}

// Create walls
function inicializeWalls() {
	// set the position on the walls 
	wall_group.wall_group(0, 13, []);

	// Wall positioning parameters
    const START_X = -250;
    const SPACING_X = 100;
    const positions = {
        bottom: { y: -50, count: 5 },
        middle: { y: -10, count: 4 },
        top: { y: 30, count: 5 }
    };

	// Create walls for each row
    Object.entries(positions).forEach(([row, { y, count }]) => {
        // Calculate row start position once
        let rowStartX = START_X;
        
        // Center middle row
        if(row === 'middle') {
            rowStartX += SPACING_X * 0.5; // Offset to center 4 walls
        }

        for(let i = 0; i < count; i++) {
            const position = [
                rowStartX + (i * SPACING_X),
                y,
                0
            ];

            const model = new wall_model(position);
            const wall = new Wall(position, model);
            wall_group.addWallInGroup(wall);
            objects.push(wall);
        }
    });
}

// Initialize objects before of the game, if some model is not converted, it will convert to bin
function initializeObjects() {
    objects.push(player);
	
	// Add all enemys in objects
	enemy_group.enemys.forEach(enemy => {
		objects.push(enemy);
	});
	// Add all wall in objects
	wall_group.walls.forEach(wall => {
		objects.push(wall);
	});
    
    // Initialize all models that need setup
    objects.forEach(obj => {
        if (obj.ready) obj.ready();
    });
}


// actually start executing code
initializePlayer();
initializeEnemys();
inicializeWalls();
initializeObjects();
main();