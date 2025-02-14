/* shaders */

const vertexShaderSource = `
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

const fragmentShaderSource = `
precision mediump float;

varying vec3 vColor;        

void main() {
        gl_FragColor = vec4(vColor,1.0);
}
`;



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