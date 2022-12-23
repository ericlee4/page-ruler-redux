window.__PageRuler = {
	active: false,
	el: {},
	elements: {
		toolbar: null,
		mask: null,
		ruler: null,
		guides: null
	},
	enable() {
		const _this = this;
		const styles = this.El.createEl("link", {
			id: "styles",
			rel: "stylesheet",
			href: `${chrome.extension.getURL("content.css")}?${this.version}`
		});
		this.El.appendEl(document.head || document.body || document.documentElement, styles);
		this.elements.toolbar = new this.el.Toolbar();
		this.elements.mask = new this.el.Mask();
		this.elements.guides = new this.el.Guides();
		this.elements.ruler = new this.el.Ruler(this.elements.toolbar, this.elements.guides);
		this.El.registerListener(window, "resize", () => {
			const rect = document.body.getBoundingClientRect();
			const width = rect.width;
			const height = rect.height;
			_this.Dimensions.update(width, height);
		});
		this.El.registerListener(window, "keydown", e => {
			if (_this.elements.ruler.keyMoving) {
				const modifier = e.shiftKey && 10 || 1;
				const action = e.ctrlKey || e.metaKey ? e.altKey ? "shrink" : "expand" : "move";
				const ruler = _this.elements.ruler;
				const actions = {
					up: {
						move() {
							ruler.setTop(ruler.top - modifier, true);
						},
						expand() {
							ruler.setTop(ruler.top - modifier);
							ruler.setHeight(ruler.height + modifier);
						},
						shrink() {
							if (ruler.height > 0) {
								ruler.setHeight(ruler.height - modifier);
							}
						}
					},
					down: {
						move() {
							ruler.setTop(ruler.top + modifier, true);
						},
						expand() {
							ruler.setBottom(_this.elements.ruler.bottom + modifier);
							ruler.setHeight(_this.elements.ruler.height + modifier);
						},
						shrink() {
							if (ruler.height > 0) {
								ruler.setTop(ruler.top + modifier);
								ruler.setHeight(ruler.height - modifier);
							}
						}
					},
					left: {
						move() {
							ruler.setLeft(_this.elements.ruler.left - modifier, true);
						},
						expand() {
							ruler.setLeft(ruler.left - modifier);
							ruler.setWidth(ruler.width + modifier);
						},
						shrink() {
							if (ruler.width > 0) {
								ruler.setWidth(ruler.width - modifier);
							}
						}
					},
					right: {
						move() {
							ruler.setLeft(ruler.left + modifier, true);
						},
						expand() {
							ruler.setRight(ruler.right + modifier);
							ruler.setWidth(ruler.width + modifier);
						},
						shrink() {
							if (ruler.width > 0) {
								ruler.setLeft(ruler.left + modifier);
								ruler.setWidth(ruler.width - modifier);
							}
						}
					}
				};
				const keyMap = {
					38: "up",
					40: "down",
					37: "left",
					39: "right"
				};
				if (keyMap.hasOwnProperty(String(e.keyCode))) {
					e.preventDefault();
					const key = keyMap[e.keyCode];
					actions[key][action]();
				}
			}
		});
		this.active = true;
	},
	disable() {
		this.elements.toolbar.unshiftPage();
		this.El.removeListeners();
		this.El.removeElements();
		this.Dimensions.removeUpdateCallbacks();
		this.elements.toolbar = null;
		this.elements.mask = null;
		this.elements.ruler = null;
		this.active = false;
	},
	cls(constructor, prototype) {
		constructor.prototype = prototype;
		return constructor;
	}
};

(function(pr) {
	pr.Dimensions = {
		pageLeft: 0,
		pageRight: document.body.scrollWidth,
		pageTop: 0,
		pageBottom: document.body.scrollHeight,
		offsetTop() {
			return document.body.getBoundingClientRect().top + window.pageYOffset - document.documentElement.clientTop;
		},
		offsetLeft() {
			return document.body.getBoundingClientRect().left + window.pageXOffset - document.documentElement.clientLeft;
		},
		updateCallbacks: [],
		addUpdateCallback(callback) {
			this.updateCallbacks.push(callback);
		},
		update(pageWidth, pageHeight) {
			this.pageRight = pageWidth;
			this.pageBottom = pageHeight;
			for (let i = 0, ilen = this.updateCallbacks.length; i < ilen; i++) {
				this.updateCallbacks[i](this.pageRight, this.pageBottom);
			}
		},
		removeUpdateCallbacks() {
			for (let i = 0, ilen = this.updateCallbacks.length; i < ilen; i++) {
				this.updateCallbacks[i] = null;
			}
			this.updateCallbacks = [];
		}
	};
})(__PageRuler);

(function(pr) {
	pr.El = {
		elements: [],
		listeners: [],
		createEl(tag, attrs, listeners, text) {
			attrs = attrs || {};
			attrs.id = !!attrs.id && `page-ruler-${attrs.id}` || "page-ruler";
			const el = document.createElement(tag);
			for (let attr in attrs) {
				if (attrs.hasOwnProperty(attr)) {
					let attrVal = attrs[attr];
					if (attr === "cls") {
						attr = "class";
					}
					if (attr === "class") {
						if (attrVal instanceof Array) {
							attrVal = `page-ruler-${attrVal.join(" page-ruler-")}`;
						} else {
							attrVal = `page-ruler-${attrVal}`;
						}
					}
					if (attr === "for") {
						attrVal = `page-ruler-${attrVal}`;
					}
					el.setAttribute(attr, attrVal);
				}
			}
			listeners = listeners || {};
			for (const type in listeners) {
				this.registerListener(el, type, listeners[type]);
			}
			if (text) {
				el.innerText = text;
			}
			this.elements.push(el);
			return el;
		},
		appendEl(parent, children) {
			if (!(children instanceof Array)) {
				children = [children];
			}
			for (let i = 0; i < children.length; i++) {
				parent.appendChild(children[i]);
			}
		},
		registerListener(el, type, func) {
			el.addEventListener(type, func, false);
			this.listeners.push({
				el,
				type,
				func
			});
		},
		removeListeners() {
			while (this.listeners.length > 0) {
				let listener = this.listeners.pop();
				listener.el.removeEventListener(listener.type, listener.func, false);
				listener = null;
			}
		},
		removeElements() {
			while (this.elements.length > 0) {
				let el = this.elements.pop();
				if (el instanceof HTMLElement) {
					el.parentNode.removeChild(el);
				}
				el = null;
			}
			this.elements = [];
		},
		hasClass(el, cls) {
			return el.classList.contains(cls);
		},
		addClass(el, cls) {
			el.classList.add(cls);
		},
		removeClass(el, cls) {
			el.classList.remove(cls);
		},
		getLeft(el) {
			const boundingRect = el.getBoundingClientRect();
			const left = boundingRect.left || 0;
			const documentOffsetLeft = document.body.ownerDocument.defaultView.pageXOffset;
			const offsetLeft = pr.Dimensions.offsetLeft();
			return left + documentOffsetLeft - offsetLeft;
		},
		getTop(el) {
			const boundingRect = el.getBoundingClientRect();
			const top = boundingRect.top || 0;
			const documentOffsetTop = document.body.ownerDocument.defaultView.pageYOffset;
			const offsetTop = pr.Dimensions.offsetTop();
			return top + documentOffsetTop - offsetTop;
		},
		getWidth(el) {
			const boundingRect = el.getBoundingClientRect();
			return boundingRect.width || 0;
		},
		getHeight(el) {
			const boundingRect = el.getBoundingClientRect();
			return boundingRect.height || 0;
		},
		getDescription(el, asParts) {
			if (!el.tagName) {
				throw "tagName does not exist";
			}
			const parts = {
				tag: el.tagName.toLowerCase(),
				id: "",
				cls: ""
			};
			let desc = el.tagName.toLowerCase();
			parts.tag = desc;
			if (el.id) {
				desc += `#${el.id}`;
				parts.id = `#${el.id}`;
			}
			if (el.classList.length > 0) {
				desc += `.${Array.prototype.slice.call(el.classList).join(".")}`;
				parts.cls = `.${Array.prototype.slice.call(el.classList).join(".")}`;
			}
			return asParts && parts || desc;
		},
		getParentNode(el) {
			return el.parentNode;
		},
		isIllegal(el) {
			const illegalTags = ["head", "script", "noscript"];
			return el.nodeType !== 1 || illegalTags.indexOf(el.tagName.toLowerCase()) >= 0;
		},
		getChildNode(el) {
			let childNode = null;
			if (el.childNodes) {
				childNode = el.firstChild;
				while (childNode && this.isIllegal(childNode)) {
					childNode = childNode.nextSibling;
				}
			}
			if (childNode && childNode.tagName.toLowerCase() === "head") {
				childNode = document.body;
			}
			return childNode;
		},
		getPreviousSibling(el) {
			let prevNode = el.previousElementSibling;
			while (prevNode && this.isIllegal(prevNode)) {
				prevNode = prevNode.previousElementSibling;
			}
			return prevNode;
		},
		getNextSibling(el) {
			let nextNode = el.nextElementSibling;
			while (nextNode && this.isIllegal(nextNode)) {
				nextNode = nextNode.nextElementSibling;
			}
			return nextNode;
		},
		inElement(el, parent) {
			let inParent = false;
			let parentNode = el.parentNode;
			while (parentNode) {
				if (parentNode === parent) {
					inParent = true;
					break;
				}
				parentNode = parentNode.parentNode;
			}
			return inParent;
		}
	};
})(__PageRuler);

