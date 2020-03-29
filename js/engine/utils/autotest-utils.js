import getValueByPath from "./get-value-by-path.js";
import game from "../game.js";
import Button from "../components/button.js";
import ws from "thing-editor/js/editor/utils/socket.js";

let timeoutHandler;
let testsStoppedByUser;

function startTimeout(stepName, timeout) {
	console.log('auto-test step > ' + stepName);
	ws.log('auto-test step > ' + stepName);
	assert(!timeoutHandler, "Previous auto-test step was not finished.");
	timeoutHandler = setTimeout(() => {
		throw new Error("Auto-test step fail by timeout: " + stepName);
	}, timeout);
}

function finishTimeout() {
	clearTimeout(timeoutHandler);
	timeoutHandler = null;
}

export function stopTests() {
	finishTimeout();
	window.__EDITOR_isAutotestInProgress = false;
	testsStoppedByUser = true;
}

export function onTestsStart() {
	testsStoppedByUser = false;
}

export function testWait(name, condition, timeout = 20000) {
	assert(condition, "No condition parameter provided in to testWait.");
	return new Promise((resolve) => {
		startTimeout(name, timeout);
		const attempt = () => {
			if(!testsStoppedByUser) {
				if(testsStoppedByUser || (typeof condition === 'function' ? condition() : getValueByPath(condition, {}))) {
					finishTimeout();
					resolve();
				} else {
					setTimeout(attempt, 100);
				}
			}
		};
		setTimeout(attempt, 100);
	});
}

export function testClickBtn(btnPath, timeout = 20000) {
	return new Promise(async(resolve) => {
		await testWait("Attempt to click button: " + btnPath, () => {
			let b = getValueByPath(btnPath, {});
			return (b instanceof Button) && b.isCanBePressed;
		}, timeout);
		getValueByPath(btnPath, {}).callClick();
		resolve();
	});
}