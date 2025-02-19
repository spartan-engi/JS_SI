/* writing convenience */

const PI2 = 2*Math.PI;
function sin(angle){return Math.sin(angle);}
function cos(angle){return Math.cos(angle);}
function sqrt(number){return Math.sqrt(number);}
function print(thing){console.log(thing);}



/* Utils */
// modelName paths example: './models/bin/viper.bin'
async function loadModel(modelName) {
	const response = await fetch(modelName);
	const arrayBuffer = await response.arrayBuffer();
	
	return new Float32Array(arrayBuffer);
}

function checkSpawnEnemy(){
	//pick the position of the highest enemy
	let highestY = -Infinity;

	for (let enemy of enemy_group.enemys) {
        if (enemy.position[1] > highestY) {
            highestY = enemy.position[1];
        }
    }

	const SPAWN_THRESHOLD = -10;
	const remainingSlots = enemy_group.maxQtd - enemy_group.qtd;  // 20 - 15 = 5

	// Spawn a new line if the highest line of enemys reach a certain Y position
	// 			and the qtd of enemys is less than i full line (5)
	if (highestY < SPAWN_THRESHOLD && 
		remainingSlots >= enemy_group.maxQtdPerLine) {  // 5 >= 5
		return highestY; // Spawn new line
	}
    
    return false;
}