(function(pr) {
	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		switch (message.type) {
		case "enable":
			pr.enable();
			break;

		case "disable":
			pr.disable();
			break;
		}
		sendResponse({
			success: true
		});
	});
})(__PageRuler);

(function(pr) {
	pr.Mouse = {
		getXY(e, noOffset) {
			let x = e.pageX;
			let y = e.pageY;
			if (!noOffset) {
				const offsetX = pr.Dimensions.offsetLeft();
				x -= offsetX;
				const offsetY = pr.Dimensions.offsetTop();
				y -= offsetY;
			}
			return {
				x,
				y
			};
		},
		getX(e) {
			return this.getXY(e).x;
		},
		getY(e, noOffset) {
			return this.getXY(e, noOffset).y;
		},
		getClientXY(e, noOffset) {
			const x = e.clientX;
			let y = e.clientY;
			if (!noOffset) {
				y -= pr.elements.toolbar.height;
				if (pr.elements.toolbar.elementMode) {
					y -= pr.elements.toolbar.elementToolbar.height;
				}
			}
			return {
				x,
				y
			};
		},
		getClientX(e) {
			return this.getClientXY(e).x;
		},
		getClientY(e, noOffset) {
			return this.getClientXY(e, noOffset).y;
		}
	};
})(__PageRuler);

(function(pr) {
	pr.Util = {
		px(num) {
			return `${num}px`;
		},
		locale(message, options) {
			let text = chrome.i18n.getMessage(message);
			switch (options) {
			case "lowercase":
				text = text.toLocaleLowerCase();
				break;

			case "uppercase":
				text = text.toLocaleUpperCase();
				break;
			}
			return text;
		},
		hexToRGB(hex, alpha) {
			alpha = alpha || 1;
			const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
			hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
			const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
			const r = parseInt(result[1], 16);
			const g = parseInt(result[2], 16);
			const b = parseInt(result[3], 16);
			return `rgba(${r}, ${g}, ${b}, ${alpha})`;
		}
	};
})(__PageRuler);

(function(pr) {
	pr.el.BorderSearch = pr.cls(function(ruler, positionDir, leftOrRight, topOrBottom, cls) {
		const id = `bordersearch-${positionDir}-${leftOrRight}-${topOrBottom}`;
		const attrs = {
			id,
			class: [cls, id]
		};
		this.dom = pr.El.createEl("div", attrs);
		pr.El.registerListener(this.dom, "click", e => {
			e.stopPropagation();
			e.preventDefault();
			ruler.borderSearch(positionDir, leftOrRight, topOrBottom);
		});
	}, {
		dom: null,
		setColor(hex) {
			this.dom.style.setProperty("border-color", hex, "important");
		}
	});
})(__PageRuler);

(function(pr) {
	pr.el.Element = pr.cls(function(dom) {
		this.dom = dom;
		const config = {
			width: pr.El.getWidth(dom),
			height: pr.El.getHeight(dom),
			top: pr.El.getTop(dom),
			left: pr.El.getLeft(dom)
		};
		pr.elements.ruler.reset(config);
	}, {
		dom: null
	});
})(__PageRuler);

