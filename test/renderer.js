var view = require("../../netron/source/view.js");

// Loads window.__host__ and window.__view__
require("../../netron/source/index.js");

class HTMLDocument {

    constructor() {
        this._elements = {};
        this.documentElement = new HTMLHtmlElement();
        this.body = new HTMLBodyElement();
    }

    createElement(/* name */) {
        return new HTMLElement();
    }

    createElementNS(/* namespace, name */) {
        return new HTMLElement();
    }

    createTextNode(/* text */) {
        return new HTMLElement();
    }

    getElementById(id) {
        let element = this._elements[id];
        if (!element) {
            element = new HTMLElement();
            this._elements[id] = element;
        }
        return element;
    }

    addEventListener(/* event, callback */) {
    }

    removeEventListener(/* event, callback */) {
    }
}

class HTMLElement {

    constructor() {
        this._childNodes = [];
        this._attributes = new Map();
        this._style = new CSSStyleDeclaration();
    }

    get style() {
        return this._style;

    }

    appendChild(node) {
        this._childNodes.push(node);
    }

    setAttribute(name, value) {
        this._attributes.set(name, value);
    }

    hasAttribute(name) {
        return this._attributes.has(name);
    }

    getAttribute(name) {
        return this._attributes.get(name);
    }

    getElementsByClassName(name) {
        const elements = [];
        for (const node of this._childNodes) {
            if (node instanceof HTMLElement) {
                elements.push(...node.getElementsByClassName(name));
                if (node.hasAttribute('class') &&
                    node.getAttribute('class').split(' ').find((text) => text === name)) {
                    elements.push(node);
                }
            }
        }
        return elements;
    }

    addEventListener(/* event, callback */) {
    }

    removeEventListener(/* event, callback */) {
    }

    get classList() {
        return new DOMTokenList(this);
    }

    getBBox() {
        return { x: 0, y: 0, width: 10, height: 10 };
    }

    getBoundingClientRect() {
        return { left: 0, top: 0, wigth: 0, height: 0 };
    }

    scrollTo() {
    }

    focus() {
    }
}

class HTMLHtmlElement extends HTMLElement {
}

class HTMLBodyElement extends HTMLElement{
}

class CSSStyleDeclaration {

    constructor() {
        this._properties = new Map();
    }

    setProperty(name, value) {
        this._properties.set(name, value);
    }
}

class DOMTokenList {

    add(/* token */) {
    }
}

class TestHost {

    constructor() {
        this._document = new HTMLDocument();
    }

    get document() {
        return this._document;
    }

    initialize(/* view */) {
        return Promise.resolve();
    }

    start() {
    }

    environment(name) {
        if (name == 'zoom') {
            return 'none';
        }
        return null;
    }

    screen(/* name */) {
    }

    require(id) {
        // return Promise.resolve();
        try {
            // const file = path.join(path.join(__dirname, '../source'), id + '.js');
            const onnx = require("../../netron/source/onnx.js");
            return Promise.resolve(onnx);
        }
        catch (error) {
            return Promise.reject(error);
        }
    }

    request(file, encoding, base) {
        const pathname = path.join(base || path.join(__dirname, '../source'), file);
        if (!fs.existsSync(pathname)) {
            return Promise.reject(new Error("The file '" + file + "' does not exist."));
        }
        if (encoding) {
            const content = fs.readFileSync(pathname, encoding);
            return Promise.resolve(content);
        }
        const buffer = fs.readFileSync(pathname, null);
        const stream = new TestBinaryStream(buffer);
        return Promise.resolve(stream);
    }

    event(/* category, action, label, value */) {
    }

    exception(err /*, fatal */) {
        this._raise('exception', { exception: err });
    }

    on(event, callback) {
        this._events = this._events || {};
        this._events[event] = this._events[event] || [];
        this._events[event].push(callback);
    }

    _raise(event, data) {
        if (this._events && this._events[event]) {
            for (const callback of this._events[event]) {
                callback(this, data);
            }
        }
    }
}

var renderer = (function () {
    "use strict";

    var d = document;

    function render_model(files, rawPayload, target) {
        // wipe all inner elements of our target
        while (target.firstChild) {
            target.removeChild(target.firstChild);
        }

        var t = d.createElement('div');
        t.innerText = rawPayload.length;
        t.setAttribute('id', 'model-container');
        target.appendChild(t);

        // We probably want to replace TestHost with window.__host__
        // but window.__host__ has a constructor containing a then()
        // which means the modelFactoryService isn't loaded in time.
        var testHost = new TestHost();

        window.__view__ = new view.View(testHost, "onnx");

        console.log(window.__view__);
        console.log(window.__host__);

        window.__host__._openPayload(files, window.__view__, rawPayload);
    }

    return {
        render: render_model,
    };

})();

module.exports = renderer;