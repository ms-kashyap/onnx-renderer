var rm = require('./renderer.js');

window.onload = function () {
    console.log("Page loaded");

    document.getElementById("file-selector").addEventListener("change", function (e1) {
        var fr = new FileReader();
        fr.onload = function (e2) {
            var renderUX = document.getElementById("model-display");

            const files = Array.from(e1.target.files);

            rm.render(files, e2.target.result, renderUX);
        }

        fr.readAsArrayBuffer(this.files[0]);
    });
}
