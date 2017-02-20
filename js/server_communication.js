/**
 * Created by Itai Caspi on 20/02/2017.
 */


function upload_current_state_to_server() {
    var name = $("#filename").val();
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
        }
    });
}

function update_user_models_from_server() {
    var models = [];
    jQuery.get({
        url: "/mymodels",
        data : {},
        success: function(res){
            sidebar_manager.show_models_in_canvas_overlay(res);
        }
    });
}