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
	const positions = [];
    const normals = [];
    const texCoords = [];
    const vertices = [];

	console.log(fileContents);

    const lines = fileContents.split('\n');
    for (const line of lines) {
        const tokens = line.trim().split(/\s+/);
        if (!tokens || tokens.length === 0 || tokens[0].startsWith('#')) continue;

        switch(tokens[0]) {
            case 'v':  // Vertex positions
                positions.push([
                    parseFloat(tokens[1]),
                    parseFloat(tokens[2]),
                    parseFloat(tokens[3])
                ]);
                break;
            case 'vn': // Vertex normals
                normals.push([
                    parseFloat(tokens[1]),
                    parseFloat(tokens[2]),
                    parseFloat(tokens[3])
                ]);
                break;
            case 'vt': // Texture coordinates
                texCoords.push([
                    parseFloat(tokens[1]),
                    parseFloat(tokens[2])
                ]);
                break;
            case 'f':  // Faces
                // Parse face indices (vertex/texture/normal)
                const indices = tokens.slice(1).map(v => 
                    v.split('/').map(x => parseInt(x) - 1)
                );
                
                // Add first triangle
                for(let i = 0; i < 3; i++) {
                    const [vIdx, tIdx, nIdx] = indices[i];
                    vertices.push(
                        ...positions[vIdx],    // XYZ
                        ...normals[nIdx],      // Normal
                        ...texCoords[tIdx]     // UV
                    );
                }
                break;
        }
    }

    // Debug info
    console.log(`Vertices: ${positions.length}`);
    console.log(`Normals: ${normals.length}`);
    console.log(`TexCoords: ${texCoords.length}`);
    console.log(`Output vertices: ${vertices.length / 8}`);

    return new Float32Array(vertices).buffer;
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
    const fileContents = await getFileContents('../models/obj/enemy.obj');
    const arrayBuffer = parseFile(fileContents);
	console.log(arrayBuffer);
	saveBinaryFile('enemy.bin', arrayBuffer);		// Create a object of the same name .bin
};

main();

