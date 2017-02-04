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
    // canvas_manager.select_all_shapes();
    // canvas_manager.draw_curr_state_if_necessary();
    var image = canvas_manager.canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
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
    var textType = /text.*/;

    if (file.type.match(textType)) {
        canvas_manager.show_message("Loading topology", true);
        var reader = new FileReader();

        reader.onload = function(e) {
            var state = JSON.parse(reader.result);
            canvas_manager.load_state(state);
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