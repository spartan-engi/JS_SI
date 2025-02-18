/* vector math */

function vec3sub(v1, v2)
{
	let out = vec3.create();
    vec3.subtract(out, v1, v2);
	return out;
	// Old version
	// return [v1[0]-v2[0], v1[1]-v2[1], v1[2]-v2[2]];
}

function vec3scale(s, v)
{
	let out = vec3.create();
    vec3.scale(out, v, s);
	return out;

	//Old version
	// return [s*v[0], s*v[1], s*v[2]];
}

function vec3dot(v1, v2)
{
	return vec3.dot(v1, v2);
	//Old version
	// return v1[0]*v2[0] + v1[1]*v2[1] + v1[2]*v2[2];
}

function vec3cross(v1, v2)
{
	let out = vec3.create();
    vec3.cross(out, v1, v2);
	return out;

	//Old version
	// return [
	// 	v1[1]*v2[2] - v2[1]*v1[2],
	// 	v1[2]*v2[0] - v2[2]*v1[0],
	// 	v1[0]*v2[1] - v2[0]*v1[1]
	// ];
}

function vec3normalize(vec)
{
	let out = vec3.create();
    vec3.normalize(out, vec);
	return out;

	//Old version
	// let isize = 1.0 / sqrt(vec3dot(vec, vec));
	// return [vec[0]*isize, vec[1]*isize, vec[2]*isize];
}

function vec4MultplyMat4(vec,mat){
	let out = vec4.create();
    vec4.transformMat4(out, vec, mat);
	return out;

	// Old version
	// let vector = [
	// 	mat[0]*vec[0] + mat[4]*vec[1] + mat[ 8]*vec[2] + mat[12]*vec[3],
	// 	mat[1]*vec[0] + mat[5]*vec[1] + mat[ 9]*vec[2] + mat[13]*vec[3],
	// 	mat[2]*vec[0] + mat[6]*vec[1] + mat[10]*vec[2] + mat[14]*vec[3],
	// 	mat[3]*vec[0] + mat[7]*vec[1] + mat[11]*vec[2] + mat[15]*vec[3]
	// ];
	// return vector;
}


/* matrix math */

// returns 'neutral' matrix
function mat4identity()
{
	//it return the identity but is broken for some reason
	// return mat4.create();

	// Old version
	return [
		1,0,0,0,
		0,1,0,0,
		0,0,1,0,
		0,0,0,1,
	];
};

// returns rotation matrix 
function mat4Rotation(angX=0, angY=0){
	let rotX = mat4.create();
    mat4.rotateX(rotX, rotX, angX);

    let rotY = mat4.create();
    mat4.rotateY(rotY, rotY, angY);

    let mat = mat4.create();
    mat4.multiply(mat, rotX, rotY);
	return mat;

	//Old version
	// let rotX = [
	// 	1,         0,          0, 0,
	// 	0, cos(angX), -sin(angX), 0,
	// 	0, sin(angX),  cos(angX), 0,
	// 	0,         0,          0, 1
	// ];
	// let rotY = [
	// 	cos(angY), 0, -sin(angY), 0,
	// 	        0, 1,          0, 0,
	// 	sin(angY), 0,  cos(angY), 0,
	// 	        0, 0,          0, 1
	// ];
	// let mat = mat4Multiply(rotX,rotY);
	// return mat;
}