(function(pr) {
	pr.el.ElementToolbar = pr.cls(function(toolbar) {
		const _this = this;
		this.toolbar = toolbar;
		this.dom = pr.El.createEl("div", {
			id: "element-toolbar"
		}, {
			click(e) {
				e.stopPropagation();
			},
			mousedown(e) {
				e.stopPropagation();
			}
		});
		this.els.helpContainer = this.generateHelpContainer();
		this.els.elementContainer = this.generateElementContainer();
		this.els.navigationContainer = this.generateNavigationContainer();
		const trackingModeContainer = this.generateTrackingModeContainer();
		pr.El.appendEl(this.dom, [this.els.helpContainer, this.els.elementContainer, this.els.navigationContainer, trackingModeContainer]);
		pr.El.registerListener(document, "click", e => {
			e.preventDefault();
			e.stopPropagation();
			if (_this.tracking && e.target.tagName.toLowerCase() !== "html") {
				_this.setTracking(false, true);
			}
		});
	}, {
		dom: null,
		els: {
			helpContainer: null,
			elementContainer: null,
			element: null,
			upContainer: null,
			up: null,
			downContainer: null,
			down: null,
			previousContainer: null,
			previous: null,
			nextContainer: null,
			next: null,
			navigationContainer: null,
			trackingContainer: null,
			trackingInput: null
		},
		height: 30,
		toolbar: null,
		tracking: false,
		element: null,
		show() {
			this.dom.style.setProperty("display", "flex", "important");
			const height = this.height + this.toolbar.height;
			this.toolbar.dom.style.setProperty("height", pr.Util.px(height), "important");
			this.toolbar.shiftPage(height);
			this.setTracking(true, true);
		},
		hide() {
			this.dom.style.removeProperty("display");
			this.toolbar.dom.style.removeProperty("height");
			this.toolbar.shiftPage(this.toolbar.height);
			this.setTracking(false, true);
			this.element = null;
			this.els.helpContainer.style.removeProperty("display");
			this.els.elementContainer.style.setProperty("display", "none", "important");
			this.els.navigationContainer.style.setProperty("display", "none", "important");
		},
		generateHelpContainer() {
			const container = pr.El.createEl("div", {
				id: "element-toolbar-help-container",
				cls: ["help-container", "container"]
			}, {}, pr.Util.locale("elementToolbarHelp"));
			return container;
		},
		generateTagContainer(id) {
			const container = pr.El.createEl("div", {
				id: `element-toolbar-${id}`
			});
			const elementTag = pr.El.createEl("span", {
				id: `element-toolbar-${id}-tag`,
				cls: "tag"
			});
			const elementId = pr.El.createEl("span", {
				id: `element-toolbar-${id}-id`,
				cls: "id"
			});
			const elementCls = pr.El.createEl("span", {
				id: `element-toolbar-${id}-cls`,
				cls: "cls"
			});
			pr.El.appendEl(container, [elementTag, elementId, elementCls]);
			return container;
		},
		generateElementContainer() {
			const _this = this;
			const container = pr.El.createEl("div", {
				id: "element-toolbar-element-container",
				cls: ["container", "nav-container"],
				style: "display:none !important;"
			}, {
				click(e) {
					_this.setElement(_this.element.dom);
				}
			});
			this.els.element = this.generateTagContainer("element");
			pr.El.appendEl(container, [this.els.element]);
			return container;
		},
		generateNavigationContainer() {
			const _this = this;
			const container = pr.El.createEl("div", {
				id: "element-toolbar-navigate-container",
				cls: "container",
				style: "display:none !important;"
			});
			this.els.upContainer = pr.El.createEl("div", {
				id: "element-toolbar-navigate-up-container",
				cls: "nav-container"
			}, {
				click(e) {
					_this.setElement(pr.El.getParentNode(_this.element.dom));
				}
			});
			const upImg = pr.El.createEl("img", {
				id: "element-toolbar-navigate-up-img",
				src: chrome.extension.getURL("images/arrow-up.png")
			});
			this.els.up = this.generateTagContainer("up");
			pr.El.appendEl(this.els.upContainer, [upImg, this.els.up]);
			this.els.downContainer = pr.El.createEl("div", {
				id: "element-toolbar-navigate-down-container",
				cls: "nav-container"
			}, {
				click(e) {
					_this.setElement(pr.El.getChildNode(_this.element.dom));
				}
			});
			const downImg = pr.El.createEl("img", {
				id: "element-toolbar-navigate-down-img",
				src: chrome.extension.getURL("images/arrow-down.png")
			});
			this.els.down = this.generateTagContainer("down");
			pr.El.appendEl(this.els.downContainer, [downImg, this.els.down]);
			this.els.previousContainer = pr.El.createEl("div", {
				id: "element-toolbar-navigate-previous-container",
				cls: "nav-container"
			}, {
				click(e) {
					_this.setElement(pr.El.getPreviousSibling(_this.element.dom));
				}
			});
			const previousImg = pr.El.createEl("img", {
				id: "element-toolbar-navigate-previous-img",
				src: chrome.extension.getURL("images/arrow-left.png")
			});
			this.els.previous = this.generateTagContainer("previous");
			pr.El.appendEl(this.els.previousContainer, [previousImg, this.els.previous]);
			this.els.nextContainer = pr.El.createEl("div", {
				id: "element-toolbar-navigate-next-container",
				cls: "nav-container"
			}, {
				click(e) {
					_this.setElement(pr.El.getNextSibling(_this.element.dom));
				}
			});
			const nextImg = pr.El.createEl("img", {
				id: "element-toolbar-navigate-next-img",
				src: chrome.extension.getURL("images/arrow-right.png")
			});
			this.els.next = this.generateTagContainer("next");
			pr.El.appendEl(this.els.nextContainer, [nextImg, this.els.next]);
			pr.El.appendEl(container, [this.els.upContainer, this.els.downContainer, this.els.previousContainer, this.els.nextContainer]);
			return container;
		},
		generateTrackingModeContainer() {
			const _this = this;
			this.els.trackingContainer = pr.El.createEl("div", {
				id: "element-toolbar-tracking-mode-container",
				cls: "container"
			});
			const label = pr.El.createEl("label", {
				id: "element-toolbar-tracking-mode-label",
				for: "element-toolbar-tracking-mode-input"
			}, {}, pr.Util.locale("elementToolbarTrackingMode"));
			let lang = (navigator.language || "").split("-")[0];
			if (lang) {
				lang = `lang_${lang}`;
			}
			const toggle = pr.El.createEl("div", {
				id: "element-toolbar-tracking-mode-toggle",
				cls: `checkbox-toggle ${lang}`
			});
			const input = pr.El.createEl("input", {
				id: "element-toolbar-tracking-mode-input",
				type: "checkbox",
				checked: true
			}, {
				change(e) {
					_this.setTracking(this.checked, false);
				}
			});
			this.els.trackingInput = input;
			const toggleLabel = pr.El.createEl("label", {
				id: "element-toolbar-tracking-mode-toggle-label",
				for: "element-toolbar-tracking-mode-input"
			});
			const labelInner = pr.El.createEl("div", {
				id: "element-toolbar-tracking-mode-label-inner",
				class: "inner"
			});
			const labelSwitch = pr.El.createEl("div", {
				id: "element-toolbar-tracking-mode-label-switch",
				class: `switch ${lang}`
			});
			pr.El.appendEl(toggleLabel, [labelInner, labelSwitch]);
			pr.El.appendEl(toggle, [input, toggleLabel]);
			pr.El.appendEl(this.els.trackingContainer, [label, toggle]);
			return this.els.trackingContainer;
		},
		setTracking(tracking, toggleInput) {
			this.tracking = tracking;
			if (tracking) {
				this.toolbar.ruler.ruler.classList.add("tracking");
			} else {
				this.toolbar.ruler.ruler.classList.remove("tracking");
			}
			if (toggleInput) {
				this.els.trackingInput.checked = tracking;
			}
		},
		setElementDescription(container, element, title) {
			try {
				const descParts = pr.El.getDescription(element, true);
				container.querySelector(".page-ruler-tag").innerText = descParts.tag;
				container.querySelector(".page-ruler-id").innerText = descParts.id;
				container.querySelector(".page-ruler-cls").innerText = descParts.cls;
				container.title = `${title}: ${descParts.tag}${descParts.id}${descParts.cls}`;
			} catch (e) {}
		},
		setNavigation(direction, target) {
			let element; let container; let
				title;
			switch (direction) {
			case "up":
				container = this.els.upContainer;
				element = pr.El.getParentNode(target);
				title = pr.Util.locale("elementToolbarParentNode");
				break;

			case "down":
				container = this.els.downContainer;
				element = pr.El.getChildNode(target);
				title = pr.Util.locale("elementToolbarChildNode");
				break;

			case "previous":
				container = this.els.previousContainer;
				element = pr.El.getPreviousSibling(target);
				title = pr.Util.locale("elementToolbarPreviousSibling");
				break;

			case "next":
				container = this.els.nextContainer;
				element = pr.El.getNextSibling(target);
				title = pr.Util.locale("elementToolbarNextSibling");
				break;
			}
			if (!!element && element !== document.documentElement && !(element.id && element.id.match(/^page\-ruler/))) {
				container.style.removeProperty("display");
				this.setElementDescription(container, element, title);
			} else {
				container.style.setProperty("display", "none", "important");
			}
		},
		setElement(target) {
			if (this.element === null) {
				this.els.helpContainer.style.setProperty("display", "none", "important");
				this.els.elementContainer.style.removeProperty("display");
				this.els.navigationContainer.style.removeProperty("display");
			}
			this.element = new pr.el.Element(target);
			this.setElementDescription(this.els.element, this.element.dom, pr.Util.locale("elementToolbarHighlightedElement"));
			this.setNavigation("up", target);
			this.setNavigation("down", target);
			this.setNavigation("previous", target);
			this.setNavigation("next", target);
			pr.elements.guides.setSizes();
			pr.elements.ruler.show();
		}
	});
})(__PageRuler);

