const Epsilon = require('./epsilon.api.js');
const SendKey = require('./keypress.robot.js');



let coolantLevels = {};
let intervals = {};

const COOLANT_DELTA = 1; //How fast the coolant increases


//TODO: Add in select debounce
const selectSystemShortcut = (system)=>{
	const systemKeyMapping = {
		reactor : 1,
		beamweapons: 2,
		missilesystem: 3,
		maneuver: 4,
		impulse: 5,
		warp: 6,
		jumpdrive: 7,
		frontshield: 8,
		rearshield: 9,
	}
	SendKey(systemKeyMapping[system]);
}

const toggleCoolant = async (system)=>{
	const level = await Epsilon.getCoolant(system)
	return Epsilon.setCoolant(system, level == 0 ? 100 : 0);
}

const bumpCoolant = async (system)=>{
	const level = await Epsilon.getCoolant(system)
	return Epsilon.setCoolant(system, level + 20);
}

const initiateCoolantSubroutine = async (system)=>{
	const level = await Epsilon.getCoolant(system);
	coolantLevels[system] = level;
	Epsilon.setCoolant(system, level + COOLANT_DELTA);
	intervals[system] = setInterval(()=>{
		coolantLevels[system] += COOLANT_DELTA;
		if(coolantLevels[system] > 100) haltCoolantSubroutine(system);
		Epsilon.setCoolant(system, coolantLevels[system])
	}, COOLANT_DELTA * 100);
	return ()=>haltCoolantSubroutine(system);
};

const haltCoolantSubroutine = async (system)=>{
	clearInterval(intervals[system]);
	delete intervals[system];
}

let powerDebounce = {};
const setSystemPower = async (system, value)=>{
	clearInterval(powerDebounce[system])
	powerDebounce[system] = setTimeout(()=>{
		selectSystemShortcut(system);
		Epsilon.setPower(system, value);
	}, 50);
}

module.exports = {
	toggleCoolant,
	bumpCoolant,
	initiateCoolantSubroutine,
	haltCoolantSubroutine,
	setSystemPower,
}