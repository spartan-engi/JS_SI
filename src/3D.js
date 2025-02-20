/* 3d drawing functions */


function drawModel(context, vertices, normalData, vertexCount, transform, color)
{
	// send position data
	context.gl.bindBuffer(context.gl.ARRAY_BUFFER, context.positionBuffer);
	context.gl.bufferData(context.gl.ARRAY_BUFFER, new Float32Array(vertices), context.gl.STATIC_DRAW);
	// send normal data
	context.gl.bindBuffer(context.gl.ARRAY_BUFFER, context.normalBuffer);
	context.gl.bufferData(context.gl.ARRAY_BUFFER, new Float32Array(normalData), context.gl.STATIC_DRAW);
	
	// set transform
	let MVP = mat4Multiply(transform, mat4Multiply(context.camera.getView(), context.camera.getProj()));
	context.gl.uniformMatrix4fv(context.MVPloc, false, MVP);
	// set object color
	context.gl.uniform3fv(context.colorLoc, new Float32Array(color));
	// set normal transform
	let NormalMatix = mat4Multiply(transform, context.camera.getView());
	context.gl.uniformMatrix4fv(context.NMATloc, false, NormalMatix);

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
	
	let faceNormal = [
		[ 0, 0, 1], [ 0, 0,-1],
		[ 1, 0, 0], [-1, 0, 0],
		[ 0, 1, 0], [ 0,-1, 0],
	]
	
	// pre-buffer
	let vertices = []
	let normalData = [];
	for(let faces=0; faces<6; faces++)
	{
		// set normal based on face
		let n = [
			faceNormal[faces][0],
			faceNormal[faces][1],
			faceNormal[faces][2]
		];
		for(let triangle=0; triangle<2; triangle++)
		{
			for(let vertex=0; vertex<3; vertex++)
			{
				// position
				let i = vertex + triangle*3 + faces*6;
				vertices.push(...[vertexData[i*3]*size[0],vertexData[i*3+1]*size[1],vertexData[i*3+2]*size[2]]);
				// color
				normalData.push(...n);
			}
		}
	}
	

	drawModel(context, vertices, normalData, 36, transform, color);
}