(function(pr) {
	pr.el.Guides = pr.cls(function() {
		const _this = this;
		const guides = ["top-left", "top-right", "bottom-left", "bottom-right"];
		this.dom = pr.El.createEl("div", {
			id: "guides"
		});
		this.dom.style.setProperty("width", pr.Util.px(pr.Dimensions.pageRight), "important");
		this.dom.style.setProperty("height", pr.Util.px(pr.Dimensions.pageBottom), "important");
		for (let i = 0, ilen = guides.length; i < ilen; i++) {
			const position = guides[i];
			const attrs = {
				id: `guide-${position}`,
				class: ["guide", `guide-${position}`]
			};
			const key = position.replace(/\-\w/, char => char.toUpperCase().replace("-", ""));
			this[key] = pr.El.createEl("div", attrs);
			pr.El.appendEl(this.dom, this[key]);
		}
		pr.El.appendEl(document.body, this.dom);
		this.setVisible(this.visible);
		pr.Dimensions.addUpdateCallback((width, height) => {
			_this.dom.style.setProperty("width", pr.Util.px(width), "important");
			_this.dom.style.setProperty("height", pr.Util.px(height), "important");
			_this.setSizes();
		});
	}, {
		dom: null,
		visible: true,
		topLeft: null,
		topRight: null,
		bottomLeft: null,
		bottomRight: null,
		each(callback) {
			callback.call(this, this.topLeft);
			callback.call(this, this.topRight);
			callback.call(this, this.bottomLeft);
			callback.call(this, this.bottomRight);
		},
		setColor(hex) {
			this.each(guide => {
				guide.style.setProperty("border-color", hex, "important");
			});
		},
		setSizes() {
			this.setVisible(this.visible, false);
			const ruler = pr.elements.ruler;
			const leftWidth = ruler.left + 1;
			let rightWidth = pr.Dimensions.pageRight - ruler.right + 1;
			if (rightWidth < 0) {
				rightWidth = 0;
			}
			const topHeight = ruler.top + 1;
			let bottomHeight = pr.Dimensions.pageBottom - ruler.bottom + 1;
			if (bottomHeight < 0) {
				bottomHeight = 0;
			}
			this.topLeft.style.setProperty("width", pr.Util.px(leftWidth), "important");
			this.topLeft.style.setProperty("height", pr.Util.px(topHeight), "important");
			this.topRight.style.setProperty("width", pr.Util.px(rightWidth), "important");
			this.topRight.style.setProperty("height", pr.Util.px(topHeight), "important");
			this.bottomLeft.style.setProperty("width", pr.Util.px(leftWidth), "important");
			this.bottomLeft.style.setProperty("height", pr.Util.px(bottomHeight), "important");
			this.bottomRight.style.setProperty("width", pr.Util.px(rightWidth), "important");
			this.bottomRight.style.setProperty("height", pr.Util.px(bottomHeight), "important");
		},
		hide() {
			this.dom.style.setProperty("display", "none", "important");
		},
		show() {
			this.dom.style.removeProperty("display");
		},
		setVisible(visible, save) {
			this.visible = !!visible;
			if (this.visible === true) {
				this.show();
			} else {
				this.hide();
			}
			if (save) {
				chrome.runtime.sendMessage({
					action: "setGuides",
					visible: this.visible
				});
			}
		}
	});
})(__PageRuler);

(function(pr) {
	pr.el.Mask = pr.cls(function() {
		const _this = this;
		this.dom = pr.El.createEl("div", {
			id: "mask"
		});
		this.dom.style.setProperty("width", pr.Util.px(pr.Dimensions.pageRight), "important");
		this.dom.style.setProperty("height", pr.Util.px(pr.Dimensions.pageBottom), "important");
		pr.El.appendEl(document.body, this.dom);
		pr.Dimensions.addUpdateCallback((width, height) => {
			_this.dom.style.setProperty("width", pr.Util.px(width), "important");
			_this.dom.style.setProperty("height", pr.Util.px(height), "important");
		});
		pr.El.registerListener(this.dom, "mousedown", () => {
			document.activeElement.blur();
		});
	}, {
		dom: null
	});
})(__PageRuler);

(function(pr) {
	pr.el.Resize = pr.cls(function(ruler, id, cls) {
		const directions = {
			top: false,
			bottom: false,
			left: false,
			right: false
		};
		const positions = id.split("-");
		for (let i = 0, ilen = positions.length; i < ilen; i++) {
			directions[positions[i]] = true;
		}
		const attrs = {
			id: `resize-${id}`,
			class: [cls, id]
		};
		this.dom = pr.El.createEl("div", attrs);
		pr.El.registerListener(this.dom, "mousedown", e => {
			const mouseX = pr.Mouse.getX(e);
			const mouseY = pr.Mouse.getY(e);
			e.stopPropagation();
			e.preventDefault();
			ruler.resizingLeft = directions.left;
			ruler.resizingTop = directions.top;
			ruler.resizingBottom = directions.bottom;
			ruler.resizingRight = directions.right;
			if (directions.left) {
				ruler.resizingOffsetLeft = mouseX - ruler.left;
			}
			if (directions.top) {
				ruler.resizingOffsetTop = mouseY - ruler.top;
			}
			if (directions.bottom) {
				ruler.resizingOffsetBottom = ruler.bottom - mouseY;
			}
			if (directions.right) {
				ruler.resizingOffsetRight = ruler.right - mouseX;
			}
		});
		pr.El.registerListener(this.dom, "mouseup", e => {
			ruler.resizingLeft = false;
			ruler.resizingTop = false;
			ruler.resizingBottom = false;
			ruler.resizingRight = false;
			ruler.resizingOffsetLeft = 0;
			ruler.resizingOffsetTop = 0;
			ruler.resizingOffsetBottom = 0;
			ruler.resizingOffsetRight = 0;
		});
	}, {
		dom: null,
		setColor(hex) {
			this.dom.style.setProperty("border-color", hex, "important");
		}
	});
})(__PageRuler);

