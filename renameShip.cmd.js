const Epsilon = require('./epsilon.api.js');

const slot = process.argv[2];
const name = process.argv[3];

Epsilon.connect(slot, false)
	.then(()=>{
		return Epsilon.renameShip(name)
	})
	.then(()=>{
		console.log('renamed ship!!');
	})