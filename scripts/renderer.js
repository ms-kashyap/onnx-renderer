var renderer = (function() {
    "use strict";

    var d = document;

    function render_model(rawPayload, target) {
        // wipe all inner elements of our target
        while (target.firstChild) {
            target.removeChild(target.firstChild);
        }

        var t = d.createElement('div');
        t.setAttribute('id', 'model-container');
        target.appendChild(t);

        // TODO: Code to render model from raw payload
    }

    return {
        render: render_model,
    };

})();
