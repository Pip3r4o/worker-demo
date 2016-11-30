var Observable = require("data/observable").Observable;
var fpsMeter = require("fps-meter");
var fs = require("file-system");

var page;
var originalImageSources = {};
var isProcessing = false;
var appDir = fs.knownFolders.currentApp().path;
var imagesDir = fs.path.join(appDir, "images");    
    var imagePaths = [fs.path.join(imagesDir, "beach-min.jpg"),
                    fs.path.join(imagesDir, "cave-min.jpg"),
                    fs.path.join(imagesDir, "flood-min.jpg")];
    var IMAGE_COUNT = imagePaths.length;
    var processed_count = 0;

function createViewModel(page) {
    page = page;

    var viewModel = new Observable();

    viewModel.fps = 0;
    viewModel.img1 = imagePaths[0];
    viewModel.img2 = imagePaths[1];
    viewModel.img3 = imagePaths[2];
    viewModel.img1Proc = 0;
    viewModel.img2Proc = 0;
    viewModel.img3Proc = 0;

    fpsMeter.addCallback((fps, minFps) => {
        viewModel.set("fps", Math.trunc(fps));
    });

    fpsMeter.start();

    var imageGrid = page.getViewById("images-grid");
    
    // non-functional atm
    viewModel.reset = () => {
        return;

    }

    // will process the first image on the main thread
    viewModel.processOnMain = () => {
        if (isProcessing) return;

        isProcessing = true;

        // Get the grayscale algorithm 
        var grayscaler = require("./helpers/grayscaler.js");

        var id = "2";

        // Get the image view's `src` property to operate on the image
        var res = grayscaler.process(viewModel["img" + id], 1 + "-bw.jpg", appDir, progressCallback(id, viewModel));

        // if processing was successful -> change image view's image to updated one
        if (res) {
            viewModel.set("img" + id, res);
        } 

        isProcessing = false; 
    }

    // Unfinished
    viewModel.processOneWorker = () => {
        if (isProcessing) return;

        isProcessing = true;

        // var imageProcessingWorker = new Worker("./workers/image-processor");

        isProcessing = false;
    }

    // Starts a worker for every image view in the Grid
    viewModel.processMultiWorker = () => {
        if (isProcessing) return;

        isProcessing = true;

        var workers = [];
        
        // iterate through all image bindings
        // start a worker for each image and process
        for(var i = 0; i < IMAGE_COUNT; i++) {
            var id = i+1;
            var worker = new Worker("./workers/image-processor");
            worker.onmessage = onmessageCallback(i, worker, viewModel);
            worker.postMessage({ src: viewModel["img" + id], fileName: id + "-bw.jpg", appDir: appDir});
        }
    }

    return viewModel;
}

function progressCallback(id, viewModel) {
    return function(progress) {
        viewModel.set("img" + id + "Proc", progress);
    }
}

function onmessageCallback(id, worker, viewModel) {
    return function(msg) {
        if (msg.data.res === "progress") {
            viewModel.set("img" + id + "Proc", msg.data.value); 
        } else if (msg.data.res === "success") {
            viewModel.set("img" + id, msg.data.src);

            isProcessing = false;
            // if worker is done, terminate
            worker.terminate();
            processed_count += 1;

            if (processed_count === IMAGE_COUNT) {
                isProcessing = false;
            }
        } else if (msg.data.res === "fail") {
            console.log("processing failed"); 
        }
    }
}

exports.createViewModel = createViewModel;