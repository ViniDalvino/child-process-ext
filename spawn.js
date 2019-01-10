// Credit: Matthew Scragg
// https://github.com/nkashyap/child-process-es6-promise/blob/9c4432f07ade1d954e73ef815b3b72c76a34ece8/index.js#L162-L212

"use strict";

const ensureString = require("es5-ext/object/validate-stringifiable-value")
    , isValue      = require("es5-ext/object/is-value")
    , isObject     = require("es5-ext/object/is-object")
    , ensureObject = require("es5-ext/object/valid-object")
    , spawn        = require("cross-spawn");

module.exports = (command, args = [], options = {}) => {
	let child, stdout, stderr, stdoutBuffer, stderrBuffer;

	const promise = new Promise((resolve, reject) => {
		command = ensureString(command);
		if (isValue(args)) args = Array.from(ensureObject(args), ensureString);
		if (!isObject(options)) options = {};

		child = spawn(command, args, options)
			.on("close", (code, signal) => {
				const result = { code, signal, stdoutBuffer, stderrBuffer };
				if (code) reject(Object.assign(new Error(`Exited with code ${ code }`), result));
				else resolve(result);
			})
			.on("error", error => reject(Object.assign(error, { stdoutBuffer, stderrBuffer })));

		if (child.stdout) {
			({ stdout } = child);
			stdoutBuffer = Buffer.alloc(0);
			child.stdout.on("data", data => {
				promise.stdoutBuffer = stdoutBuffer = Buffer.concat([stdoutBuffer, data]);
			});
		}
		if (child.stderr) {
			({ stderr } = child);
			stderrBuffer = Buffer.alloc(0);
			child.stderr.on("data", data => {
				promise.stderrBuffer = stderrBuffer = Buffer.concat([stderrBuffer, data]);
			});
		}
	});
	return Object.assign(promise, { child, stdout, stderr, stdoutBuffer, stderrBuffer });
};
