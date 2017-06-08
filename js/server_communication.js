/**
 * Created by Itai Caspi on 20/02/2017.
 */


function upload_current_state_to_server() {
    var name = $("#filename").val();
    if (name == "") {
        name = "Neuralizer Topology";
        $("filename").val(name);
    }
    var text = {
        model_name: name,
        model_json: canvas_manager.stored_states[canvas_manager.current_timestep],
        model_image: get_current_state_image()
    };

    jQuery.post({
        url: "/upload",
        type: "POST",
        data : text,
        success: function(){
            console.log("uploaded successfully");
            update_user_models_from_server();
        }
    });
}

function update_user_models_from_server() {
    jQuery.get({
        url: "/mymodels",
        data : {},
        success: function(res){
            sidebar_manager.user_models = res;
            sidebar_manager.show_models_in_canvas_overlay(res);
        }
    });
}

function remove_model_from_server(model_id) {
    var data = {
        model_id: model_id
    };

    jQuery.post({
        url: "/remove_model",
        type: "POST",
        data : data,
        success: function(res){
            update_user_models_from_server();
        }
    });
}

function load_model_from_server(json_state) {
    var data = {
        json_state: json_state
    };

    jQuery.post({
        url: "/get_model",
        type: "POST",
        data : data,
        success: function(res){
            canvas_manager.load_state(res);
        }
    });
}

function toggle_model_star(model_id) {
    var data = {
        model_id: model_id
    };

    jQuery.post({
        url: "/toggle_model_star",
        type: "POST",
        data : data,
        success: function(res){
            update_user_models_from_server();
        }
    });
}