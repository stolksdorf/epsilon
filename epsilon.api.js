const cp = require('child_process');
const between = (str,start,end)=>str.match(new RegExp(start+"(.*)"+end))[1];
const map = (obj,fn)=>Object.keys(obj).map((key)=>fn(obj[key],key));
const times = (n,fn)=>Array.from(new Array(n*1),(v,i)=>fn(i));
const wait = async (n, val)=>new Promise((r)=>setTimeout(()=>r(val), n));
const execAll = (rgx, str)=>{let m, r = []; while (m = rgx.exec(str)){r.push(m[1]);}; return r;};
const clamp = (val, min, max)=>{
	if(val < min) return min;
	if(val > max) return max;
	return val;
};

const exec = (cmd)=>{
	return new Promise((resolve, reject)=>{
		cp.exec(cmd, (error, stdout, stderr)=>{
			if(error) return reject(error);
			return resolve(stdout);
		});
	});
};

let epsilon_ip, ship_number, connected=false;


const checkConnection = async ()=>{
	const req = `http://${epsilon_ip}:8080/get.lua?${encodeURI(`_OBJECT_=getPlayerShip(${ship_number})&hull=getHull()`)}`;
	return await exec(`curl --max-time 2 "${req}"`)
		.then((res)=>typeof JSON.parse(res).hull == 'number')
};

const untilConnected = async ()=>{
	return new Promise((resolve, reject)=>{
		const check = async ()=>{
			//console.log('checking....');
			if(await checkConnection()) return resolve();
			setTimeout(check, 3000);
		}
		check();
	})
}


const ping = async ()=>{
	const canCommunicate = await checkConnection();
	if(!canCommunicate && connected){
		console.log('🔥🔥🔥 Lost Connection to server. 🔥🔥🔥 Trying again...');
		connected = false;
	}
	if(canCommunicate && !connected){
		console.log(`Connected to ship in slot ${ship_number}`);
		connected = true;
	}
	if(!canCommunicate && !connected){
		//show a lil spinner
	}
	setTimeout(ping, connected ? 4000 : 1000);
}



const getLocalIP = async ()=>{
	return exec(`ipconfig`)
		.then((res)=>between(res, 'IPv4 Address. . . . . . . . . . . : ', '\r'))
}


const connect = async (shipNumber=1, persist=true)=>{
	ship_number = shipNumber;
	epsilon_ip = await getLocalIP();
	await untilConnected();
	connected = true;
	if(persist) ping();
}

const set = async (cmd)=>{
	//if(!connected) throw "Not Connected";
	if(!connected) return;
	const req = `http://${epsilon_ip}:8080/set.lua?${encodeURI(`_OBJECT_=getPlayerShip(${ship_number})&${cmd}`)}`;
	return exec(`curl --max-time 2 "${req}"`)
};

const get = async (cmd)=>{
	//if(!connected) throw "Not Connected";
	if(!connected) return;
	const req = `http://${epsilon_ip}:8080/get.lua?${encodeURI(`_OBJECT_=getPlayerShip(${ship_number})&${cmd}`)}`;
	return exec(`curl --max-time 2 "${req}"`)
		.then((res)=>JSON.parse(res));
};


/************************************************/



const getSystems = async ()=>{
	const drives = [];
	const { hasWarp, hasJump } = await get('hasWarp=hasWarpDrive()&hasJump=hasJumpDrive()');
	if(hasWarp) drives.push('warp');
	if(hasJump) drives.push('jumpdrive');


	//FIXME: might not have beams or weapons!

	return ['reactor', 'beamweapons', 'missilesystem', 'maneuver', 'impulse'].concat(
		drives,
		['frontshield', 'rearshield']);
};

const setPower = async (system, value)=>{
	value = Math.floor(clamp(value, 0, 300));
	return set(`commandSetSystemPowerRequest("${system}",${value / 100})`);
};
const getPower = async (system)=>{
	return get(`power=getSystemPower("${system}")`).then(({ power })=>power * 100);
};

const setCoolant = async (system, value)=>{
	value = Math.floor(clamp(value, 0, 100));
	return set(`commandSetSystemCoolantRequest("${system}",${value / 10})`);
};
const getCoolant = async (system)=>{
	return get(`coolant=getSystemCoolant("${system}")`).then(({ coolant })=>coolant * 10);
};

const getName = async ()=>{
	return get(`name=getTypeName()`).then(({name})=>name);
};

const getShipInfo = async ()=>{
	const fetch = async (obj)=>get(map(obj,(cmd,val)=>`${val}=${cmd}()`).join('&'));

	const ship = await fetch({
		type : 'getTypeName',
		callsign: 'getCallSign',
		hull : 'getHullMax',
		energy: 'getMaxEnergy',
		repair_crew: 'getRepairCrewCount',
		probes: 'getMaxScanProbeCount'
	})

	const shields = await fetch({
		rear: 'getRearShieldMax',
		front: 'getFrontShieldMax',
	})

	const drives = await fetch({
		warp: 'hasWarpDrive',
		jump: 'hasJumpDrive'
	});

	const {tube_count} = await fetch({tube_count : 'getWeaponTubeCount' });

	console.log(tube_count);

	const res = await Promise.all(times(tube_count, (i)=>{
		return get(`val=getWeaponTubeLoadType(${i+1})`)
	}))

	console.log(res);



	//fetch shields separate
	//fetch wepaons separate
	//fetch drives
	//



	return {
		...ship,
		shields,
		drives
	}
}

const renameShip = async (newName)=>{
	return set(`setCallSign('${newName}')`);
}

module.exports = {
	connect,
	set,
	get,
	setPower,
	getPower,
	setCoolant,
	getCoolant,
	getSystems,
	getShipInfo,
	renameShip
};