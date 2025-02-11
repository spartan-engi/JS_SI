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
	let vertexShaderSource = `
	attribute vec3 position;
	attribute vec3 color;
	varying vec3 vColor;
	uniform mat4 MVP;
	uniform float pointSize;
	
	void main() {
			gl_Position = MVP * vec4(position,1.0);
			gl_PointSize = pointSize;
			vColor = color;
	}
	`;

	let fragmentShaderSource = `
	precision mediump float;

	varying vec3 vColor;        

	void main() {
			gl_FragColor = vec4(vColor,1.0);
	}
	`;

	let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
	let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

	let program = createProgram(gl, vertexShader, fragmentShader);

	gl.useProgram(program);


	//for 3d, only draw triangles on top
	gl.enable(gl.DEPTH_TEST);


	//finding uniform placement inside the shader
	const MVPUniformLoc = gl.getUniformLocation(program, `MVP`);
	const pointSizeUniformLoc = gl.getUniformLocation(program, `pointSize`);

	//defining uniform
	let line_width = 5;
	// pushing uniform into shaders
	gl.uniform1f(pointSizeUniformLoc, line_width);



	// creating buffers
	const positionBuffer = gl.createBuffer();
	const colorBuffer = gl.createBuffer();

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
	// key callback
	function onKeyPress(event)
	{
		switch(event.key)
		{
			case 'd':	key_states['d'] = 1;	break;
			case 'a':	key_states['a'] = 1;	break;
			case 'e':	key_states['e'] = 1;	break;
			case 'q':	key_states['q'] = 1;	break;
			case 'w':	key_states['w'] = 1;	break;
			case 's':	key_states['s'] = 1;	break;
		}
		// print(key_states);
	}
	function onKeyRelease(event)
	{
		switch(event.key)
		{
			case 'd':	key_states['d'] = 0;	break;
			case 'a':	key_states['a'] = 0;	break;
			case 'e':	key_states['e'] = 0;	break;
			case 'q':	key_states['q'] = 0;	break;
			case 'w':	key_states['w'] = 0;	break;
			case 's':	key_states['s'] = 0;	break;
		}
		// print(key_states);
	}
	// add click callback
	// canvas.addEventListener("mousedown", onMouseCick, false);	// as long as mouse is pressed
	canvas.addEventListener("click", onMouseClick, false);	//only the frame that the mouse is pressed
	// click callback
	let pointerLock = 0;
	async function onMouseClick(event)
	{
		// x = event.offsetX;
		// y = event.offsetY;
		// console.log(x,y);
		// pos[0] = initial_pos[0];
		// pos[1] = initial_pos[1];
		// pos[2] = initial_pos[2];
		if(pointerLock)
		{
			document.exitPointerLock();
			print("unlock");
			pointerLock = 0;
		}
		else
		{
			await canvas.requestPointerLock();
			print("lock!");
			pointerLock = 1;
		}
	}
	// add mouse motion callback
	document.addEventListener("mousemove", onMouseMove, false);
	// mouse motion callback
	function onMouseMove(event)
	{
		if(!pointerLock) return;
		print([event.movementX, event.movementY]);
	}



	
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

/* 3d drawing functions */
function drawModel(context, vertices, colorData, vertexCount, transform)
{
	// send position data
	context.gl.bindBuffer(context.gl.ARRAY_BUFFER, context.positionBuffer);
	context.gl.bufferData(context.gl.ARRAY_BUFFER, new Float32Array(vertices), context.gl.STATIC_DRAW);
	// send color data
	context.gl.bindBuffer(context.gl.ARRAY_BUFFER, context.colorBuffer);
	context.gl.bufferData(context.gl.ARRAY_BUFFER, new Float32Array(colorData), context.gl.STATIC_DRAW);
	
	// set transform
	let MVP = mat4Multiply(transform, context.camera.getMat());
	context.gl.uniformMatrix4fv(context.MVPloc, false, MVP)

	context.gl.drawArrays(context.gl.TRIANGLES, 0, vertexCount);
}

