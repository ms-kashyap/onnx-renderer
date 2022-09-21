var rm = require('../scripts/renderer.js');

window.onload = function () {
    console.log("Page loaded");

    document.getElementById("file-selector").addEventListener("change", function () {
        var fr = new FileReader();
        fr.onload = function () {
            var renderUX = document.getElementById("model-display");
            rm.render(fr.result, renderUX);
        }

        fr.readAsText(this.files[0]);
    });
}
