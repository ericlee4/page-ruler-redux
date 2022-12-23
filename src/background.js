

var PageRuler = {
	screenshot: new Image(),
	canvas: document.createElement("canvas"),
	init(type, previousVersion) {
		console.log("init");
		const manifest = browser.runtime.getManifest();
		const version = manifest.version;
		switch (type) {
		case "install":
			console.log("First time install version: ", version);
			chrome.storage.sync.set({
				statistics: true,
				hide_update_tab: false
			});
			break;

		case "update":
			console.log("Update version. From: ", previousVersion, " To: ", version);
			break;

		default:
			console.log("Existing version run: ", version);
			break;
		}
	},
	image(file) {
		return {
			19: `images/19/${file}`,
			38: `images/38/${file}`
		};
	},
	load(tabId) {
		console.log("loading content script");
		chrome.tabs.executeScript(tabId, {
			file: "content.js"
		}, () => {
			console.log(`content script for tab #${tabId} has loaded`);
			PageRuler.enable(tabId);
		});
	},
	enable(tabId) {
		chrome.tabs.sendMessage(tabId, {
			type: "enable"
		}, success => {
			console.log(`enable message for tab #${tabId} was sent`);
			chrome.browserAction.setIcon({
				path: PageRuler.image("browser_action_on.png"),
				tabId
			});
		});
	},
	disable(tabId) {
		chrome.tabs.sendMessage(tabId, {
			type: "disable"
		}, success => {
			console.log(`disable message for tab #${tabId} was sent`);
			chrome.browserAction.setIcon({
				path: PageRuler.image("browser_action.png"),
				tabId
			});
		});
	},
	browserAction(tab) {
		const tabId = tab.id;
		const args = "'action': 'loadtest'," + "'loaded': window.hasOwnProperty('__PageRuler')," + "'active': window.hasOwnProperty('__PageRuler') && window.__PageRuler.active";
		chrome.tabs.executeScript(tabId, {
			code: `chrome.runtime.sendMessage({ ${args} });`
		});
	},
	openUpdateTab(type) {
		chrome.storage.sync.get("hide_update_tab", items => {
			if (!items.hide_update_tab) {
				chrome.tabs.create({
					url: `update.html#${type}`
				});
			}
		});
	},
	greyscaleConvert(imgData) {
		const grey = new Int16Array(imgData.length / 4);
		for (let i = 0, n = 0; i < imgData.length; i += 4, n++) {
			const r = imgData[i]; const g = imgData[i + 1]; const
				b = imgData[i + 2];
			grey[n] = Math.round(r * 0.2126 + g * 0.7152 + b * 0.0722);
		}
		return grey;
	}
};

chrome.browserAction.onClicked.addListener(PageRuler.browserAction);

chrome.runtime.onStartup.addListener(() => {
	console.log("onStartup");
	PageRuler.init();
});

chrome.runtime.onInstalled.addListener(details => {
	console.log("onInstalled");
	PageRuler.init(details.reason, details.previousVersion);
	switch (details.reason) {
	case "install":
		PageRuler.openUpdateTab("install");
		break;

	case "update":
		PageRuler.openUpdateTab("update");
		break;
	}
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	const tabId = sender.tab && sender.tab.id;
	console.group(`message received from tab #${tabId}`);
	console.log("message: ", message);
	console.log("sender: ", sender);
	switch (message.action) {
	case "borderSearch":
		chrome.tabs.captureVisibleTab({
			format: "png"
		}, dataUrl => {
			PageRuler.screenshot.onload = function() {
				const ctx = PageRuler.canvas.getContext("2d");
				PageRuler.canvas.width = sender.tab.width;
				PageRuler.canvas.height = sender.tab.height;
				ctx.drawImage(PageRuler.screenshot, 0, 0, PageRuler.canvas.width, PageRuler.canvas.height);
				const startX = Math.floor(message.x * message.devicePixelRatio);
				const startY = Math.floor(message.y * message.devicePixelRatio + message.yOffset * message.devicePixelRatio);
				let imageLine;
				if (message.xDir > 0) {
					imageLine = ctx.getImageData(startX, startY, PageRuler.canvas.width - startX, 1).data;
				} else if (message.xDir < 0) {
					imageLine = ctx.getImageData(0, startY, startX + 1, 1).data;
				} else if (message.yDir > 0) {
					imageLine = ctx.getImageData(startX, startY, 1, PageRuler.canvas.height - startY).data;
				} else {
					imageLine = ctx.getImageData(startX, 0, 1, startY + 1).data;
				}
				const gsData = PageRuler.greyscaleConvert(imageLine);
				let startPixel;
				let index = 0;
				let direction = 1;
				let checks = 0;
				let nextPixel;
				const threshHold = 10;
				if (message.xDir < 0 || message.yDir < 0) {
					index = gsData.length - 1;
					direction = -1;
				}
				startPixel = gsData[index];
				index += direction;
				while (index >= 0 && index < gsData.length) {
					nextPixel = gsData[index];
					checks++;
					if (Math.abs(startPixel - nextPixel) > threshHold) {
						break;
					}
					index += direction;
				}
				const spotsToMove = checks <= 1 ? checks : checks - 1;
				const response = {
					x: Math.floor((startX + spotsToMove * message.xDir) / message.devicePixelRatio),
					y: Math.floor((startY + spotsToMove * message.yDir - message.yOffset * message.devicePixelRatio) / message.devicePixelRatio)
				};
				sendResponse(response);
			};
			PageRuler.screenshot.src = dataUrl;
		});
		break;

	case "loadtest":
		if (!message.loaded) {
			PageRuler.load(tabId);
		} else if (message.active) {
			PageRuler.disable(tabId);
		} else {
			PageRuler.enable(tabId);
		}
		break;

	case "disable":
		console.log("tear down");
		if (tabId) {
			PageRuler.disable(tabId);
		}
		break;

	case "setColor":
		console.log(`saving color ${message.color}`);
		chrome.storage.sync.set({
			color: message.color
		});
		break;

	case "getColor":
		console.log("requesting color");
		chrome.storage.sync.get("color", items => {
			const color = items.color || "#5b5bdc";
			console.log(`color requested: ${color}`);
			sendResponse(color);
		});
		break;

	case "setDockPosition":
		console.log(`saving dock position ${message.position}`);
		chrome.storage.sync.set({
			dock: message.position
		});
		break;

	case "getDockPosition":
		console.log("requesting dock position");
		chrome.storage.sync.get("dock", items => {
			const position = items.dock || "top";
			console.log(`dock position requested: ${position}`);
			sendResponse(position);
		});
		break;

	case "setGuides":
		console.log(`saving guides visiblity ${message.visible}`);
		chrome.storage.sync.set({
			guides: message.visible
		});
		break;

	case "getGuides":
		console.log("requesting guides visibility");
		chrome.storage.sync.get("guides", items => {
			const visiblity = items.hasOwnProperty("guides") ? items.guides : true;
			console.log(`guides visibility requested: ${visiblity}`);
			sendResponse(visiblity);
		});
		break;

	case "setBorderSearch":
		chrome.storage.sync.set({
			borderSearch: message.visible
		});
		break;

	case "getBorderSearch":
		chrome.storage.sync.get("borderSearch", items => {
			const visiblity = items.hasOwnProperty("borderSearch") ? items.borderSearch : false;
			sendResponse(visiblity);
		});
		break;

	case "openHelp":
		chrome.tabs.create({
			url: `${chrome.extension.getURL("update.html")}#help`
		});
		break;
	}
	console.groupEnd();
	return true;
});

chrome.commands.onCommand.addListener(command => {
	console.log("Command:", command);
});
