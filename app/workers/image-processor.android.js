// required manually to setup modules
var globals = require("globals");
var grayscaler = require("../helpers/grayscaler");
var fs = require("file-system");

onmessage = (msg) => {
    console.log("In img-processor");
    var data = msg.data;
    var bitmapSrc = data.src;
    var fileName = data.fileName;
    var appDir = data.appDir;

    var res = grayscaler.process(bitmapSrc, fileName, appDir, progressCallback);
    var jsStr = "" + res;
    postMessage({ res: res ? "success" : "fail", src: jsStr });
}

onerror = function (e) {
    console.log("An error occurred in worker. Main will handle this. Err: " + e);

    // return true to not propagate to main
}

function progressCallback(value) {
    postMessage({ res: "progress", value: value });
}