'use strict';

const local = {
	startTime: 0,
	countLine: 0
};


/**
 * Initializes the script startup time to determine the processing time at the end of the process.
 */
module.exports.start = () => {
	local.startTime = process.hrtime();
};


/**
 * At end of process, compute time execution.
 * console.log a duration process and memory consumed
 */
module.exports.end = () => {
	const endTime = process.hrtime(local.startTime);
	let totalExecutionmilliSeconds = parseInt((endTime[0] * 1e3) + (endTime[1] * 1e-6), 10);

	console.log(`Finish. In ${totalExecutionmilliSeconds} miliseconds`); // eslint-disable-line
	const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
	console.log(`The script uses approximately ${usedMemory} MB`); // eslint-disable-line
};
