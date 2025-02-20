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

function checkSpawnEnemy() {
    const remainingSlots = enemy_group.maxQtd - enemy_group.qtd;
    const enemiesPerLayer = enemy_group.maxQtdPerLine * enemy_group.maxQtdPerColumn;

    if (remainingSlots >= enemiesPerLayer) {
        return true;
    }
    return false;
}