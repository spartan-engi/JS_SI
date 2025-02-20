/* objects */

// openGL context and things
let context = {
	context : function(gl, positionBuffer, normalBuffer, camera, MVPloc, NMATloc, colorLoc){
		this.gl = gl;
		this.positionBuffer = positionBuffer;
		this.normalBuffer = normalBuffer;
		this.camera = camera;
		this.MVPloc = MVPloc;
		this.NMATloc = NMATloc;
		this.colorLoc = colorLoc;
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
		
		// function called to get the camera's View matrix
		this.getView =  function()
		{
			// model... is applied by the model itself

			// view matrix - from world coordinate to camera relative coordinates
			// basically only a inverse of the camera transform
			let camera_position = mat4Transform(this.pos, [1,1,1], this.z, this.up);
			// 'glues' camera to spaceship motion and rotation
			let view = mat4OrthInverse(mat4Multiply(camera_position, player.transform));

			return view;
		}
		// function called to get the camera's Projection matrix
		this.getProj =  function()
		{
			// projection matrix
			// why the hell does this work again?
			let proj = mat4projection(this.near, this.far);
			return proj;

			// only needed for orthogonal projection
			// // clip matrix - from camera coordinates to normalized screen coordinates
			// // camera will render things from (-250 < x < 250), (250 > y > -250), (-250 < z < 250)
			// let clip = mat4Transform([0,0,0], [2/canvas.width, 2/canvas.height, 2/500]);
		}
	}
};


/* Variables and objects in game */
let enemy_group = {
	enemy_group : function(quantity, maxQtd = 60, maxQtdPerLine = 5, maxQtdPerColumn = 4, maxQtdPerDepth = 3, enemys = []){
		//this.centerPos = centerPosition;
		this.qtd = quantity;
		this.maxQtd = maxQtd;
		this.maxQtdPerLine = maxQtdPerLine;
		this.maxQtdPerColumn = maxQtdPerColumn;
		this.maxQtdPerDepth = maxQtdPerDepth;
		this.enemys = enemys;	// List of enemys{}
	},
	removeEnemyInGroup :  function(enemy) {
		for(let i = 0; i < this.enemys.length; i++){
			if(this.enemys[i] == enemy){
				this.enemys.splice(i, 1);
				this.qtd--;
				return true;	// Remotion sucess
			}
		}
		return false	// Remotion failed
	},
	addEnemyInGroup(enemy) {
		if (this.qtd < this.maxQtd) {
            this.enemys.push(enemy);
            this.qtd++;
            return true;
        }
        return false;
	}

};

class Enemy {
	constructor(position = [0,0,0], shouldShoot = false, model){
		this.position = position;
		this.shouldShoot = shouldShoot
		this.minDelay = 3000;  // 3 seconds minimum
        this.maxDelay = 4500;  // 4.5 seconds maximum
        this.shootDelay = Math.random() * (this.maxDelay - this.minDelay) + this.minDelay;
        this.shootCooldown = Math.random() * this.shootDelay; // Random initial cooldown
		this.size = [30,14,10];
		this.collision_mask = 1;
		this.model = model;
		this.isEnemy = true;
		this.shouldRemove = false;
		this.color = [
			Math.random()*.1 + .7,
			Math.random()*.3 + .3,
			Math.random()*.1 + .1,
		]
	};

	collided(object) {
		// Handle player projectile collision
		if (object.isPlayerProjectile) {
			this.remove();
			// add score to the player
			player.enemyKilled();

			if(enemy_group.removeEnemyInGroup(this))
				console.log("Removed enemy in enemy_group with sucess");

			return true;		
		}
		
		return false;
	};

	remove(){
		this.shouldRemove = true;
	};
	ready(){
		this.model.ready();
	};
	process(delta){
		// Base movement params of the zig zag movement enemys

		const baseSpeed = 0.2;  // Side movement speed (X)
		const yOscillation = 0.3;  // Up/down movement amount (Y)
		const forwardSpeed = 0.2;  // Forward movement speed (Z)
		
		// Get layer of the enemy
		const layerNumber = Math.floor(this.position[2] / 50);

		//Depending of the layer the type of the movement change
    
		// Alternate X direction based on layer
		if (layerNumber % 2 === 0) {
			this.position[0] += baseSpeed;
		} else {
			this.position[0] -= baseSpeed;
		}
		
		// Y oscillation
		this.position[1] += Math.sin(Date.now() * 0.002) * yOscillation;
		
		// Forward movement
		this.position[2] += forwardSpeed;

	
		// Handle shooting
		if(this.shouldShoot) {
			this.shootCooldown -= delta;
			if(this.shootCooldown <= 0) {
				this.shoot();
				this.shootCooldown = this.shootDelay;
			}
		}
	};

