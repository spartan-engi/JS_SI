/* shaders */

const vertexShaderSource = `
attribute vec3 position;
attribute vec3 normal;

uniform mat4 MVP;
uniform mat4 NormalMat;
uniform float pointSize;

varying vec3 vNormal;	 // surface normal
varying vec4 faceTint;	 // surface tint based on normal
varying vec3 vCameraDir; // direction to the camera
varying vec3 vHalfWay;   // half way vector between camera and light
varying vec3 vLightDir;  // direction that the light is coming from

void main() {
        gl_Position = MVP * vec4(position,1.0);
        // gl_PointSize = pointSize;

		vec3 tint_color = normal*0.2 + vec3(0.8);
		faceTint = vec4(tint_color, 1.0);

        vNormal    = normalize( (NormalMat * vec4(normal  ,0)).xyz);
		vCameraDir = normalize(-(NormalMat * vec4(position,1)).xyz);
		vLightDir  = normalize( (NormalMat * vec4(-1,0,1 ,0)).xyz);
		vHalfWay   = normalize(vCameraDir + vLightDir);
}
`;

const fragmentShaderSource = `
precision mediump float;

uniform vec3 color;

varying vec3 vNormal;	 // surface normal
varying vec4 faceTint;	 // surface tint based on normal
varying vec3 vCameraDir; // direction to the camera
varying vec3 vHalfWay;   // half way vector between camera and light
varying vec3 vLightDir;  // direction that the light is coming from

void main() {
		// slight tint, makes it easier to differentiate faces
        // gl_FragColor = vec4(color,1.0)*faceTint;

		float illumination = (dot(vLightDir, vNormal) + 1.)/2.;
		vec4 diffuse = vec4(color*illumination,1.0)*faceTint;
		float specular = pow(max(dot(vNormal, vHalfWay), 0.), 32.);
		gl_FragColor = mix(diffuse, vec4(1), specular);

		// float dot = dot(vCameraDir, vNormal);
		// gl_FragColor = vec4(0.,dot,dot, 1.0);


		// gl_FragColor = vec4(vLightDir, 1.0);
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