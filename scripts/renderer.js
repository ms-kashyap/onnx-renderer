// require('@paddlejs/netron');

require('@paddlejs/netron/lib/index.js');
var mf = require('@paddlejs/netron/lib/modelFactory.js');

var renderer = (function () {
    "use strict";

    var d = document;

    function render_model(rawPayload, target) {
        // wipe all inner elements of our target
        while (target.firstChild) {
            target.removeChild(target.firstChild);
        }

        var t = d.createElement('div');
        t.innerText = rawPayload.length;
        t.setAttribute('id', 'model-container');
        target.appendChild(t);

        console.log(mf.modelFactory);


        // TODO: Code to render model from raw payload
    }

    return {
        render: render_model,
    };

})();

module.exports = renderer;