(function(pr) {
	pr.el.Ruler = pr.cls(function(toolbar, guides) {
		const _this = this;
		this.toolbar = toolbar;
		this.toolbar.ruler = this;
		this.guides = guides;
		this.createDom();
		this.reset();
		pr.El.registerListener(this.ruler, "mousedown", e => {
			e.stopPropagation();
			e.preventDefault();
			document.activeElement.blur();
			_this.movingLeft = true;
			_this.movingTop = true;
		});
		pr.El.registerListener(this.ruler, "mouseup", e => {
			_this.movingLeft = false;
			_this.gapLeft = null;
			_this.resizingLeft = false;
			_this.movingTop = false;
			_this.gapTop = null;
			_this.resizingTop = false;
			_this.resizingRight = false;
			_this.resizingBottom = false;
		});
		pr.El.registerListener(document, "mousedown", e => {
			if (!_this.toolbar.elementToolbar.tracking && e.target.tagName.toLowerCase() !== "html") {
				pr.elements.guides.hide();
				const mouseXY = pr.Mouse.getXY(e);
				const mouseX = mouseXY.x;
				const mouseY = mouseXY.y;
				e.preventDefault();
				e.stopPropagation();
				_this.reset({
					left: mouseX,
					top: mouseY,
					width: 2,
					height: 2
				});
				_this.resizingRight = true;
				_this.resizingBottom = true;
				_this.show();
			}
		});
		pr.El.registerListener(document, "mouseup", () => {
			_this.movingLeft = false;
			_this.movingTop = false;
			_this.movingRight = false;
			_this.movingDown = false;
			_this.resizingLeft = false;
			_this.resizingTop = false;
			_this.resizingRight = false;
			_this.resizingBottom = false;
		});
		pr.El.registerListener(document, "mousemove", e => {
			if (_this.toolbar.elementToolbar.tracking && !pr.El.inElement(e.target, _this.toolbar.dom)) {
				e.preventDefault();
				e.stopPropagation();
				const mouseXY = pr.Mouse.getClientXY(e, true);
				const mouseX = mouseXY.x;
				const mouseY = mouseXY.y;
				pr.elements.mask.dom.style.setProperty("display", "none", "important");
				_this.ruler.style.setProperty("display", "none", "important");
				if (_this.guides.visible) {
					_this.guides.hide();
				}
				_this.toolbar.elementToolbar.setElement(document.elementFromPoint(mouseX, mouseY));
				pr.elements.mask.dom.style.removeProperty("display");
				_this.ruler.style.removeProperty("display");
				if (_this.guides.visible) {
					_this.guides.show();
				}
			} else {
				_this.move(e);
				_this.resize(e);
			}
		});
	}, {
		toolbar: null,
		ruler: null,
		guides: null,
		resizeElements: {
			top: null,
			bottom: null,
			left: null,
			right: null,
			topLeft: null,
			topRight: null,
			bottomLeft: null,
			bottomRight: null
		},
		borderSearchElements: {
			udLeftTop: null,
			udRightTop: null,
			lrLeftTop: null,
			lrRightTop: null,
			lrLeftBottom: null,
			lrRightBottom: null,
			udLeftBottom: null,
			udRightBottom: null
		},
		width: 0,
		height: 0,
		left: 0,
		resizingLeft: false,
		resizingOffsetLeft: 0,
		top: 0,
		resizingTop: false,
		resizingOffsetTop: 0,
		right: 0,
		resizingRight: false,
		resizingOffsetRight: 0,
		bottom: 0,
		resizingBottom: false,
		resizingOffsetBottom: 0,
		movingLeft: false,
		movingTop: false,
		gapLeft: null,
		gapTop: null,
		keyMoving: true,
		createDom() {
			const _this = this;
			this.ruler = pr.El.createEl("div");
			const container = pr.El.createEl("div", {
				id: "container",
				class: "container"
			});
			this.resizeElements.top = new pr.el.Resize(this, "top", "edge");
			this.resizeElements.bottom = new pr.el.Resize(this, "bottom", "edge");
			this.resizeElements.left = new pr.el.Resize(this, "left", "edge");
			this.resizeElements.right = new pr.el.Resize(this, "right", "edge");
			this.resizeElements.topLeft = new pr.el.Resize(this, "top-left", "corner");
			this.resizeElements.topRight = new pr.el.Resize(this, "top-right", "corner");
			this.resizeElements.bottomLeft = new pr.el.Resize(this, "bottom-left", "corner");
			this.resizeElements.bottomRight = new pr.el.Resize(this, "bottom-right", "corner");
			pr.El.appendEl(container, [this.resizeElements.top.dom, this.resizeElements.bottom.dom, this.resizeElements.left.dom, this.resizeElements.right.dom, this.resizeElements.topLeft.dom, this.resizeElements.topRight.dom, this.resizeElements.bottomLeft.dom, this.resizeElements.bottomRight.dom]);
			this.borderSearchElements.udLeftTop = new pr.el.BorderSearch(this, "ud", "left", "top", "corner page-ruler-bordersearch");
			this.borderSearchElements.udRightTop = new pr.el.BorderSearch(this, "ud", "right", "top", "corner page-ruler-bordersearch");
			this.borderSearchElements.lrLeftTop = new pr.el.BorderSearch(this, "lr", "left", "top", "corner page-ruler-bordersearch");
			this.borderSearchElements.lrRightTop = new pr.el.BorderSearch(this, "lr", "right", "top", "corner page-ruler-bordersearch");
			this.borderSearchElements.lrLeftBottom = new pr.el.BorderSearch(this, "lr", "left", "bottom", "corner page-ruler-bordersearch");
			this.borderSearchElements.lrRightBottom = new pr.el.BorderSearch(this, "lr", "right", "bottom", "corner page-ruler-bordersearch");
			this.borderSearchElements.udLeftBottom = new pr.el.BorderSearch(this, "ud", "left", "bottom", "corner page-ruler-bordersearch");
			this.borderSearchElements.udRightBottom = new pr.el.BorderSearch(this, "ud", "right", "bottom", "corner page-ruler-bordersearch");
			pr.El.appendEl(container, [this.borderSearchElements.udLeftTop.dom, this.borderSearchElements.udRightTop.dom, this.borderSearchElements.lrLeftTop.dom, this.borderSearchElements.lrRightTop.dom, this.borderSearchElements.lrLeftBottom.dom, this.borderSearchElements.lrRightBottom.dom, this.borderSearchElements.udLeftBottom.dom, this.borderSearchElements.udRightBottom.dom]);
			pr.El.appendEl(this.ruler, container);
			pr.El.appendEl(document.body, this.ruler);
			chrome.runtime.sendMessage({
				action: "getColor"
			}, color => {
				_this.setColor(color, false);
			});
		},
		show() {
			this.ruler.style.removeProperty("display");
		},
		hide() {
			this.ruler.style.setProperty("display", "none", "important");
		},
		borderSearch(positionDir, leftOrRight, topOrBottom) {
			const _this = this;
			const x = leftOrRight === "left" ? _this.left : _this.right;
			const y = topOrBottom === "top" ? _this.top : _this.bottom;
			let xDir = 0;
			let yDir = 0;
			if (positionDir === "lr") {
				xDir = leftOrRight === "left" ? -1 : 1;
			} else {
				yDir = topOrBottom === "top" ? -1 : 1;
			}
			pr.elements.mask.dom.style.setProperty("display", "none", "important");
			_this.ruler.style.setProperty("display", "none", "important");
			if (_this.guides.visible) {
				_this.guides.hide();
			}
			setTimeout(() => {
				chrome.runtime.sendMessage({
					action: "borderSearch",
					x,
					y,
					xDir,
					yDir,
					yOffset: _this.toolbar.height - window.pageYOffset,
					devicePixelRatio: window.devicePixelRatio
				}, response => {
					if (leftOrRight === "left") {
						const newWidth = _this.width + (_this.left - response.x);
						_this.setLeft(response.x);
						_this.setWidth(newWidth);
					} else {
						_this.setWidth(_this.width + (response.x - _this.right));
					}
					if (topOrBottom === "top") {
						const newHeight = _this.height + (_this.top - response.y);
						_this.setTop(response.y);
						_this.setHeight(newHeight);
					} else {
						_this.setHeight(_this.height + (response.y - _this.bottom));
					}
					pr.elements.mask.dom.style.removeProperty("display");
					_this.ruler.style.removeProperty("display");
					if (_this.guides.visible) {
						_this.guides.show();
					}
				});
			}, 1);
		},
		setColor(hex, save) {
			this.ruler.style.setProperty("border-color", hex, "important");
			this.ruler.style.setProperty("background-color", pr.Util.hexToRGB(hex, 0.2), "important");
			this.resizeElements.topLeft.setColor(hex);
			this.resizeElements.topRight.setColor(hex);
			this.resizeElements.bottomLeft.setColor(hex);
			this.resizeElements.bottomRight.setColor(hex);
			this.borderSearchElements.udLeftTop.setColor(hex);
			this.borderSearchElements.udRightTop.setColor(hex);
			this.borderSearchElements.lrLeftTop.setColor(hex);
			this.borderSearchElements.lrLeftBottom.setColor(hex);
			this.borderSearchElements.lrRightTop.setColor(hex);
			this.borderSearchElements.lrRightBottom.setColor(hex);
			this.borderSearchElements.udLeftBottom.setColor(hex);
			this.borderSearchElements.udRightBottom.setColor(hex);
			this.guides.setColor(hex);
			this.toolbar.setColor(hex);
			if (save) {
				chrome.runtime.sendMessage({
					action: "setColor",
					color: hex
				});
			}
		},
		reset(config) {
			config = config || {};
			this.width = config.width || 0;
			this.toolbar.setWidth(this.width);
			this.height = config.height || 0;
			this.toolbar.setHeight(this.height);
			this.left = config.left || 0;
			this.resizingLeft = false;
			this.resizingOffsetLeft = 0;
			this.toolbar.setLeft(this.left);
			this.top = config.top || 0;
			this.resizingTop = false;
			this.resizingOffsetTop = 0;
			this.toolbar.setTop(this.top);
			this.right = this.left + this.width;
			this.resizingRight = false;
			this.resizingOffsetRight = 0;
			this.toolbar.setRight(this.right);
			this.bottom = this.top + this.height;
			this.resizingBottom = false;
			this.resizingOffsetBottom = 0;
			this.toolbar.setBottom(this.bottom);
			this.movingLeft = false;
			this.movingTop = false;
			this.gapLeft = null;
			this.gapTop = null;
			this.ruler.style.width = pr.Util.px(this.width);
			this.ruler.style.height = pr.Util.px(this.height);
			this.ruler.style.top = pr.Util.px(this.top);
			this.ruler.style.left = pr.Util.px(this.left);
			this.hide();
		},
		setLeft(left, updateRight) {
			left = parseInt(left, 10);
			if (Number.isNaN(left)) {
				left = this.left;
			} else if (left < 0) {
				left = 0;
			} else if (left > pr.Dimensions.pageRight - this.width) {
				left = pr.Dimensions.pageRight - this.width;
			} else if (left < pr.Dimensions.pageLeft) {
				left = pr.Dimensions.pageLeft;
			}
			this.left = left;
			this.ruler.style.setProperty("left", pr.Util.px(left), "");
			if (updateRight === true) {
				this.setRight(left + this.width);
			}
			this.toolbar.setLeft(left);
			this.guides.setSizes();
		},
		setTop(top, updateBottom) {
			top = parseInt(top, 10);
			if (Number.isNaN(top)) {
				top = this.top;
			} else if (top < 0) {
				top = 0;
			} else if (top > pr.Dimensions.pageBottom + this.height) {
				top = pr.Dimensions.pageBottom - this.height;
			} else if (top < pr.Dimensions.pageTop) {
				top = pr.Dimensions.pageTop;
			}
			this.top = top;
			this.ruler.style.setProperty("top", pr.Util.px(top), "");
			if (updateBottom === true) {
				this.setBottom(top + this.height);
			}
			this.toolbar.setTop(top);
			this.guides.setSizes();
		},
		setRight(right, updateLeft) {
			right = parseInt(right, 10);
			if (Number.isNaN(right)) {
				right = this.right;
			} else if (right < pr.Dimensions.pageLeft + this.width) {
				right = pr.Dimensions.pageLeft + this.width;
			} else if (right > pr.Dimensions.pageRight) {
				right = pr.Dimensions.pageRight;
			} else if (right > pr.Dimensions.pageRight) {
				right = pr.Dimensions.pageRight;
				this.setLeft(right - this.width, false);
			}
			this.right = right;
			if (updateLeft === true) {
				this.setLeft(right - this.width, false);
			}
			this.toolbar.setRight(right);
			this.guides.setSizes();
		},
		setBottom(bottom, updateTop) {
			bottom = parseInt(bottom, 10);
			if (Number.isNaN(bottom)) {
				bottom = this.bottom;
			} else if (bottom < pr.Dimensions.pageTop + this.height) {
				bottom = pr.Dimensions.pageTop + this.height;
			} else if (bottom > pr.Dimensions.pageBottom) {
				bottom = pr.Dimensions.pageBottom;
				this.setTop(bottom - this.height);
			}
			this.bottom = bottom;
			if (updateTop === true) {
				this.setTop(bottom - this.height, false);
			}
			this.toolbar.setBottom(bottom);
			this.guides.setSizes();
		},
		setGapLeft(mouseX, onlyIfNull) {
			if (onlyIfNull !== true || this.gapLeft === null && onlyIfNull === true) {
				this.gapLeft = mouseX - this.left;
			}
		},
		setGapTop(mouseY, onlyIfNull) {
			if (onlyIfNull !== true || this.gapTop === null && onlyIfNull === true) {
				this.gapTop = mouseY - this.top;
			}
		},
		moveLeft(e) {
			if (this.movingLeft) {
				let mouseX = pr.Mouse.getX(e);
				this.setGapLeft(mouseX, true);
				if (mouseX - this.gapLeft < pr.Dimensions.pageLeft) {
					mouseX = pr.Dimensions.pageLeft + this.gapLeft;
				} else if (mouseX - this.gapLeft + this.width > pr.Dimensions.pageRight) {
					mouseX = pr.Dimensions.pageRight - this.width + this.gapLeft;
				}
				this.setLeft(mouseX - this.gapLeft, true);
			}
		},
		moveTop(e) {
			if (this.movingTop) {
				let mouseY = pr.Mouse.getY(e);
				this.setGapTop(mouseY, true);
				if (mouseY - this.gapTop < pr.Dimensions.pageTop) {
					mouseY = pr.Dimensions.pageTop + this.gapTop;
				} else if (mouseY - this.gapTop + this.height > pr.Dimensions.pageBottom) {
					mouseY = pr.Dimensions.pageBottom - this.height + this.gapTop;
				}
				this.setTop(mouseY - this.gapTop, true);
			}
		},
		move(e) {
			this.moveLeft(e);
			this.moveTop(e);
		},
		resizeLeft(e) {
			if (this.resizingLeft) {
				let mouseX = pr.Mouse.getX(e);
				if (mouseX <= this.right) {
					if (mouseX < pr.Dimensions.pageLeft) {
						mouseX = pr.Dimensions.pageLeft;
					}
					mouseX -= this.resizingOffsetLeft;
					this.setLeft(mouseX);
					this.setWidth(this.right - mouseX);
				} else {
					this.resizingLeft = false;
					this.resizingRight = true;
					this.setLeft(this.right);
				}
			}
		},
		resizeRight(e) {
			if (this.resizingRight) {
				let mouseX = pr.Mouse.getX(e);
				if (mouseX >= this.left) {
					if (mouseX > pr.Dimensions.pageRight) {
						mouseX = pr.Dimensions.pageRight;
					}
					mouseX += this.resizingOffsetRight;
					this.setRight(mouseX);
					this.setWidth(mouseX - this.left);
				} else {
					this.resizingLeft = true;
					this.resizingRight = false;
					this.setRight(this.left);
				}
			}
		},
		resizeTop(e) {
			if (this.resizingTop) {
				let mouseY = pr.Mouse.getY(e);
				if (mouseY <= this.bottom) {
					if (mouseY < pr.Dimensions.pageTop) {
						mouseY = pr.Dimensions.pageTop;
					}
					mouseY -= this.resizingOffsetTop;
					this.setTop(mouseY);
					this.setHeight(this.bottom - mouseY);
				} else {
					this.resizingTop = false;
					this.resizingBottom = true;
					this.setTop(this.bottom);
				}
			}
		},
		resizeBottom(e) {
			if (this.resizingBottom) {
				let mouseY = pr.Mouse.getY(e);
				if (mouseY >= this.top) {
					if (mouseY > pr.Dimensions.pageBottom) {
						mouseY = pr.Dimensions.pageBottom;
					}
					mouseY += this.resizingOffsetBottom;
					this.setBottom(mouseY);
					this.setHeight(mouseY - this.top);
				} else {
					this.resizingTop = true;
					this.resizingBottom = false;
					this.setBottom(this.top);
				}
			}
		},
		resize(e) {
			this.resizeLeft(e);
			this.resizeRight(e);
			this.resizeTop(e);
			this.resizeBottom(e);
		},
		setWidth(width) {
			width = parseInt(width, 10);
			if (Number.isNaN(width)) {
				width = this.width;
			} else if (width < 0) {
				width = 0;
			} else if (width + this.left > pr.Dimensions.pageRight) {
				width = pr.Dimensions.pageRight - this.left;
			}
			this.width = width;
			this.ruler.style.setProperty("width", pr.Util.px(width), "");
			this.setRight(this.left + width);
			this.toolbar.setWidth(width);
			this.guides.setSizes();
		},
		setHeight(height) {
			height = parseInt(height, 10);
			if (Number.isNaN(height)) {
				height = this.height;
			} else if (height < 0) {
				height = 0;
			} else if (height + this.top > pr.Dimensions.pageBottom) {
				height = pr.Dimensions.pageBottom - this.top;
			}
			this.height = height;
			this.ruler.style.setProperty("height", pr.Util.px(height), "");
			this.setBottom(this.top + height);
			this.toolbar.setHeight(height);
			this.guides.setSizes();
		},
		setBorderSearchVisibility(visible, save) {
			this.setElementVisibility(this.borderSearchElements.udLeftTop, visible);
			this.setElementVisibility(this.borderSearchElements.udRightTop, visible);
			this.setElementVisibility(this.borderSearchElements.lrLeftTop, visible);
			this.setElementVisibility(this.borderSearchElements.lrRightTop, visible);
			this.setElementVisibility(this.borderSearchElements.lrLeftBottom, visible);
			this.setElementVisibility(this.borderSearchElements.lrRightBottom, visible);
			this.setElementVisibility(this.borderSearchElements.udLeftBottom, visible);
			this.setElementVisibility(this.borderSearchElements.udRightBottom, visible);
			if (save) {
				chrome.runtime.sendMessage({
					action: "setBorderSearch",
					visible
				});
			}
		},
		setElementVisibility(element, visible) {
			if (visible) {
				element.dom.style.removeProperty("display");
			} else {
				element.dom.style.setProperty("display", "none", "important");
			}
		}
	});
})(__PageRuler);