//draw a cube at postion[x,y,z] of size[w,h,d] with a rotation and color[r,g,b] 
function drawCube(context, transform, size = [0,0,0], color = [0,0,0,0])
{
    const vertexData = [
		// Front
		0.5, 0.5, 0.5,
		0.5, -.5, 0.5,
		-.5, 0.5, 0.5,
		-.5, 0.5, 0.5,
		0.5, -.5, 0.5,
		-.5, -.5, 0.5,
	
		// Back
		-.5, 0.5, -.5,
		-.5, -.5, -.5,
		0.5, 0.5, -.5,
		0.5, 0.5, -.5,
		-.5, -.5, -.5,
		0.5, -.5, -.5,
	
		// Right
		0.5, 0.5, -.5,
		0.5, -.5, -.5,
		0.5, 0.5, 0.5,
		0.5, 0.5, 0.5,
		0.5, -.5, 0.5,
		0.5, -.5, -.5,
	
		// Left
		-.5, 0.5, 0.5,
		-.5, -.5, 0.5,
		-.5, 0.5, -.5,
		-.5, 0.5, -.5,
		-.5, -.5, 0.5,
		-.5, -.5, -.5,
	
		// Top
		0.5, 0.5, 0.5,
		0.5, 0.5, -.5,
		-.5, 0.5, 0.5,
		-.5, 0.5, 0.5,
		0.5, 0.5, -.5,
		-.5, 0.5, -.5,
	
		// Bottom
		0.5, -.5, 0.5,
		0.5, -.5, -.5,
		-.5, -.5, 0.5,
		-.5, -.5, 0.5,
		0.5, -.5, -.5,
		-.5, -.5, -.5,
	  ];
	
	let faceColor = [
		[0.0,0.0,0.1], [0.0,0.0,-.1],
		[0.1,0.0,0.0], [-.1,0.0,0.0],
		[0.0,0.1,0.0], [0.0,-.1,0.0],
	]
	
	// pre-buffer
	let vertices = []
	let colorData = [];
	for(let faces=0; faces<6; faces++)
	{
		// fudge color based on face
		let c = [
			color[0]+faceColor[faces][0],
			color[1]+faceColor[faces][1],
			color[2]+faceColor[faces][2]
		];
		for(let triangle=0; triangle<2; triangle++)
		{
			for(let vertex=0; vertex<3; vertex++)
			{
				// position
				let i = vertex + triangle*3 + faces*6;
				vertices.push(...[vertexData[i*3]*size[0],vertexData[i*3+1]*size[1],vertexData[i*3+2]*size[2]]);
				// color
				colorData.push(...c);
			}
		}
	}
	

	// send position data
	context.gl.bindBuffer(context.gl.ARRAY_BUFFER,context.positionBuffer);
	context.gl.bufferData(context.gl.ARRAY_BUFFER, new Float32Array(vertices), context.gl.STATIC_DRAW);
	// send color data
	context.gl.bindBuffer(context.gl.ARRAY_BUFFER, context.colorBuffer);
	context.gl.bufferData(context.gl.ARRAY_BUFFER, new Float32Array(colorData), context.gl.STATIC_DRAW);
	
	// set transform
	let MVP = mat4Multiply(transform, context.camera.getMat());
	context.gl.uniformMatrix4fv(context.MVPloc, false, MVP)

	context.gl.drawArrays(context.gl.TRIANGLES, 0, 36);
}

/* shaders */
function createShader(gl, type, source) {
	let shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (success) {
		return shader;
	}

	console.log(gl.getShaderInfoLog(shader));
	gl.deleteShader(shader);
}
function createProgram(gl, vertexShader, fragmentShader) {
	let program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	let success = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (success) {
		return program;
	}

	console.log(gl.getProgramInfoLog(program));
	gl.deleteProgram(program);
}


/* vector math */

