/**
 * Created by icaspi on 1/24/2017.
 */


function download_as_file(filename, data, type) {
    // Download the text as a file to the user's machine
    if (filename == "") {
        filename = "neuralizer_topology";
        $("filename").val(filename);
    }
    var link = document.createElement("a");
    link.setAttribute("target","_blank");
    if (type == "text") {
        if(Blob !== undefined) {
            var blob = new Blob([data], {type: "text/plain"});
            link.setAttribute("href", URL.createObjectURL(blob));
        } else {
            link.setAttribute("href","data:text/plain," + encodeURIComponent(data));
        }
        link.setAttribute("download", filename + ".txt");
    } else if (type == "image") {
        link.setAttribute("href", data);
        link.setAttribute("download", filename + ".png");
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function save_current_state_as_image(filename) {
    // download the current state to the user's machine as an image
    canvas_manager.show_message("Downloading topology image", true);

    // get relevant area
    var bb = canvas_manager.get_bounding_box_over_all_shapes();
    var margin = 20;
    var width = bb.max_x - bb.min_x + margin*2;
    var height = bb.max_y - bb.min_y + margin*2;
    var x = bb.min_x-margin;
    var y = bb.min_y-margin;

    canvas_manager.select_all_shapes();
    canvas_manager.draw_curr_state_if_necessary();

    // crop image to relevant area
    var canvas = canvas_manager.canvas;
    var tempCanvas = document.createElement("canvas"),
        tCtx = tempCanvas.getContext("2d");
    tempCanvas.width = width;
    tempCanvas.height = height;
    tCtx.drawImage(canvas_manager.canvas,-x,-y);

    var image = tempCanvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    download_as_file($("#filename").val(), image, "image");
}

function save_current_state_to_file(framework) {
    // download the current state to the user's machine
    canvas_manager.show_message("Downloading topology", true);
    if (framework == "Neuralizer") {
        var text = JSON.stringify(canvas_manager.stored_states[canvas_manager.current_timestep]);
        download_as_file($("#filename").val(), text, "text");
    } else {
        canvas_manager.show_message("Downloading topology", true);
        var text = JSON.stringify(canvas_manager.to_graph(), null, "\t");
        download_as_file($("#filename").val(), text, "text");
    }
}

function load_state_from_file() {
    // load a file as the current state
    var fileInput = document.getElementById('fileInput');

    var file = fileInput.files[0];
    var name = fileInput.value.split(/(\\|\/)/g).pop().replace(/\.[^/.]+$/, "");
    var textType = /text.*/;

    if (file.type.match(textType)) {
        canvas_manager.show_message("Loading topology", true);
        var reader = new FileReader();

        reader.onload = function(e) {
            var state = JSON.parse(reader.result);
            canvas_manager.load_state(state);
            sidebar_manager.switch_sidebar_mode('designer');
            $("#filename").val(name);
        };
        reader.readAsText(file);

    } else {
        canvas_manager.show_message("File not supported!");
    }
}
//
// function export_current_state_to_framework_file() {
//     canvas_manager.show_message("Downloading topology", true);
//     var text = JSON.stringify(canvas_manager.to_graph(), null, "\t");
//     download_as_file($("#filename").val(), text, "text");
// }