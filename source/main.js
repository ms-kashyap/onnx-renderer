function str2arrayBuffer(str) {
    var buf = new ArrayBuffer(str.length);
    var bufView = new Uint8Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

var onnxRenderer = (function () {
    "use strict";
    return {
        renderContent: function(rawContent, options) {

            console.log("rawContent", rawContent);
            console.log("options", options);

            // VSS.__host__ = new host.BrowserHost();
            // VSS.__view__ = new view.View(VSS.__host__);

            // var arrayBuffer = str2arrayBuffer(rawContent);
            // const stream = new host.BrowserHost.BinaryStream(new Uint8Array(arrayBuffer));

            const encoder = new TextEncoder();
            const buffer = encoder.encode(rawContent);
            const stream = new host.BrowserHost.BinaryStream(buffer);

            console.log("stream", stream);
            console.log("full stream", stream._buffer);
            
            console.log(
                "last 3",
                stream._buffer[stream._length - 3],
                stream._buffer[stream._length - 2],
                stream._buffer[stream._length - 1]
            );

            // console.log("VSS host", VSS.__host__);
            // VSS.__host__._openStream(stream);

            console.log("window host", window.__host__);
            window.__host__._openStream(stream);
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