// returns the matrix for a specific transformation
// the matrix is orthonormal
function mat4Transform(position = [0,0,0], scale = [1,1,1], z = [0,0,1], y = [0,1,0])
{
	let mat = mat4.create();

    let f = vec3normalize(z);
    let u = vec3normalize(vec3sub(y, vec3scale(vec3dot(f, y), f)));
    let r = vec3cross(u, f);

    mat[0] = r[0] * scale[0];
    mat[1] = r[1] * scale[0];
    mat[2] = r[2] * scale[0];
    mat[3] = 0;

    mat[4] = u[0] * scale[1];
    mat[5] = u[1] * scale[1];
    mat[6] = u[2] * scale[1];
    mat[7] = 0;

    mat[8] = f[0] * scale[2];
    mat[9] = f[1] * scale[2];
    mat[10] = f[2] * scale[2];
    mat[11] = 0;

    mat[12] = position[0];
    mat[13] = position[1];
    mat[14] = position[2];
    mat[15] = 1;

    return mat;

	//Old version
// 	let px = position[0];
// 	let py = position[1];
// 	let pz = position[2];
	
// 	let w = scale[0];
// 	let h = scale[1];
// 	let d = scale[2];

	
// 	let f = vec3normalize(z);
// 	let u = vec3normalize(vec3sub(y, vec3scale(vec3dot(f,y), f)));
// 	let r = vec3cross(u, f);

// 	let mat = [
// 		r[0]*w, r[1]*h, r[2]*d, 0,
// 		u[0]*w, u[1]*h, u[2]*d, 0,
// 		f[0]*w, f[1]*h, f[2]*d, 0,
// 		    px,     py,     pz, 1,
//    ];

// 	return mat;
}

function mat4projection(near, far)
{
	let out = mat4.create();

    // dont have the function mat4.projection in library
    out[0] = -near;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;

    out[4] = 0;
    out[5] = near;
    out[6] = 0;
    out[7] = 0;

    out[8] = 0;
    out[9] = 0;
    out[10] = (1 + far) / (1 - far);
    out[11] = -1;

    out[12] = 0;
    out[13] = 0;
    out[14] = -1;
    out[15] = 0;

    return out;

	// return mat4identity();

	//Old version
	// return [
	// 	-near, 0   , 0              , 0,
	// 	 0   , near, 0              , 0,
	// 	 0   , 0   , (1+far)/(1-far),-1,
	// 	 0   , 0   ,-1              , 0,
	// ]
}

