const cp = require('child_process');

const exec = (cmd)=>{
	return new Promise((resolve, reject)=>{
		cp.exec(cmd, (error, stdout, stderr)=>{
			if(error) return reject(error);
			return resolve(stdout);
		});
	});
};

module.exports = (key)=>exec(`send_keys.ahk ${key}`)