(function(pr) {
	pr.el.Toolbar = pr.cls(function() {
		const _this = this;
		this.dom = pr.El.createEl("div", {
			id: "toolbar",
			cls: this.position
		}, {
			click(e) {
				e.stopPropagation();
			},
			mousedown(e) {
				e.stopPropagation();
			}
		});
		const container = pr.El.createEl("div", {
			id: "toolbar-container",
			class: "toolbar-container"
		});
		const closeContainer = this.generateCloseContainer();
		const dockContainer = this.generateDockContainer();
		const helpContainer = this.generateHelpContainer();
		const elementModeContainer = this.generateElementModeToggleContainer();
		const dimensionsContainer = this.generateDimensionsContainer();
		const positionContainer = this.generatePositionContainer();
		const colorContainer = this.generateColorContainer();
		const guidesContainer = this.generateGuidesContainer();
		const borderSearchContainer = this.generateBorderSearchContainer();
		pr.El.appendEl(container, [closeContainer, dockContainer, helpContainer, elementModeContainer, dimensionsContainer, positionContainer, colorContainer, guidesContainer, borderSearchContainer]);
		this.elementToolbar = new pr.el.ElementToolbar(this);
		pr.El.appendEl(this.dom, [container, this.elementToolbar.dom]);
		pr.El.appendEl(document.documentElement, this.dom);
		chrome.runtime.sendMessage({
			action: "getDockPosition"
		}, position => {
			_this.setDockPosition(position);
		});
		chrome.runtime.sendMessage({
			action: "getGuides"
		}, visible => {
			pr.elements.guides.setVisible(visible, false);
			pr.elements.guides.hide();
			if (!visible) {
				_this.els.guides.checked = false;
			}
		});
		chrome.runtime.sendMessage({
			action: "getBorderSearch"
		}, visible => {
			pr.elements.ruler.setBorderSearchVisibility(visible, false);
			if (!visible) {
				_this.els.borderSearch.checked = false;
			}
		});
	}, {
		position: "top",
		height: 30,
		ruler: null,
		dom: null,
		els: {},
		elementMode: false,
		elementToolbar: null,
		generatePixelInput(id, labelText, changeListener) {
			const container = pr.El.createEl("div", {
				id: `toolbar-${id}-container`,
				cls: "px-container"
			});
			const label = pr.El.createEl("label", {
				id: `toolbar-${id}-label`,
				for: `toolbar-${id}`
			}, {}, `${labelText}:`);
			this.els[id] = pr.El.createEl("input", {
				id: `toolbar-${id}`,
				type: "number",
				min: 0,
				value: 0,
				title: labelText.toLocaleLowerCase()
			});
			pr.El.registerListener(this.els[id], "change", changeListener);
			pr.El.registerListener(this.els[id], "keydown", function(e) {
				if (e.shiftKey && (e.keyCode === 38 || e.keyCode === 40)) {
					e.preventDefault();
					if (e.keyCode === 38) {
						this.value = parseInt(this.value, 10) + 10;
					} else if (e.keyCode === 40) {
						this.value = parseInt(this.value, 10) - 10;
					}
					changeListener.call(this, e);
				}
				if (e.keyCode === 13) {
					changeListener.call(this, e);
				}
			});
			pr.El.registerListener(this.els[id], "focus", () => {
				pr.elements.ruler.keyMoving = false;
			});
			pr.El.registerListener(this.els[id], "blur", () => {
				pr.elements.ruler.keyMoving = true;
			});
			pr.El.appendEl(container, [label, this.els[id]]);
			return container;
		},
		shiftPage(height) {
			this.unshiftPage();
			height = height || this.height + (this.elementMode ? this.elementToolbar.height : 0);
			if (this.position === "top") {
				const cssTransform = "transform" in document.body.style ? "transform" : "-webkit-transform";
				document.body.style.setProperty(cssTransform, `translateY(${pr.Util.px(height)})`, "important");
			} else {
				document.body.style.setProperty("margin-bottom", pr.Util.px(height), "important");
			}
		},
		unshiftPage() {
			const cssTransform = "transform" in document.body.style ? "transform" : "-webkit-transform";
			document.body.style.removeProperty(cssTransform);
			document.body.style.removeProperty("margin-bottom");
		},
		generateElementModeToggleContainer() {
			const _this = this;
			const label = pr.El.createEl("span", {
				id: "toolbar-element-toggle-label",
				style: "display:none !important;"
			}, {}, pr.Util.locale("toolbarEnableElementMode"));
			const img = pr.El.createEl("img", {
				id: "toolbar-element-toggle-img",
				src: chrome.extension.getURL("images/element-mode-toggle.png")
			});
			const container = pr.El.createEl("div", {
				id: "toolbar-element-toggle",
				cls: ["container", "element-toggle-container"]
			}, {
				mouseover() {
					label.style.removeProperty("display");
				},
				mouseout() {
					if (_this.elementMode === false) {
						label.style.setProperty("display", "none", "important");
					}
				},
				click(e) {
					e.preventDefault();
					e.stopPropagation();
					if (_this.elementMode === false) {
						_this.showElementToolbar();
					} else {
						_this.hideElementToolbar();
					}
				}
			});
			pr.El.appendEl(container, [label, img]);
			return container;
		},
		generateDimensionsContainer() {
			const _this = this;
			const container = pr.El.createEl("div", {
				id: "toolbar-dimensions",
				cls: "container"
			});
			const width = this.generatePixelInput("width", pr.Util.locale("toolbarWidth"), function(e) {
				_this.ruler.setWidth(this.value);
			});
			const height = this.generatePixelInput("height", pr.Util.locale("toolbarHeight"), function(e) {
				_this.ruler.setHeight(this.value);
			});
			pr.El.appendEl(container, [width, height]);
			return container;
		},
		generatePositionContainer() {
			const _this = this;
			const container = pr.El.createEl("div", {
				id: "toolbar-positions",
				cls: "container"
			});
			const left = this.generatePixelInput("left", pr.Util.locale("toolbarLeft"), function(e) {
				_this.ruler.setLeft(this.value, true);
			});
			const top = this.generatePixelInput("top", pr.Util.locale("toolbarTop"), function(e) {
				_this.ruler.setTop(this.value, true);
			});
			const right = this.generatePixelInput("right", pr.Util.locale("toolbarRight"), function(e) {
				_this.ruler.setRight(this.value, true);
			});
			const bottom = this.generatePixelInput("bottom", pr.Util.locale("toolbarBottom"), function(e) {
				_this.ruler.setBottom(this.value, true);
			});
			pr.El.appendEl(container, [left, top, right, bottom]);
			return container;
		},
		generateColorContainer() {
			const _this = this;
			const container = pr.El.createEl("div", {
				id: "toolbar-color-container",
				class: "container"
			});
			const label = pr.El.createEl("label", {
				id: "toolbar-color-label",
				for: "toolbar-color"
			}, {}, `${pr.Util.locale("toolbarColor")}:`);
			this.els.color = pr.El.createEl("input", {
				id: "toolbar-color",
				type: "color"
			});
			pr.El.registerListener(this.els.color, "change", e => {
				_this.ruler.setColor(e.target.value, true);
			});
			pr.El.appendEl(container, [label, this.els.color]);
			return container;
		},
		generateGuidesContainer() {
			const guidesContainer = pr.El.createEl("div", {
				id: "toolbar-guides-container",
				cls: "container"
			});
			const label = pr.El.createEl("label", {
				id: "toolbar-guides-label",
				for: "toolbar-guides-input"
			}, {}, `${pr.Util.locale("toolbarGuides")}:`);
			let lang = (navigator.language || "").split("-")[0];
			if (lang) {
				lang = `lang_${lang}`;
			}
			const toggle = pr.El.createEl("div", {
				id: "toolbar-guides-toggle",
				cls: `checkbox-toggle ${lang}`
			});
			const input = pr.El.createEl("input", {
				id: "toolbar-guides-input",
				type: "checkbox",
				checked: true
			}, {
				change(e) {
					pr.elements.guides.setVisible(this.checked, true);
				}
			});
			this.els.guides = input;
			const toggleLabel = pr.El.createEl("label", {
				id: "toolbar-guides-toggle-label",
				for: "toolbar-guides-input"
			});
			const labelInner = pr.El.createEl("div", {
				id: "toolbar-guides-label-inner",
				class: "inner"
			});
			const labelSwitch = pr.El.createEl("div", {
				id: "toolbar-guides-label-switch",
				class: `switch ${lang}`
			});
			pr.El.appendEl(toggleLabel, [labelInner, labelSwitch]);
			pr.El.appendEl(toggle, [input, toggleLabel]);
			pr.El.appendEl(guidesContainer, [label, toggle]);
			return guidesContainer;
		},
		generateBorderSearchContainer() {
			const borderSearchContainer = pr.El.createEl("div", {
				id: "toolbar-borderSearch-container",
				cls: "container"
			});
			const label = pr.El.createEl("label", {
				id: "toolbar-borderSearch-label",
				for: "toolbar-borderSearch-input"
			}, {}, `${pr.Util.locale("toolbarBorderSearch")}:`);
			let lang = (navigator.language || "").split("-")[0];
			if (lang) {
				lang = `lang_${lang}`;
			}
			const toggle = pr.El.createEl("div", {
				id: "toolbar-borderSearch-toggle",
				cls: `checkbox-toggle ${lang}`
			});
			const input = pr.El.createEl("input", {
				id: "toolbar-borderSearch-input",
				type: "checkbox",
				checked: true
			}, {
				change(e) {
					console.log("saving setBorderSearchVisibility");
					pr.elements.ruler.setBorderSearchVisibility(this.checked, true);
				}
			});
			this.els.borderSearch = input;
			const toggleLabel = pr.El.createEl("label", {
				id: "toolbar-borderSearch-toggle-label",
				for: "toolbar-borderSearch-input"
			});
			const labelInner = pr.El.createEl("div", {
				id: "toolbar-borderSearch-label-inner",
				class: "inner"
			});
			const labelSwitch = pr.El.createEl("div", {
				id: "toolbar-borderSearch-label-switch",
				class: `switch ${lang}`
			});
			pr.El.appendEl(toggleLabel, [labelInner, labelSwitch]);
			pr.El.appendEl(toggle, [input, toggleLabel]);
			pr.El.appendEl(borderSearchContainer, [label, toggle]);
			return borderSearchContainer;
		},
		generateCloseContainer() {
			const _this = this;
			const container = pr.El.createEl("div", {
				id: "toolbar-close-container",
				class: ["container", "close-container"]
			});
			const img = pr.El.createEl("img", {
				id: "toolbar-close",
				src: chrome.extension.getURL("images/close.png"),
				title: pr.Util.locale("toolbarClose", "lowercase")
			}, {
				click(e) {
					chrome.runtime.sendMessage({
						action: "disable"
					});
				}
			});
			pr.El.appendEl(container, [img]);
			return container;
		},
		generateHelpContainer() {
			const container = pr.El.createEl("div", {
				id: "toolbar-help-container",
				class: ["container", "help-container"]
			});
			this.els.help = pr.El.createEl("img", {
				id: "toolbar-help",
				src: chrome.extension.getURL("images/help-white.png"),
				title: pr.Util.locale("toolbarHelp", "lowercase")
			}, {
				click(e) {
					chrome.runtime.sendMessage({
						action: "openHelp"
					});
				}
			});
			pr.El.appendEl(container, [this.els.help]);
			return container;
		},
		generateDockContainer() {
			const _this = this;
			const container = pr.El.createEl("div", {
				id: "toolbar-dock-container",
				class: ["container", "dock-container"]
			});
			this.els.dock = pr.El.createEl("img", {
				id: "toolbar-dock",
				src: chrome.extension.getURL("images/dock-bottom.png"),
				title: pr.Util.locale("toolbarDockBottom", "lowercase")
			}, {
				click(e) {
					_this.setDockPosition(_this.position === "top" ? "bottom" : "top", true);
				}
			});
			pr.El.appendEl(container, [this.els.dock]);
			return container;
		},
		setDockPosition(position, save) {
			if (position !== "top" && position !== "bottom") {
				return;
			}
			const oldPosition = position === "top" ? "bottom" : "top";
			pr.El.removeClass(this.dom, `page-ruler-${oldPosition}`);
			this.position = position;
			pr.El.addClass(this.dom, `page-ruler-${position}`);
			this.els.dock.setAttribute("src", chrome.extension.getURL(`images/dock-${oldPosition}.png`));
			this.els.dock.setAttribute("title", pr.Util.locale(`toolbarDock${oldPosition === "top" ? "Top" : "Bottom"}`, "lowercase"));
			this.shiftPage();
			if (save) {
				chrome.runtime.sendMessage({
					action: "setDockPosition",
					position
				});
			}
		},
		setColor(color) {
			this.els.color.value = color;
		},
		setWidth(width) {
			this.els.width.value = parseInt(width, 10);
		},
		setHeight(height) {
			this.els.height.value = parseInt(height, 10);
		},
		setTop(top) {
			this.els.top.value = parseInt(top, 10);
		},
		setBottom(bottom) {
			this.els.bottom.value = parseInt(bottom, 10);
		},
		setLeft(left) {
			this.els.left.value = parseInt(left, 10);
		},
		setRight(right) {
			this.els.right.value = parseInt(right, 10);
		},
		showElementToolbar() {
			this.elementMode = true;
			this.elementToolbar.show();
			document.getElementById("page-ruler-toolbar-element-toggle-label").innerText = pr.Util.locale("toolbarDisableElementMode");
		},
		hideElementToolbar() {
			this.elementMode = false;
			this.elementToolbar.hide();
			document.getElementById("page-ruler-toolbar-element-toggle-label").innerText = pr.Util.locale("toolbarEnableElementMode");
		}
	});
})(__PageRuler);
