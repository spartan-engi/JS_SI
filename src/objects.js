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
		this.pos    = position;
		this.up     =  upward;
		this.z      =  [-forward[0], -forward[1], -forward[2]]; // Z vector points 'backwards', funnily enough
		this.near   =  near_plane;
		this.far    =  far_plane;
		
		// function called to get the camera's VP matrix
		this.getMat =  function()
		{
			// model... is applied by the model itself

			// view matrix - from world coordinate to camera relative coordinates
			// basically only a inverse of the camera transform
			let camera_position = mat4Transform(this.pos, [1,1,1], this.z, this.up);
			// 'glues' camera to spaceship motion and rotation
			let view = mat4OrthInverse(mat4Multiply(camera_position, spaceShip_object.tranform));

			// projection matrix
			// why the hell does this work again?
			let proj = mat4projection(this.near, this.far);
			
			//these two matricies make the whole camera projection
			return mat4Multiply(view, proj);

			// only needed for orthogonal projection
			// // clip matrix - from camera coordinates to normalized screen coordinates
			// // camera will render things from (-250 < x < 250), (250 > y > -250), (-250 < z < 250)
			// let clip = mat4Transform([0,0,0], [2/canvas.width, 2/canvas.height, 2/500]);
		}
		this.mov = function()
		{
			//this.pos = [obj.position[0]+60,obj.position[1]+150,obj.position[2]+60];	
			//this.z = [-100,-40,-100];
		}
	}
};


/* Variables and objects in game */
let enemy_group = {
	enemy_group : function(quantity, enemys){
		//this.centerPos = centerPosition;
		this.qnt = quantity;
		this.enemys = enemys;	// List of enemys{}
	},
	removeEnemyInGroup :  function(enemy) {
		for(let i = 0; i < this.enemys.length; i++){
			if(enemyinList == enemy){
				this.enemys.splice(i, 1);

				return true;	// Remotion sucess
			}
		}
		return false	// Remotion failed
	}

};

class enemy {
	constructor(position = [0,0,0], model){
		this.pos = position;
		this.model = model;
		this.isEnemy = true;
		this.shouldRemove = false;
	};

	collided(object) {
		if (!object) {
			return false;
		}

		// Handle player projectile collision
		if (object.isPlayerProjectile) {
			this.remove();
			// add score to the player
			player.enemyKilled();
			
			object.remove();		// remove projectile

			if(enemy_group.removeEnemyInGroup(this))
				console.log("Removed enemy in enemy_group with sucess");

			return true;		
		}
		
		return false;
	};

	remove(){
		this.shouldRemove = true;
	};
};

let player = {
	isPlayer : true,
	shouldRemove : false,
	score : 0,
	player : function(health = 3, position = [0,0,0], model){
		this.health = health;
		this.pos = position;
		this.model = model;
	},
	collided : function(object) {
		if (!object) {
			return false;
		}

		// Handle enemy projectile collision
		if(object.isEnemyProjectile){
			updateHealth(-1);

			object.remove();		// remove projectile

			if(this.health <= 0){
				this.remove();
			}
			return true;
		}
		else if(object.isWall){
			//block movimentation of player
			// need to implement
		}

		return false
	},
	updateHealth(health) {
		this.health += health
		if (this.health <= 0) {
			died();
		}
	},
	updatePosition(pos) {
		this.pos = pos;
	},
	remove(){
		this.shouldRemove = true;
	},
	enemyKilled(){
		this.addScore(100);
	},
	addScore(value) {
		this.score += value;
	},
	died(){
		alert("You lose :( \
			Press 'R' to restart the game!");
	}
}

let projectile = {
	isEnemyProjectile : null,
	isPlayerProjectile : null,
	collision_mask : 0,
	shouldRemove : false,
	position     : [0,0,0],
	size         : [4,4,20],
	color        : [0,0,0],
	dir          : [0,0,0],
	lifetime     : 500.0,
	speed        : 1.0,
	projectile: function(isFrom, direction, position){

		this.dir      = [direction[0], direction[1], direction[2]];
		this.position = [position[0], position[1], position[2]];
		this.size     = [4,4,20];
		this.lifetime = 500.0;
		this.speed    = 1.0;
		// Possible atributes
		//this.model = model;

		if(isFrom == "e"){		// projectile shooted by enemy
			this.isEnemyProjectile = true;
			this.isPlayerProjectile = false;
			this.color = [1.0,0.2,0.1];
			this.collision_mask = 1;
		}
		else if(isFrom == "p"){		// projectile shooted by player
			this.isEnemyProjectile = false;
			this.isPlayerProjectile = true;
			this.color = [0.0,0.2,1.0];
			this.collision_mask = 2;
		}

		this.collided = function(object) {
			if (!object) {
				return false;
			}

			if(this.isPlayerProjectile && object.isEnemy  ||
			this.isEnemyProjectile && object.isPlayer || object.isWall){
				this.remove();
			}
		}
		this.process = function(delta){
			
			// bullet fizzle out, outta range too.
			this.lifetime -= delta;
			if(this.lifetime < 0){
				this.remove();
				print("fizzle!");
				return;
			}
			
			// move with speed
			this.position[0] += this.dir[0]*this.speed*delta;
			this.position[1] += this.dir[1]*this.speed*delta;
			this.position[2] += this.dir[2]*this.speed*delta;
		}
		this.draw = function(context){
			drawCube(context, mat4Transform(this.position, [1,1,1], this.dir), this.size, this.color);
		}
		this.remove = function(){
			this.shouldRemove = true;
		}
	},
}

