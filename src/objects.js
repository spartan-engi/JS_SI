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
	shouldRemove : false,
	projectile: function(isFrom){
		// Possible atributes
		//this.color = color;
		//this.model = model;

		if(isFrom == "e"){		// projectile shooted by enemy
			this.isEnemyProjectile = true;
			this.isPlayerProjectile = false;
		}
		else if(isFrom == "p"){		// projectile shooted by player
			this.isEnemyProjectile = false;
			this.isPlayerProjectile = true;
		}
	},
	collided : function(object) {
		if (!object) {
			return false;
		}

		if(this.isPlayerProjectile && object.isEnemy  ||
			this.isEnemyProjectile && object.isPlayer || object.isWall){
			this.remove();
		}
	},

	remove(){
		this.shouldRemove = true;
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

// this isn't the right place to declare the objects
let cube_object = {
	position : [-70,-70,-70],
	size : [24,24,24],
	collision_mask : 1,		// defines which group of objects the object interracts with (binary)
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
	position : [-70,-70,-70],
	vPos : [0],		// vector position
	vCol : [0],		// vector color
	vQnt : 0,		// quantity of vectors

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