// openGL context and things, makes passing arguments around much simpler
let context = {
	context : function(gl, positionBuffer, colorBuffer, viewMat, MVPloc){
		this.gl = gl;
		this.positionBuffer = positionBuffer;
		this.colorBuffer = colorBuffer;
		this.viewMat = viewMat;
		this.MVPloc = MVPloc;
	}
};


// create a shader, vertex or fragment
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
//create a shader program with both fragment and vertex shaders
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

//transform degrees to radians
function deg2rad(degree)
{
	return (degree * Math.PI)/180;
}

// returns a 'neutral' matrix
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
function mat4Transform(position = [0,0], scale = [1,1], rotation = 0)
{
	let x = position[0];
	let y = position[1];
	let w = scale[0];
	let h = scale[1];
	let r = rotation;

	let c = Math.cos(r);
	let s = Math.sin(r);

	return [
		 c*w, s*h,   0,   0,
		-s*w, c*h,   0,   0,
		   0,   0,   1,   0,
		   x,   y,   0,   1,
	];
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

// WebGL uses transposed matrices
// so use this to print a matrix the right way around
function mat4Print(mat)
{
	console.log('%.3f %.3f %.3f %.3f\n%.3f %.3f %.3f %.3f\n%.3f %.3f %.3f %.3f\n%.3f %.3f %.3f %.3f\n', 
		mat[0], mat[4], mat[ 8], mat[12],
		mat[1], mat[5], mat[ 9], mat[13],
		mat[2], mat[6], mat[10], mat[14],
		mat[3], mat[7], mat[11], mat[15],
	);
}


//draw a rectangle at postion[x,y] of size[w,h] with a rotation and color[r,g,b] 
function drawRectangle(context, transform, size = [0,0], color = [0,0,0,0])
{
	// vetices
	context.gl.bindBuffer(context.gl.ARRAY_BUFFER,context.positionBuffer);
	context.gl.bufferData(context.gl.ARRAY_BUFFER, new Float32Array([
		-size[0]/2, -size[1]/2,
		 size[0]/2, -size[1]/2,
		-size[0]/2,  size[1]/2,
		-size[0]/2,  size[1]/2,
		 size[0]/2, -size[1]/2,
		 size[0]/2,  size[1]/2,
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
		vertexData.push(...[0, 0]);
		let p1 = [radius*Math.cos( i   *(2*Math.PI)/n),radius*Math.sin( i   *(2*Math.PI)/n)];
		let p2 = [radius*Math.cos((i+1)*(2*Math.PI)/n),radius*Math.sin((i+1)*(2*Math.PI)/n)];
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


function main(){
	const canvas = document.querySelector("#c");
	const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
	var textCanvas = document.querySelector("#text");

	// cria um contexto 2D
	var ctx = textCanvas.getContext("2d");

	if (!gl) {
		throw new Error('WebGL not supported');
	}


	// creating shaders/programs
	let vertexShaderSource = `
	attribute vec2 position;
	attribute vec3 color;
	varying vec3 vColor;
	uniform mat4 MVP;
	uniform float pointSize;
	
	void main() {
			gl_Position = MVP * vec4(position,0.0,1.0);
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

	//finding uniform placement inside the shader
	const MVPUniformLoc = gl.getUniformLocation(program, `MVP`);
	const pointSizeUniformLoc = gl.getUniformLocation(program, `pointSize`);


	//defining uniforms
	// x = event.offsetX*( 2/500) - 1;
	// y = event.offsetY*(-2/500) + 1;
	let view = [
		2/canvas.width, 0,               0, 0, // x
		0,             -2/canvas.height, 0, 0, // y
		0,              0,               1, 0, // z
		-1,             1,               0, 1, // displacement
	];
	let point_width = 5;
	// pushing uniforms into shaders
	gl.uniformMatrix4fv(MVPUniformLoc, false, view);
	gl.uniform1f(pointSizeUniformLoc, point_width);



	// creating buffers
	const positionBuffer = gl.createBuffer();
	const colorBuffer = gl.createBuffer();

	// tying buffer to shader
	const positionLocation = gl.getAttribLocation(program, `position`);
	gl.enableVertexAttribArray(positionLocation);
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

	// tying buffer to shader
	const colorLocation = gl.getAttribLocation(program, `color`);
	gl.enableVertexAttribArray(colorLocation);
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);



	//initialization ready, tie everything up into one context structure
	const WebGL = new context.context(gl, positionBuffer, colorBuffer, view, MVPUniformLoc);


	let how_to_play = [[100, 400],[45, 135]];
	let play_game = [[100, 400],[145, 235]];
	let options = [[100, 400],[245, 335]];
	let exit = [[100, 400],[345, 435]];
	let how_to_play_locked = 0;
	let play_game_locked = 0;
	let options_locked = 0;
	let exit_locked = 0;
	// add mouse callback

	canvas.addEventListener("click", onMouseClick, false);	//only the frame that the mouse is pressed
	// click callback
	let pointerLock = 0;
	async function onMouseClick(event)
	{
		if (play_game_locked == 1) {
			window.location.href = "./game.html";
		}
	}


	canvas.addEventListener("mousemove", onMouseEvent, false);
	let mouse_location = [0,0];
	// mouse callback
	function onMouseEvent(event)
	{
		mouse_location[0] = event.offsetX;
		mouse_location[1] = event.offsetY;
		// console.log(mouse_location);


		if (mouse_location[0] > how_to_play[0][0] && mouse_location[0] < how_to_play[0][1] && mouse_location[1] > how_to_play[1][0] && mouse_location[1] < how_to_play[1][1]){
			how_to_play_locked = 1;
		} else {
			how_to_play_locked = 0;
		}

		if (mouse_location[0] > play_game[0][0] && mouse_location[0] < play_game[0][1] && mouse_location[1] > play_game[1][0] && mouse_location[1] < play_game[1][1]){
			play_game_locked = 1;
		} else {
			play_game_locked = 0;
		}

		if (mouse_location[0] > options[0][0] && mouse_location[0] < options[0][1] && mouse_location[1] > options[1][0] && mouse_location[1] < options[1][1]){
			options_locked = 1;
		} else {
			options_locked = 0;
		}

		if (mouse_location[0] > exit[0][0] && mouse_location[0] < exit[0][1] && mouse_location[1] > exit[1][0] && mouse_location[1] < exit[1][1]){
			exit_locked = 1;
		} else {
			exit_locked = 0;
		}
	}

	// start animation
	requestAnimationFrame(drawFrame);
	function drawFrame()
	{

		//clean screen
		gl.clearColor(1.0, 1.0, 1.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.font = "bold 48px serif";
		ctx.fillText('Jogar', 100,100);

		//drawing
		if (how_to_play_locked == 0) {
			drawRectangle(WebGL, mat4Transform([250,90], [30,1], 0), [10, 90], [.5,.5,.5]);
		} else {
			drawRectangle(WebGL, mat4Transform([250,90], [30,1], 0), [10, 90], [.7,.7,.7]);
		}

		if (play_game_locked == 0) {
			drawRectangle(WebGL, mat4Transform([250,190], [30,1], 0), [10, 90], [.5,.5,.5]);
		} else {
			drawRectangle(WebGL, mat4Transform([250,190], [30,1], 0), [10, 90], [.7,.7,.7]);
		}

		if (options_locked == 0) {
			drawRectangle(WebGL, mat4Transform([250,290], [30,1], 0), [10, 90], [.5,.5,.5]);
		} else {
			drawRectangle(WebGL, mat4Transform([250,290], [30,1], 0), [10, 90], [.7,.7,.7]);
		}

		if (exit_locked == 0) {
			drawRectangle(WebGL, mat4Transform([250,390], [30,1], 0), [10, 90], [.5,.5,.5]);
		} else {
			drawRectangle(WebGL, mat4Transform([250,390], [30,1], 0), [10, 90], [.7,.7,.7]);
		}

		requestAnimationFrame(drawFrame);
	}

}



main();
