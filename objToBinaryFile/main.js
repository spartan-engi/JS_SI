const getFileContents = async (filename) => {
    const file = await fetch(filename);
    const body = await file.text();
    return body;
};

const stringsToNumbers = (strings) => {
	const numbers = [];
	for (const str of strings) {
		numbers.push(parseFloat(str));
	}
	return numbers;
}

const parseFile = (fileContents) => {
	const position = [];
	const textCoords = [];
	const vecNormals = [];

	const arrayBufferSource = [];
	
	const lines = fileContents.split("\n");
	for (const line of lines) { 
		const [command, ...values] = line.split(' ', 4);
		
		if(command == 'v'){
			position.push(stringsToNumbers(values));
		}
		else if(command == 'vt'){
			textCoords.push(stringsToNumbers(values));
		}
		else if(command == 'vn'){
			vecNormals.push(stringsToNumbers(values));
		}
		else if(command == 'f'){
			for (const group of values) {
				const [positionIndex, textCoordIndex, vecNormalIndex] = stringsToNumbers(group.split('/'));
				
				arrayBufferSource.push(...position[positionIndex - 1]);
				arrayBufferSource.push(...vecNormals[vecNormalIndex - 1]);
				arrayBufferSource.push(...textCoords[textCoordIndex - 1]);
			}
		}
	}
	return new Float32Array(arrayBufferSource).buffer;
};

const saveBinaryFile = (fileName, arrayBuffer) => {
	const blob = new Blob([arrayBuffer], {type: 'aplication/octet-stream'});
	const url = URL.createObjectURL(blob);

	const anchor = document.createElement('a');
	document.body.appendChild(anchor);

	anchor.type = 'aplication/octet-stream';
	anchor.download = fileName;
	anchor.href = url;

	anchor.click();
}

const main = async () => {
    const fileContents = await getFileContents('cat.obj');
    const arrayBuffer = parseFile(fileContents);
	console.log(arrayBuffer);
	saveBinaryFile('cat.bin', arrayBuffer);		// Create a object of the same name .bin
};

main();