let wall = {
	isWall : true,
	wall : function(position = [0,0,0], model){
		this.pos = position;
		this.model = model;
	},
	collided : function(object){
		if (!object) {
			return false;
		}

		// Should happend nothing to the wall
		// so don't need a response of the wall, the others object will treat this colision
		return true;
	}
}



/* Objects declaration */

let cube_object = {
	position : [60,-30,-210],
	size : [24,24,24],
	collision_mask : 2,		// defines which group of objects the object interracts with (binary)
	color : [.5,.5,.5],

	colision_detected : false,
	collided : function()
	{
		console.log("Cube got colided");
		this.colision_detected = true;
		return;
	},
	draw : function(context)
	{
		let transform = mat4Transform(this.position, [1,1,1]);
		if(this.colision_detected) this.color = [.5,.8,.5];
		else                       this.color = [.5,.5,.5];
		this.colision_detected = false;
		drawCube(context, transform, this.size, this.color);
		return;
	},
	process : function(delta)
	{
		return;
	},
}

let spaceShip_object = {
	position : [60,-50,-100],
	vPos : [0],		// vector position
	vCol : [0],		// vector color
	vQnt : 0,		// quantity of vectors
	ang : [0,0],
	z: [0,0,1],

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
		this.tranform = mat4Transform(this.position, [1,1,1], this.z);
		drawModel(context, this.vPos, this.vCol, this.vQnt,this.tranform);
		return;
	},
	process : function(delta)
	{
		mov = [0,0,0];
		mov[0] = key_states['a'] - key_states['d'];
		mov[1] = key_states['w'] - key_states['s'];
		//mov[2] = key_states['e'] - key_states['q'];
		this.position[0] += mov[0];
		this.position[1] += mov[1];
		this.position[2] += mov[2];

		if (pointerLock){
			this.ang[0] += PI2/360*movMouse[1]/10; //mover em y rotaciona em x
			this.ang[1] += PI2/360*movMouse[0]/10; // mover em x rotaciona em y

			this.ang[0]=Math.min(Math.max(-PI2/4,this.ang[0]),PI2/4);
			this.ang[1]=Math.min(Math.max(-PI2/4,this.ang[1]),PI2/4);

			//print([this.ang[0],this.ang[1]]);
			movMouse = [0,0];
		}
		
		let matRot = mat4Rotation(this.ang[0],this.ang[1]);
		let pos = vec4MultplyMat4([0,0,-1,1],matRot);
		this.z[0] = pos[0];
		this.z[1] = pos[1];
		this.z[2] = pos[2];

		if(click)
		{
			click = 0;
			let b = new projectile.projectile("p", this.z, this.position);
			objects.push(b);
			print("bang!");
		}

		return;
	},
}

let enemy_object = {
	position : [-70,-70,-70],
	vPos : [0],		// vector position
	vCol : [0],		// vector color
	vQnt : 0,		// quantity of vectors

	async ready() {
        try {
			model = `${pathModelsBin}enemy.bin`;

            const modelData = await loadModel(model);
            this.processModelData(modelData);
        } catch(error) {
            console.error("Failed to load enemy model:", error);
        }
    },
	processModelData(modelData) {
		// Count quantity of vectors
        this.vQnt = modelData.length / 8;
        for(let i = 0; i < this.vQnt; i++) {
            // Position data (scaled by 52)
            const basePos = i * 3;
            const baseData = i * 8;
            this.vPos[basePos + 0] = modelData[baseData + 0] / 10;
            this.vPos[basePos + 1] = modelData[baseData + 1] / 10;
            this.vPos[basePos + 2] = modelData[baseData + 2] / 10;

            // Color data
            this.vCol[basePos + 0] = modelData[baseData + 3];
            this.vCol[basePos + 1] = modelData[baseData + 4];
            this.vCol[basePos + 2] = modelData[baseData + 5];
        }
    },
	draw : function(context)
	{
		drawModel(context, this.vPos, this.vCol, this.vQnt, mat4Transform(this.position));
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
		return;
	},
}

let spin_object = {
	collision_mask : 2,
	position : [-30,-30,-210],
	size : [32,32,32],
	ang : 0.0,
	draw : function(context)
	{
		// find the rotated 'Z' axis of this model
		let z = [sin(this.ang), 0, cos(this.ang)];
		// and the transform matrix is constructed around this vector
		drawCube(context, mat4Transform(this.position, [1,1,1], z), this.size, [.8,.5,.5]);
		return;
	},
	collided : function(object)
	{
		print("spin got collided");
		return;
	},
	process : function(delta)
	{
		// increment the angle of rotation a bit every frame
		this.ang += delta/500;
		return;
	},
}