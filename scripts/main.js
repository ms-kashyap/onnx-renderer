var onnxRenderer = (function () {
    "use strict";
    return {
        renderContent: function(rawContent, options) {

            console.log("rawContent", rawContent);
            console.log("options", options);

            document.getElementById("rawContentLength").innerText = rawContent.length;

            var renderUX = document.getElementById("model-display");
            renderer.render(rawPayload, renderUX);
        }
    };
}());

VSS.init({
    usePlatformScripts: true, 
    usePlatformStyles: true, 
    explicitNotifyLoaded: true 
});

VSS.ready(function () {
    VSS.register("onnx_renderer", function (context) {
        console.log("context", context);

        return onnxRenderer;
    });

	VSS.notifyLoadSucceeded();
});
