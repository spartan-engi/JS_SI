const pathModelsBin = './models/bin/';
const objects = [];
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
	let main_cam = new camera.camera([20,-3,-100], [0,1,0], [0,0,1], 1, 1000);
	
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
		
		//main_cam.mov();
		
		//clean screen
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		// WebGL.gl.viewport(0,0, canvas.width/2, canvas.height/2);
		// console.log(obj);

		// compute collisions for all pair of objects
		physics_process(objects);
		
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
			a.collided();
			b.collided();
		}
	}
	return
}


// Initialize objects before of the game, if are not converted, it will convert to bin
function initializeObjects() {
    objects.push(spaceShip_object, spin_object, cube_object);
    
    // Initialize all models that need setup
    objects.forEach(obj => {
        if (obj.ready) obj.ready();
    });
}


// actually start executing code
initializeObjects();
main();