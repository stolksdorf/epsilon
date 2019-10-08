const readline = require('readline').createInterface({ input: process.stdin, output: process.stdout });
const lpd8 = require('../lpd8');
const Epsilon = require('./epsilon.api.js');
const Engineering = require('./eng.utils.js');

/*
//TODO:
- cool ship diagnostic screen
*/


let Ship;


const getShipNumber = async ()=>{
	const getCliInput = async (question)=>{
		return new Promise((resolve, reject)=>{
			readline.question(question, (answer)=>{
				readline.close();
				return resolve(answer);
			})
		})
	};
	if(process.argv[2]) return process.argv[2];
	console.log('Ship Slot Number not passed in as an argument.');
	return getCliInput('Which ship slot are you using (1-6)? ');
};



const Initiate = async ()=>{
	const shipNumber = await getShipNumber();
	console.log('');

	console.log(`Attempting to connect with ship's systems...`);
	await Epsilon.connect(shipNumber);

	Ship = await Epsilon.getShipInfo();
	console.log(Ship);
	console.log(`Connected to '${Ship.type}'!`);

	console.log('Retriveing ship diagnostics...');
	Systems = await Epsilon.getSystems();

	console.log('Creating link to control pannel...');
	LinkControlsToLPD8();

	console.log('Engineering Control Panel ready for operation, Chief!');
}

const LinkControlsToLPD8 = ()=>{
	lpd8.connect(true);

	const PowerNotches = [0,20,30,40,50,60,71,80,91,100,100,100,120,141,160,181,200,220,240,261,300];
	const indexToSystemName = (index)=>{
		return [
			'reactor',
			'maneuver',
			'beamweapons',
			'frontshield',
			Ship.drives.jump ? 'jumpdrive' : 'warp',
			'impulse',
			'missilesystem',
			'rearshield'
		][index];
	}

	lpd8.on('double', async ({index})=>{
		const system = indexToSystemName(index);
		Engineering.toggleCoolant(system);
	});

	lpd8.on('press', async ({index})=>{
		const system = indexToSystemName(index);
		Engineering.bumpCoolant(system);
	});

	lpd8.on('held', async ({index})=>{
		const system = indexToSystemName(index);
		Engineering.initiateCoolantSubroutine(system);
	});

	lpd8.on('release', async ({index})=>{
		const system = indexToSystemName(index);
		Engineering.haltCoolantSubroutine(system);
	});

	lpd8.on('knob', ({index, notch})=>{
		const system = indexToSystemName(index);
		Engineering.setSystemPower(system, PowerNotches[notch]);
	});
}





Initiate().catch((err)=>console.log(err));

