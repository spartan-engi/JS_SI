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
	// create a 'model' for the cube
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
	

	drawModel(context, vertices, colorData, 36, transform);
}