window.onload = function() {
    console.log("Page loaded");

    // When the model is uploaded, update the rawContentLength
    document.getElementById("file-selector").addEventListener("change", function() {
        var fr = new FileReader();
        fr.onload = function() {
            document.getElementById("rawContentLength").textContent = fr.result.length;
        }

        fr.readAsText(this.files[0]);
    });

    // Visualize the uploaded model
}
