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