// complicated. matrix multiplication
// res <= m1 * m2
function mat4Multiply(m1, m2)
{
	// i think its working but the model come too close to the camera
	let out = mat4.create();
    mat4.multiply(out, m1, m2);
	return out;

	// //Old version
	// let res00 = m2[0*4 + 0]*m1[0*4 + 0] + m2[1*4 + 0]*m1[0*4 + 1] + m2[2*4 + 0]*m1[0*4 + 2] + m2[3*4 + 0]*m1[0*4 + 3];
	// let res01 = m2[0*4 + 0]*m1[1*4 + 0] + m2[1*4 + 0]*m1[1*4 + 1] + m2[2*4 + 0]*m1[1*4 + 2] + m2[3*4 + 0]*m1[1*4 + 3];
	// let res02 = m2[0*4 + 0]*m1[2*4 + 0] + m2[1*4 + 0]*m1[2*4 + 1] + m2[2*4 + 0]*m1[2*4 + 2] + m2[3*4 + 0]*m1[2*4 + 3];
	// let res03 = m2[0*4 + 0]*m1[3*4 + 0] + m2[1*4 + 0]*m1[3*4 + 1] + m2[2*4 + 0]*m1[3*4 + 2] + m2[3*4 + 0]*m1[3*4 + 3];

	// let res10 = m2[0*4 + 1]*m1[0*4 + 0] + m2[1*4 + 1]*m1[0*4 + 1] + m2[2*4 + 1]*m1[0*4 + 2] + m2[3*4 + 1]*m1[0*4 + 3];
	// let res11 = m2[0*4 + 1]*m1[1*4 + 0] + m2[1*4 + 1]*m1[1*4 + 1] + m2[2*4 + 1]*m1[1*4 + 2] + m2[3*4 + 1]*m1[1*4 + 3];
	// let res12 = m2[0*4 + 1]*m1[2*4 + 0] + m2[1*4 + 1]*m1[2*4 + 1] + m2[2*4 + 1]*m1[2*4 + 2] + m2[3*4 + 1]*m1[2*4 + 3];
	// let res13 = m2[0*4 + 1]*m1[3*4 + 0] + m2[1*4 + 1]*m1[3*4 + 1] + m2[2*4 + 1]*m1[3*4 + 2] + m2[3*4 + 1]*m1[3*4 + 3];

	// let res20 = m2[0*4 + 2]*m1[0*4 + 0] + m2[1*4 + 2]*m1[0*4 + 1] + m2[2*4 + 2]*m1[0*4 + 2] + m2[3*4 + 2]*m1[0*4 + 3];
	// let res21 = m2[0*4 + 2]*m1[1*4 + 0] + m2[1*4 + 2]*m1[1*4 + 1] + m2[2*4 + 2]*m1[1*4 + 2] + m2[3*4 + 2]*m1[1*4 + 3];
	// let res22 = m2[0*4 + 2]*m1[2*4 + 0] + m2[1*4 + 2]*m1[2*4 + 1] + m2[2*4 + 2]*m1[2*4 + 2] + m2[3*4 + 2]*m1[2*4 + 3];
	// let res23 = m2[0*4 + 2]*m1[3*4 + 0] + m2[1*4 + 2]*m1[3*4 + 1] + m2[2*4 + 2]*m1[3*4 + 2] + m2[3*4 + 2]*m1[3*4 + 3];

	// let res30 = m2[0*4 + 3]*m1[0*4 + 0] + m2[1*4 + 3]*m1[0*4 + 1] + m2[2*4 + 3]*m1[0*4 + 2] + m2[3*4 + 3]*m1[0*4 + 3];
	// let res31 = m2[0*4 + 3]*m1[1*4 + 0] + m2[1*4 + 3]*m1[1*4 + 1] + m2[2*4 + 3]*m1[1*4 + 2] + m2[3*4 + 3]*m1[1*4 + 3];
	// let res32 = m2[0*4 + 3]*m1[2*4 + 0] + m2[1*4 + 3]*m1[2*4 + 1] + m2[2*4 + 3]*m1[2*4 + 2] + m2[3*4 + 3]*m1[2*4 + 3];
	// let res33 = m2[0*4 + 3]*m1[3*4 + 0] + m2[1*4 + 3]*m1[3*4 + 1] + m2[2*4 + 3]*m1[3*4 + 2] + m2[3*4 + 3]*m1[3*4 + 3];

	// return [
	// 	res00, res10, res20, res30,
	// 	res01, res11, res21, res31,
	// 	res02, res12, res22, res32,
	// 	res03, res13, res23, res33,
	// ];
}

function mat4Print(mat)
{
	// dont need to change
	console.log(
		mat[0].toFixed(3), mat[4].toFixed(3), mat[ 8].toFixed(3), mat[12].toFixed(3),'\n',
		mat[1].toFixed(3), mat[5].toFixed(3), mat[ 9].toFixed(3), mat[13].toFixed(3),'\n',
		mat[2].toFixed(3), mat[6].toFixed(3), mat[10].toFixed(3), mat[14].toFixed(3),'\n',
		mat[3].toFixed(3), mat[7].toFixed(3), mat[11].toFixed(3), mat[15].toFixed(3),'\n',
	);
}

// for a orthonormal matrix, taking the inverse is simply negating the displacement
// and transposing the basis
function mat4OrthInverse(mat)
{
	// when aply this new the objects more close to the camera
	// let out = mat4.create();
    // mat4.invert(out, mat);
	// return out;

	//old version
	let res = [
		 mat[ 0], mat[ 4], mat[ 8], mat[ 3],
		 mat[ 1], mat[ 5], mat[ 9], mat[ 7],
		 mat[ 2], mat[ 6], mat[10], mat[11],
		-mat[12],-mat[13],-mat[14], mat[15],
	];
	let vec_res = vec4MultplyMat4([mat[12],mat[13],mat[14], 0], res);
	res[12] = vec_res[0];
	res[13] = vec_res[1];
	res[14] = vec_res[2];

	return res;
}