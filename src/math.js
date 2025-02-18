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

function vec4MultplyMat4(vec,mat){
	let vector = [
		mat[0]*vec[0] + mat[4]*vec[1] + mat[ 8]*vec[2] + mat[12]*vec[3],
		mat[1]*vec[0] + mat[5]*vec[1] + mat[ 9]*vec[2] + mat[13]*vec[3],
		mat[2]*vec[0] + mat[6]*vec[1] + mat[10]*vec[2] + mat[14]*vec[3],
		mat[3]*vec[0] + mat[7]*vec[1] + mat[11]*vec[2] + mat[15]*vec[3]
	];
	return vector;
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

// returns rotation matrix 
function mat4Rotation(angX=0, angY=0){
	let rotX = [
		1,         0,          0, 0,
		0, cos(angX), -sin(angX), 0,
		0, sin(angX),  cos(angX), 0,
		0,         0,          0, 1
	];
	let rotY = [
		cos(angY), 0, -sin(angY), 0,
		        0, 1,          0, 0,
		sin(angY), 0,  cos(angY), 0,
		        0, 0,          0, 1
	];
	let mat = mat4Multiply(rotX,rotY);
	return mat;
}

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