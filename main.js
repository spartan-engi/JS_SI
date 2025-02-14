const pathModelsBin = './models/bin/';
const objects = [];
// todo: figure out how to clear the trash

function main(){
	const canvas = document.querySelector("#c");
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
	const pointSizeUniformLoc = gl.getUniformLocation(program, `pointSize`);

	//defining uniform
	let line_width = 5;
	// pushing uniform into shaders
	gl.uniform1f(pointSizeUniformLoc, line_width);



	// creating buffers
	const positionBuffer = gl.createBuffer();
	const colorBuffer    = gl.createBuffer();

	// tying buffer to shader
	const positionLocation = gl.getAttribLocation(program, `position`);
	gl.enableVertexAttribArray(positionLocation);
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

	// tying buffer to shader
	const colorLocation = gl.getAttribLocation(program, `color`);
	gl.enableVertexAttribArray(colorLocation);
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);

	// setup camera object
	// camera is at origin(0,0,0), pointing towards (1,1,1)
	// camera creates the projected_view matrix
	let main_cam = new camera.camera([0,0,0], [0,1,0], [1,1,1], 1, 500);
	
	// initialization ready, tie everything up into one context structure
	// this context around instead of making functions with a thousand parameters
	const WebGL = new context.context(gl, positionBuffer, colorBuffer, main_cam, MVPUniformLoc);


	// callbacks... not driving anything for now
	const bodyElement = document.querySelector("body");
	bodyElement.addEventListener("keydown", onKeyPress, false)
	bodyElement.addEventListener("keyup", onKeyRelease, false)
	// add click callback
	// canvas.addEventListener("mousedown", onMouseCick, false);	// as long as mouse is pressed
	canvas.addEventListener("click", onMouseClick, false);	//only the frame that the mouse is pressed
	// add mouse motion callback
	document.addEventListener("mousemove", onMouseMove, false);



	
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
		

		//clean screen
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		// WebGL.gl.viewport(0,0, canvas.width/2, canvas.height/2);
		// console.log(obj);

		// compute collisions for all pair of objects
		for(let i = 0; i < objects.length; i++)
		{
			let a = objects[i];
			for(let j = i+1; j < objects.length; j++)
			{
				// (n^2)/2 comparisons
				let b = objects[j];
				
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
				a.collided();
				b.collided();
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

// keystates, read this instead of directly listening to the events
let key_states = { 
	'd' : 0,
	'a' : 0,
	'e' : 0,
	'q' : 0,
	'w' : 0,
	's' : 0,
}

/* writing convenience */

const PI2 = 2*Math.PI;
function sin(angle){return Math.sin(angle);}
function cos(angle){return Math.cos(angle);}
function sqrt(number){return Math.sqrt(number);}
function print(thing){console.log(thing);}

/* objects */

// openGL context and things
let context = {
	context : function(gl, positionBuffer, colorBuffer, camera, MVPloc){
		this.gl = gl;
		this.positionBuffer = positionBuffer;
		this.colorBuffer = colorBuffer;
		this.camera = camera;
		this.MVPloc = MVPloc;
	}
};

// camera object, basically a glorified matrix maker
// todo: functions to move and rotate it 
let camera = {
	camera : function(position, upward, forward, near_plane, far_plane)
	{
		this.pos    =  position;
		this.up     =  upward;
		this.z      = -forward; // Z vector points 'backwards', funnily enough
		this.near   =  near_plane;
		this.far    =  far_plane;

		// function called to get the camera's VP matrix
		this.getMat =  function()
		{
			// model... is applied by the model itself

			// view matrix - from world coordinate to camera relative coordinates
			// basically only a inverse from the camera transform
			let view = mat4OrthInverse(mat4Transform([0,0,0], [1,1,1], [1,1,1]));

			// projection matrix
			// why the hell does this work again?
			let proj = mat4projection(1, 500);
			
			//these two matricies make the whole camera projection
			return mat4Multiply(view, proj);

			// only needed for orthogonal projection
			// // clip matrix - from camera coordinates to normalized screen coordinates
			// // camera will render things from (-250 < x < 250), (250 > y > -250), (-250 < z < 250)
			// let clip = mat4Transform([0,0,0], [2/canvas.width, 2/canvas.height, 2/500]);
		}
	}
};

/* Objects declaration */

// this isn't the right place to declare the objects
let cube_object = {
	position : [-70,-70,-70],
	size : [24,24,24],
	collision_mask : 1,		// defines which group of objects the object interracts with (binary)
	color : [.5,.5,.5],

	colision_detected : false,
	collided : function()
	{
		this.colision_detected = true;
		return;
	},
	draw : function(context)
	{
		drawCube(context, mat4Transform(this.position), this.size, this.color);
		return;
	},
	process : function(delta)
	{
		if(this.colision_detected)	this.color = [1,.5,.5];
		else						this.color = [.5,.5,.5];
		this.colision_detected = false;

		mov = [0,0,0];
		mov[0] = key_states['a'] - key_states['d'];
		mov[1] = key_states['e'] - key_states['q'];
		mov[2] = key_states['s'] - key_states['w'];
		this.position[0] += mov[0];
		this.position[1] += mov[1];
		this.position[2] += mov[2];
		return;
	},
}

let spaceShip_object = {
	position : [-70,-70,-70],
	vPos : [0],		// vector position
	vCol : [0],		// vector color
	vQnt : 0,		// quantity of vectors

	async ready() {
        try {
			model = `${pathModelsBin}viper.bin`;

            const modelData = await loadModel(model);
            this.processModelData(modelData);
        } catch(error) {
            console.error("Failed to load spaceship model:", error);
        }
    },
	processModelData(modelData) {
		// Count quantity of vectors
        this.vQnt = modelData.length / 8;
        for(let i = 0; i < this.vQnt; i++) {
            // Position data (scaled by 52)
            const basePos = i * 3;
            const baseData = i * 8;
            this.vPos[basePos + 0] = modelData[baseData + 0] * 52;
            this.vPos[basePos + 1] = modelData[baseData + 1] * 52;
            this.vPos[basePos + 2] = modelData[baseData + 2] * 52;

            // Color data
            this.vCol[basePos + 0] = modelData[baseData + 3];
            this.vCol[basePos + 1] = modelData[baseData + 4];
            this.vCol[basePos + 2] = modelData[baseData + 5];
        }
    },
	draw : function(context)
	{
		drawModel(context, this.vPos, this.vCol, this.vQnt, mat4Transform(this.position));
		return;
	},
	process : function(delta)
	{
		mov = [0,0,0];
		mov[0] = key_states['a'] - key_states['d'];
		mov[1] = key_states['e'] - key_states['q'];
		mov[2] = key_states['s'] - key_states['w'];
		this.position[0] += mov[0];
		this.position[1] += mov[1];
		this.position[2] += mov[2];
		return;
	},
}

let spin_object = {
	position : [-38,-70,-134],
	ang : 0.0,
	draw : function(context)
	{
		// find the rotated 'Z' axis of this model
		let z = [sin(this.ang), 0, cos(this.ang)];
		// and the transform matrix is constructed around this vector
		drawCube(context, mat4Transform(this.position, [1,1,1], z), [32,32,32], [.8,.5,.5]);
		return;
	},
	process : function(delta)
	{
		// increment the angle of rotation a bit every frame
		this.ang += delta/500;
		return;
	},
}


/* Utils */
// modelName paths example: './models/bin/viper.bin'
async function loadModel(modelName) {
	const response = await fetch(modelName);
	const arrayBuffer = await response.arrayBuffer();
	
	return new Float32Array(arrayBuffer);
}


// Initialize objects before of the game, if are not converted, it will convert to bin
function initializeObjects() {
    objects.push(spaceShip_object, spin_object);
    
    // Initialize all models that need setup
    objects.forEach(obj => {
        if (obj.ready) obj.ready();
    });
}




// actually start executing code
initializeObjects();
main();