	shoot() {
        const spread = 0.1;
        const direction = [(Math.random() - 0.5) * spread, 
							(Math.random() - 0.5) * spread, 
							1];

        const projectile = new Projectile("e", direction, this.position, 0.5);
        objects.push(projectile);
        // Set new random delay for next shot
        this.shootDelay = Math.random() * (this.maxDelay - this.minDelay) + this.minDelay;
    }

	draw(context){
		let transform = mat4Transform(this.position);
		// mild adjustment, so hitbox doesn't feel too bad
		let model_transform = mat4Multiply(transform, mat4Transform([-23,-15,3]));
		this.model.draw(context, model_transform, this.color);
		// // show collision shape
		// drawCube(context, transform, this.size, [.4,.7,.2]);
	}
};

let player = {
	isPlayer       : true,
	shouldRemove   : false,
	score          : 0,
	health         : 5,
	position       : [0,0,0],
	size           : [26,14,26],
	collision_mask : 2,
	ang            : [0,0],
	z              : [0,0,1],
	transform      : 0,
	speed          : 0.08,
	color          : [.3,.9,.9],
	killCounter	   : 0,

	init : function(health = 5, position = [0,0,0], model){
		this.health = health;
		this.position = position;
		this.size = [26,14,26];
		this.collision_mask = 2;
		this.transform = mat4identity();
		this.model = model;
		this.speed = 0.08;
		this.color = [.3,.9,.9];
	},
	collided : function(object) {
		if (!object) {
			return false;
		}

		// Handle enemy projectile collision
		if(object.isEnemyProjectile){
			this.updateHealth(-1);

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
		document.getElementById('lives-display').textContent = this.health;
		if (this.health <= 0) {
			this.died();
		}
	},
	remove(){
		this.shouldRemove = true;
	},
	enemyKilled(){
		this.addScore(100);
		this.killCounter++;
        
		document.getElementById('kills-display').textContent = this.killCounter;
        // Every 30 kills, heal player
        if (this.killCounter >= 30) {
            this.updateHealth(1);
            this.killCounter = 0; // Reset counter
			document.getElementById('kills-display').textContent = '0'; // Reset display
        }
	},
	addScore(value) {
		this.score += value;
		document.getElementById('score-display').textContent = this.score;

		// WIN
		if(this.score >= 10000) {
            this.win();
        }
	},
	win() {
        alert("Congratulations! You won! \nFinal Score: " + this.score);
        location.reload(); // Restart game
    },
	died(){
		alert(`Game Over!\n
			Final Score: ${this.score}\n
			Press 'R' to restart the game!`);
				
		// Add event listener for restart
		document.addEventListener('keydown', (e) => {
			if(e.key.toLowerCase() === 'r') {
				location.reload();
			}
		});
	},
	ready(){
		this.model.ready();
	},
	process(delta){
		let mov = [0, 0, 0];
		mov[0] = key_states['a'] - key_states['d'];
		mov[1] = key_states['w'] - key_states['s'];
		//mov[2] = key_states['e'] - key_states['q'];
		this.position[0] += mov[0] * delta * this.speed;
		this.position[1] += mov[1] * delta * this.speed;
		this.position[2] += mov[2] * delta * this.speed;

		if (pointerLock){
			this.ang[0] += PI2/360*movMouse[1]/10; //mover em y rotaciona em x
			this.ang[1] += PI2/360*movMouse[0]/10; // mover em x rotaciona em y

			this.ang[0]=Math.min(Math.max(-PI2/4,this.ang[0]),PI2/4);
			this.ang[1]=Math.min(Math.max(-PI2/4,this.ang[1]),PI2/4);

			//print([this.ang[0],this.ang[1]]);
			movMouse = [0,0];
		}
		
		let matRot = mat4Rotation(this.ang[0],this.ang[1]);
		this.z = vec4MultplyMat4([0,0,-1,1],matRot);

		if(click)
		{
			click = 0;
			let b = new Projectile("p", this.z, this.position);
			objects.push(b);
			print("bang!");
		}
		
		return;
	},
	draw(context){
		this.transform = mat4Transform(this.position, [1,1,1], this.z);
		// mild adjustment, so hitbox doesn't feel too bad
		let model_transform = mat4Multiply(this.transform, mat4Transform([0,-4,-4]));
		this.model.draw(context, model_transform, this.color);
		// // show collision shape
		// drawCube(context, this.transform, this.size, [.4,.7,.2]);
	}
}

class Projectile {
	constructor(isFrom, direction, position, speed = 1.0){
		this.position 	  = [position[0], position[1], position[2]];
		this.size    	  = [4,4,20];
		this.dir      	  = [direction[0], direction[1], direction[2]];
		this.lifetime 	  = 1000.0;
		this.speed   	  = speed;
		this.shouldRemove = false;
		// Possible atributes
		//this.model = model;

		if(isFrom == "e"){		// projectile shooted by enemy
			this.isEnemyProjectile = true;
			this.isPlayerProjectile = false;
			this.color = [1.0,0.2,0.1];
			this.collision_mask = 2;
		}
		else if(isFrom == "p"){		// projectile shooted by player
			this.isEnemyProjectile = false;
			this.isPlayerProjectile = true;
			this.color = [0.0,0.2,1.0];
			this.collision_mask = 1;
		}
	}
	collided(object) {
		if(this.isPlayerProjectile && object.isEnemy  ||
			this.isEnemyProjectile && object.isPlayer || object.isWall){
			this.remove();
			return true;
		}
		return false;
	}
	remove(){
		this.shouldRemove = true;
		// disable collision, so this doesn't collide with anything else
		this.collision_mask = 0;
	}
	process(delta){
		
		// bullet fizzle out, outta range too.
		this.lifetime -= delta;
		if(this.lifetime < 0){
			this.remove();
			return;
		}
		
		// move with speed
		this.position[0] += this.dir[0]*this.speed*delta;
		this.position[1] += this.dir[1]*this.speed*delta;
		this.position[2] += this.dir[2]*this.speed*delta;
	}
	draw(context){
		if(this.shouldRemove) return;
		drawCube(context, mat4Transform(this.position, [1,1,1], this.dir), this.size, this.color);
	}
}

let wall_group = {
	wall_group : function(quantity, maxQtd = 3, walls = []){
		//this.centerPos = centerPosition;
		this.qtd = quantity;
		this.maxQtd = maxQtd;
		this.walls = walls;	// List of walls{}
	},
	removeWallInGroup :  function(wall) {
		for(let i = 0; i < this.walls.length; i++){
			if(this.walls[i] == wall){
				this.walls.splice(i, 1);
				this.qtd--;
				return true;	// Remotion sucess
			}
		}
		return false	// Remotion failed
	},
	addWallInGroup(wall) {
		if (this.qtd < this.maxQtd) {
            this.walls.push(wall);
            this.qtd++;
            return true;
        }
        return false;
	}
}

class Wall {
	constructor(position = [0, 0, 0], model) {
		this.isWall = true;
		this.position = position;
		this.model = model;
		this.size = [10,6,3];
		this.collision_mask = 3;
		this.color = [
			Math.random()*.2 + .2,
			Math.random()*.4 + .8,
			Math.random()*.2 + .2,
		]
	}
	collided(object){
		// Nothing should happen to the wall
		// so don't need a response for it, other objects will treat this colision
		return true;
	}
	ready(){
		this.model.ready();
	}
	process(delta){
		return;
	}
	draw(context){
		// heavy adjustment, so hitbox doesn't feel quite as horrendously bad
		let rot_adjust = mat4Transform([-60,0,90]);     // move center to origin-ish
		let rotation   = mat4Rotation(0,-43*PI2/64);    // rotate
		let trl_adjust = mat4Transform([-2,0,0]);       // center collision shape
		let transform  = mat4Transform(this.position);	// actual barrier position
		let model_transform = mat4Multiply(mat4Multiply(mat4Multiply(
			rot_adjust, rotation), trl_adjust), transform);
		this.model.draw(context, model_transform, this.color);
		// // show collision shape
		// drawCube(context, transform, this.size, [.4,.7,.2]);
	}
}



/* Models declaration */

class spaceShip_model {
	constructor() {
		this.vPos = [0];  // vector position
		this.vCol = [0];  // vector color
		this.vQnt = 0;    // quantity of vectors
	}

	async ready() {
        try {
			const model = `${pathModelsBin}spaceShip.bin`;

            const modelData = await loadModel(model);
            this.processModelData(modelData);
        } catch(error) {
            console.error("Failed to load spaceship model:", error);
        }
    }
	processModelData(modelData) {
		// Count quantity of vectors
        this.vQnt = modelData.length / 8;
        for(let i = 0; i < this.vQnt; i++) {
            // Position data (scaled by 52)
            const basePos = i * 3;
            const baseData = i * 8;
            this.vPos[basePos + 0] = modelData[baseData + 0] * 20;
            this.vPos[basePos + 1] = modelData[baseData + 1] * 20;
            this.vPos[basePos + 2] = modelData[baseData + 2] * 20;

            // Color data
            this.vCol[basePos + 0] = modelData[baseData + 3];
            this.vCol[basePos + 1] = modelData[baseData + 4];
            this.vCol[basePos + 2] = modelData[baseData + 5];
        }
    }
	draw(context, transform, color) {
		drawModel(context, this.vPos, this.vCol, this.vQnt, transform, color);
		return;
	}
}


// reuse model to avoid unnecessary lag
let THE_enemy_model;

class enemy_model {
	constructor() {
        this.vPos = [0];  // vector position
        this.vCol = [0];  // vector color
        this.vQnt = 0;    // quantity of vectors
		this.loaded = false; // has this model already been loaded
    }

	async ready() {
		// no need, already ready
		if(this.loaded) return;

        try {
			const model = `${pathModelsBin}enemy.bin`;

            const modelData = await loadModel(model);
            this.processModelData(modelData);
        } catch(error) {
            console.error("Failed to load enemy model:", error);
        }
    }
	processModelData(modelData) {
		// Count quantity of vectors
        this.vQnt = modelData.length / 8;
        for(let i = 0; i < this.vQnt; i++) {
            // Position data (scaled by 52)
            const basePos = i * 3;
            const baseData = i * 8;
            this.vPos[basePos + 0] = modelData[baseData + 0] / 40;
            this.vPos[basePos + 1] = modelData[baseData + 1] / 40;
            this.vPos[basePos + 2] = modelData[baseData + 2] / 40;

            // Color data
            this.vCol[basePos + 0] = modelData[baseData + 3];
            this.vCol[basePos + 1] = modelData[baseData + 4];
            this.vCol[basePos + 2] = modelData[baseData + 5];
        }
    }
	draw(context, transform, color) {
		drawModel(context, this.vPos, this.vCol, this.vQnt, transform, color);
		return;
	}
}

class wall_model {
	constructor() {
        this.vPos = [0];  // vector position
        this.vCol = [0];  // vector color
        this.vQnt = 0;    // quantity of vectors
    }

	async ready() {
        try {
			const model = `${pathModelsBin}wall.bin`;

            const modelData = await loadModel(model);
            this.processModelData(modelData);
        } catch(error) {
            console.error("Failed to load wall model:", error);
        }
    }
	processModelData(modelData) {
		// Count quantity of vectors
        this.vQnt = modelData.length / 8;
        for(let i = 0; i < this.vQnt; i++) {
            // Position data (scaled by 52)
            const basePos = i * 3;
            const baseData = i * 8;
            this.vPos[basePos + 0] = modelData[baseData + 0] / 20;
            this.vPos[basePos + 1] = modelData[baseData + 1] / 20;
            this.vPos[basePos + 2] = modelData[baseData + 2] / 20;

            // Color data
            this.vCol[basePos + 0] = modelData[baseData + 3];
            this.vCol[basePos + 1] = modelData[baseData + 4];
            this.vCol[basePos + 2] = modelData[baseData + 5];
        }
    }
	draw(context, transform, color) {
		drawModel(context, this.vPos, this.vCol, this.vQnt, transform, color);
		return;
	}
}


// let cube_object = {
// 	position : [60,-30,-210],
// 	size : [24,24,24],
// 	collision_mask : 1,		// defines which group of objects the object interracts with (binary)
// 	color : [.5,.5,.5],

// 	colision_detected : false,
// 	collided : function()
// 	{
// 		console.log("Cube got colided");
// 		this.colision_detected = true;
// 		return;
// 	},
// 	draw : function(context)
// 	{
// 		let transform = mat4Transform(this.position, [1,1,1]);
// 		drawCube(context, transform, this.size, this.color);
// 		return;
// 	},
// 	process : function(delta)
// 	{
// 		return;
// 	},
// }
// let spin_object = {
// 	position : [-30,-30,-210],
// 	ang : 0.0,
// 	draw : function(context)
// 	{
// 		// find the rotated 'Z' axis of this model
// 		let z = [sin(this.ang), 0, cos(this.ang)];
// 		// and the transform matrix is constructed around this vector
// 		drawCube(context, mat4Transform(this.position, [1,1,1], z), [32,32,32], [.8,.5,.5]);
// 		return;
// 	},
// 	process : function(delta)
// 	{
// 		// increment the angle of rotation a bit every frame
// 		this.ang += delta/500;
// 		return;
// 	},
// }