function vec3sub(v1, v2)
{
	return [v1[0]-v2[0], v1[1]-v2[1], v1[2]-v2[2]];
}
function vec3scale(s, v)
{
	return [s*v[0], s*v[1], s*v[2]];
}
function vec3dot(v1, v2)
{
	return v1[0]*v2[0] + v1[1]*v2[1] + v1[2]*v2[2];
}
function vec3cross(v1, v2)
{
	return [
		v1[1]*v2[2] - v2[1]*v1[2],
		v1[2]*v2[0] - v2[2]*v1[0],
		v1[0]*v2[1] - v2[0]*v1[1]
	];
}
function vec3normalize(vec)
{
	let isize = 1.0 / sqrt(vec3dot(vec, vec));
	return [vec[0]*isize, vec[1]*isize, vec[2]*isize];
}


/* matrix math */

// returns 'neutral' matrix
function mat4identity()
{
	return [
		1,0,0,0,
		0,1,0,0,
		0,0,1,0,
		0,0,0,1,
	];
};
// returns the matrix for a specific transformation
// the matrix is orthonormal
function mat4Transform(position = [0,0,0], scale = [1,1,1], z = [0,0,1], y = [0,1,0])
{
	let px = position[0];
	let py = position[1];
	let pz = position[2];
	
	let w = scale[0];
	let h = scale[1];
	let d = scale[2];

	
	let f = vec3normalize(z);
	let u = vec3normalize(vec3sub(y, vec3scale(vec3dot(f,y), f)));
	let r = vec3cross(u, f);

	let mat = [
		r[0]*w, r[1]*h, r[2]*d, 0,
		u[0]*w, u[1]*h, u[2]*d, 0,
		f[0]*w, f[1]*h, f[2]*d, 0,
		    px,     py,     pz, 1,
   ];

	return mat;
}
function mat4projection(near, far)
{
	// return mat4identity();
	return [
		-near, 0   , 0              , 0,
		 0   , near, 0              , 0,
		 0   , 0   , (1+far)/(1-far),-1,
		 0   , 0   ,-1              , 0,
	]
}
// complicated. matrix multiplication
// res <= m1 * m2
function mat4Multiply(m1, m2)
{
	let res00 = m2[0*4 + 0]*m1[0*4 + 0] + m2[1*4 + 0]*m1[0*4 + 1] + m2[2*4 + 0]*m1[0*4 + 2] + m2[3*4 + 0]*m1[0*4 + 3];
	let res01 = m2[0*4 + 0]*m1[1*4 + 0] + m2[1*4 + 0]*m1[1*4 + 1] + m2[2*4 + 0]*m1[1*4 + 2] + m2[3*4 + 0]*m1[1*4 + 3];
	let res02 = m2[0*4 + 0]*m1[2*4 + 0] + m2[1*4 + 0]*m1[2*4 + 1] + m2[2*4 + 0]*m1[2*4 + 2] + m2[3*4 + 0]*m1[2*4 + 3];
	let res03 = m2[0*4 + 0]*m1[3*4 + 0] + m2[1*4 + 0]*m1[3*4 + 1] + m2[2*4 + 0]*m1[3*4 + 2] + m2[3*4 + 0]*m1[3*4 + 3];

	let res10 = m2[0*4 + 1]*m1[0*4 + 0] + m2[1*4 + 1]*m1[0*4 + 1] + m2[2*4 + 1]*m1[0*4 + 2] + m2[3*4 + 1]*m1[0*4 + 3];
	let res11 = m2[0*4 + 1]*m1[1*4 + 0] + m2[1*4 + 1]*m1[1*4 + 1] + m2[2*4 + 1]*m1[1*4 + 2] + m2[3*4 + 1]*m1[1*4 + 3];
	let res12 = m2[0*4 + 1]*m1[2*4 + 0] + m2[1*4 + 1]*m1[2*4 + 1] + m2[2*4 + 1]*m1[2*4 + 2] + m2[3*4 + 1]*m1[2*4 + 3];
	let res13 = m2[0*4 + 1]*m1[3*4 + 0] + m2[1*4 + 1]*m1[3*4 + 1] + m2[2*4 + 1]*m1[3*4 + 2] + m2[3*4 + 1]*m1[3*4 + 3];

	let res20 = m2[0*4 + 2]*m1[0*4 + 0] + m2[1*4 + 2]*m1[0*4 + 1] + m2[2*4 + 2]*m1[0*4 + 2] + m2[3*4 + 2]*m1[0*4 + 3];
	let res21 = m2[0*4 + 2]*m1[1*4 + 0] + m2[1*4 + 2]*m1[1*4 + 1] + m2[2*4 + 2]*m1[1*4 + 2] + m2[3*4 + 2]*m1[1*4 + 3];
	let res22 = m2[0*4 + 2]*m1[2*4 + 0] + m2[1*4 + 2]*m1[2*4 + 1] + m2[2*4 + 2]*m1[2*4 + 2] + m2[3*4 + 2]*m1[2*4 + 3];
	let res23 = m2[0*4 + 2]*m1[3*4 + 0] + m2[1*4 + 2]*m1[3*4 + 1] + m2[2*4 + 2]*m1[3*4 + 2] + m2[3*4 + 2]*m1[3*4 + 3];

	let res30 = m2[0*4 + 3]*m1[0*4 + 0] + m2[1*4 + 3]*m1[0*4 + 1] + m2[2*4 + 3]*m1[0*4 + 2] + m2[3*4 + 3]*m1[0*4 + 3];
	let res31 = m2[0*4 + 3]*m1[1*4 + 0] + m2[1*4 + 3]*m1[1*4 + 1] + m2[2*4 + 3]*m1[1*4 + 2] + m2[3*4 + 3]*m1[1*4 + 3];
	let res32 = m2[0*4 + 3]*m1[2*4 + 0] + m2[1*4 + 3]*m1[2*4 + 1] + m2[2*4 + 3]*m1[2*4 + 2] + m2[3*4 + 3]*m1[2*4 + 3];
	let res33 = m2[0*4 + 3]*m1[3*4 + 0] + m2[1*4 + 3]*m1[3*4 + 1] + m2[2*4 + 3]*m1[3*4 + 2] + m2[3*4 + 3]*m1[3*4 + 3];

	return [
		res00, res10, res20, res30,
		res01, res11, res21, res31,
		res02, res12, res22, res32,
		res03, res13, res23, res33,
	];
}
function mat4Print(mat)
{
	console.log('%.3f %.3f %.3f %.3f\n%.3f %.3f %.3f %.3f\n%.3f %.3f %.3f %.3f\n%.3f %.3f %.3f %.3f\n', 
		mat[0], mat[4], mat[ 8], mat[12],
		mat[1], mat[5], mat[ 9], mat[13],
		mat[2], mat[6], mat[10], mat[14],
		mat[3], mat[7], mat[11], mat[15],
	);
}
// for a orthonormal matrix, taking the inverse is simply negating the displacement
// and transposing the basis
function mat4OrthInverse(mat)
{
	return [
		 mat[ 0], mat[ 4], mat[ 8], mat[ 3],
		 mat[ 1], mat[ 5], mat[ 9], mat[ 7],
		 mat[ 2], mat[ 6], mat[10], mat[11],
		-mat[12],-mat[13],-mat[14], mat[15],
	];
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


/* 2d funtions */
/* very, VERY  */
/*   broken.   */

//draw a rectangle at postion[x,y] of size[w,h] with a rotation and color[r,g,b] 
function drawRectangle(context, transform, size = [0,0], color = [0,0,0,0])
{
	// vetices
	context.gl.bindBuffer(context.gl.ARRAY_BUFFER,context.positionBuffer);
	context.gl.bufferData(context.gl.ARRAY_BUFFER, new Float32Array([
		-size[0]/2, -size[1]/2, 0,
		 size[0]/2, -size[1]/2, 0,
		-size[0]/2,  size[1]/2, 0,
		-size[0]/2,  size[1]/2, 0,
		 size[0]/2, -size[1]/2, 0,
		 size[0]/2,  size[1]/2, 0,
	]), context.gl.STATIC_DRAW);
	
	// color
	context.gl.bindBuffer(context.gl.ARRAY_BUFFER, context.colorBuffer);
	let colorData = [];
	for(let triangle=0; triangle<2; triangle++)
		for(let vertex=0; vertex<3; vertex++)
			colorData.push(...color);
	context.gl.bufferData(context.gl.ARRAY_BUFFER, new Float32Array(colorData), context.gl.STATIC_DRAW);


	// set transform
	let MVP = mat4Multiply(transform, context.viewMat);
	context.gl.uniformMatrix4fv(context.MVPloc, false, MVP)

	context.gl.drawArrays(context.gl.TRIANGLES, 0, 6);
}
//draw a circle at postion[x,y] with n+1 vertices of radius of a color[r,g,b]
function drawCircle(context, transform, n, radius, color = [0,0,0,0])
{
	// vertices
	context.gl.bindBuffer(context.gl.ARRAY_BUFFER,context.positionBuffer);
	let vertexData = [];
	for(let i=0;i<n;i++){
		vertexData.push(...[ 0, 0, 0]);
		let p1 = [radius*cos( i   *PI2/n),radius*sin( i   *PI2/n),0];
		let p2 = [radius*cos((i+1)*PI2/n),radius*sin((i+1)*PI2/n),0];
		// two subsequent points in the circumference
		vertexData.push(...p1);
		vertexData.push(...p2);
	}
	context.gl.bufferData(context.gl.ARRAY_BUFFER, new Float32Array(vertexData), context.gl.STATIC_DRAW);


	// color
	context.gl.bindBuffer(context.gl.ARRAY_BUFFER, context.colorBuffer);
	let colorData = [];
	for (let triangle = 0; triangle < n; triangle++) {
		for(let vertex=0; vertex<3; vertex++)
			colorData.push(...color);
	}
	context.gl.bufferData(context.gl.ARRAY_BUFFER, new Float32Array(colorData), context.gl.STATIC_DRAW);


	// set transform
	let MVP = mat4Multiply(transform, context.viewMat);
	context.gl.uniformMatrix4fv(context.MVPloc, false, MVP)

	context.gl.drawArrays(context.gl.TRIANGLES, 0, 3*n);
}
//draw a point at postion[x,y] of color[r,g,b]
function drawPoint(context, transform, color = [0,0,0,0])
{
	// vertices
	context.gl.bindBuffer(context.gl.ARRAY_BUFFER, context.positionBuffer);
	let vertexData = [];
	vertexData.push(...[transform[12],transform[13],transform[14]]);
	context.gl.bufferData(context.gl.ARRAY_BUFFER, new Float32Array(vertexData), context.gl.STATIC_DRAW);


	// color
	context.gl.bindBuffer(context.gl.ARRAY_BUFFER, context.colorBuffer);
	let colorData = [];
	colorData.push(...color);
	context.gl.bufferData(context.gl.ARRAY_BUFFER, new Float32Array(colorData), context.gl.STATIC_DRAW);


	// set transform
	let MVP = mat4Multiply(transform, context.viewMat);
	context.gl.uniformMatrix4fv(context.MVPloc, false, MVP)

	context.gl.drawArrays(context.gl.POINTS, 0, 1);
}
//draw a line from point1[x,y] to point2[x,y] of color[r,g,b]
function drawLine(context, transform, p1 = [0,0,0], p2 = [0,0,0], color = [0,0,0,0])
{
	let vertexData = [];
	let colorData = [];

	// extreme points
	vertexData.push(...p1);
	vertexData.push(...p2);
	colorData.push(...color);
	colorData.push(...color);

	
	// vertices
	context.bindBuffer(context.ARRAY_BUFFER, context.positionBuffer);
	context.bufferData(context.ARRAY_BUFFER, new Float32Array(vertexData), context.STATIC_DRAW);
	
	// color
	context.bindBuffer(context.ARRAY_BUFFER, context.colorBuffer);
	context.bufferData(context.ARRAY_BUFFER, new Float32Array(colorData), context.STATIC_DRAW);


	// set transform
	let MVP = mat4Multiply(transform, context.viewMat);
	context.gl.uniformMatrix4fv(context.MVPloc, false, MVP)
	
	// context.drawArrays(context.POINTS, 0, vertex_count);
	context.drawArrays(context.LINES, 0, 2);
}


// actually start executing code
initializeObjects();
main();