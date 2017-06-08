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

function get_current_state_image() {

    // get relevant area
    var bb = canvas_manager.get_bounding_box_over_all_shapes();
    var margin = 20;
    var width = bb.max_x - bb.min_x + margin*2;
    var height = bb.max_y - bb.min_y + margin*2;
    var x = bb.min_x-margin;
    var y = bb.min_y-margin;

    // deal with zoom and translation of the canvas
    x *= canvas_manager.zoom;
    y *= canvas_manager.zoom;
    x -= canvas_manager.offset_x*canvas_manager.zoom;
    y -= canvas_manager.offset_y*canvas_manager.zoom;

    canvas_manager.select_all_shapes();
    canvas_manager.remove_all_arrows_separating_border();
    canvas_manager.draw_curr_state_if_necessary();

    // crop image to relevant area
    var canvas = canvas_manager.canvas;
    var tempCanvas = document.createElement("canvas"),
        tCtx = tempCanvas.getContext("2d");
    tempCanvas.width = width*canvas_manager.zoom;
    tempCanvas.height = height*canvas_manager.zoom;
    tCtx.drawImage(canvas_manager.canvas,-x,-y);

    var image = tempCanvas.toDataURL("image/png");
    canvas_manager.add_all_arrows_separating_border();

    return image;
}

function save_current_state_as_image(filename) {
    // download the current state to the user's machine as an image
    canvas_manager.show_message("Downloading topology image", true);
    var image = get_current_state_image().replace("image/png", "image/octet-stream");
    download_as_file($("#filename").val(), image, "image");
}

//////////////////////////////////////
// Model Code

var CodeGenerator = function(language) {
    this.indentation = 0;
    this.text = "";
    this.language = language;
    this.dependencies = {}; // from key import list of values
};

CodeGenerator.prototype.indent = function() {
    this.indentation += 1;
};

CodeGenerator.prototype.unindent = function() {
    if (this.indentation > 0) {
        this.indentation -= 1;
    }
};

CodeGenerator.prototype.add_line = function(line, prepend) {
    if (line == undefined) line = "";
    for (var i = 0; i < this.indentation; i++) {
        line = "\t" + line;
    }
    line += "\n";
    if (prepend) {
        this.text = line + this.text;
    } else {
        this.text += line;
    }
};

CodeGenerator.prototype.add_lines = function(lines, prepend) {
    for (var line_idx = 0; line_idx < lines.length; line_idx++) {
        this.add_line(lines[line_idx], prepend);
    }
};

CodeGenerator.prototype.add_dependency = function(library, classes) {
    // if the dependencies were not already requested, add them to the dictionary
    if (!this.dependencies[library]) {
        this.dependencies[library] = classes;
    } else {
        for (var i = 0; i < classes.length; i++) {
            if (this.dependencies[library].indexOf(classes[i]) == -1) {
                this.dependencies[library].push(classes[i]);
            }
        }
    }
};

CodeGenerator.prototype.get_code = function() {
    if (this.language == "python") {
        // generate all the dependencies
        for (var library in this.dependencies) {
            this.add_line("from " + library + " import " + this.dependencies[library].toString(), true);
        }
        this.add_line();
    }
    return this.text;
};

CodeGenerator.prototype.open_function = function(function_name) {
    if (this.language == "python") {
        this.add_line("def " + function_name + "():");
        this.indent();
    }
};

CodeGenerator.prototype.close_function = function() {
    if (this.language == "python") {
        this.unindent();
        this.add_line();
        this.add_line();
    }
};

////////////////////////////////////////////
// Graph algorithms

function get_complementary_nodes(graph, nodes) {
    var complementary_nodes = [];
    for (var layer_name in graph) {
        if (nodes.indexOf(layer_name) == -1) {
            complementary_nodes.push(layer_name);
        }
    }
    return complementary_nodes;
}

function get_graph_roots(graph) {
    var root_layers = [];
    for (var layer_name in graph) {
        var layer = graph[layer_name];
        if (layer.input_layers.length == 0) {
            root_layers.push(layer_name);
        }
    }
    return root_layers;
}

function get_graph_leaves(graph) {
    var non_leaf_layers = [];
    for (var layer_name in graph) {
        var layer = graph[layer_name];
        for (var i = 0; i < layer.input_layers.length; i++) {
            if (non_leaf_layers.indexOf(layer.input_layers[i]) == -1) {
                non_leaf_layers.push(layer.input_layers[i])
            }
        }
    }
    return get_complementary_nodes(graph, non_leaf_layers);
}

function get_topological_ordering_of_graph(graph) {
    // regular topological sorting
    var graph =  JSON.parse(JSON.stringify(graph)); // clone graph since we are going to change things
    var input_layers = get_graph_roots(graph);
    var other_layers = get_complementary_nodes(graph, input_layers);
    var sorted_layers_names = [];

    // for each root node remove all the outgoing edges and insert the newly created "root" nodes to the list
    while (input_layers.length > 0) {
        var layer = graph[input_layers[0]];
        input_layers.splice(0,1);
        sorted_layers_names.push(layer.name);
        for (var next_layer_idx = 0; next_layer_idx < other_layers.length; next_layer_idx++) {
            var next_layer = graph[other_layers[next_layer_idx]];
            var layer_idx = next_layer.input_layers.indexOf(layer.name);
            if (layer_idx != -1) {
                next_layer.input_layers.splice(layer_idx,1);
                if (next_layer.input_layers.length == 0) {
                    input_layers.push(next_layer.name);
                }
            }
        }
    }
    return sorted_layers_names;
}

////////////////////////////////////////
// Exporting

function convert_graph_to_keras(graph) {
    var model_code = new CodeGenerator("python");

    var sorted_layer_names = get_topological_ordering_of_graph(graph);
    var input_layers = get_graph_roots(graph);
    var output_layers = get_graph_leaves(graph);

    model_code.add_dependency("keras.models", ["Model"]);
    model_code.add_line();
    model_code.open_function("get_model");
    for (var layer_idx = 0; layer_idx < sorted_layer_names.length; layer_idx++) {
        layer_name = sorted_layer_names[layer_idx];
        layer = graph[layer_name];
        input_layers = layer.input_layers; // TODO: deal with layers with more than 1 input
        // we allow intermediate transformation code since some layers need reshaping before they apply
        layer_code = layer.toKeras(input_layers);
        model_code.add_lines(layer_code.code);
        console.log(layer_code);
        if (Object.keys(layer_code.dependencies).length > 0) {
            model_code.add_dependency(layer_code.dependencies.library, layer_code.dependencies.classes);
        }
    }
    model_code.add_line("return Model([" + input_layers.toString() + "],[" + output_layers.toString() + "])");
    model_code.close_function();
    return model_code.get_code();
}

function save_current_state_to_file(framework) {
    // download the current state to the user's machine
    canvas_manager.show_message("Downloading topology", true);
    var text;
    if (framework == "Neuralizer") {
        text = JSON.stringify(canvas_manager.stored_states[canvas_manager.current_timestep]);
    } else if (framework == "Keras") {
        text = convert_graph_to_keras(canvas_manager.to_graph());
    } else {
        text = JSON.stringify(canvas_manager.to_graph(), null, "\t");
    }
    download_as_file($("#filename").val(), text, "text");
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
