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
	position : [-60,-150,-60],
	vPos : [0],		// vector position
	vCol : [0],		// vector color
	vQnt : 0,		// quantity of vectors
	ang : [0,0],
	z: [-11,-5,-10],

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
		drawModel(context, this.vPos, this.vCol, this.vQnt, mat4Transform(this.position, [1,1,1],this.z));
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

		if (!(stop)){
			this.ang[0] -= PI2/360*dirMouse[1]/10; //mover em y rotaciona em x
			this.ang[1] += PI2/360*dirMouse[0]/10; // mover em x rotaciona em y

			this.ang[0]=Math.min(Math.max(-PI2/4,this.ang[0]),PI2/4);
			this.ang[1]=Math.min(Math.max(-PI2/4,this.ang[1]),PI2/4);

			print([this.ang[0],this.ang[1]]);
			dirMouse = [0,0];
		}else{
			print(this.ang[0],this.ang[1]);
		}
		
		let matRot = mat4Rotation(this.ang[0],this.ang[1]);
		let pos = vec4MultplyMat4([0,0,-1,1],matRot);
		this.z[0] = pos[0];
		this.z[1] = pos[1];
		this.z[2] = pos[2];

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