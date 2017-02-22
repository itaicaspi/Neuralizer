/**
 * Created by icaspi on 1/30/2017.
 */

var layer_types = {
    "DataPlaceholder": {
        "id": "#dataParams",
        "short_name": "data"
    },
    "Pooling": {
        "id": "#poolingParams",
        "short_name": "pool",
        "subtype_selector_id": "#poolingType",
        "subtypes": {"MaxPooling": {"id": "#maxPoolingParams"},
            "AveragePooling": {"id": "#averagePoolingParams"},
            "StochasticPooling": {"id": "#stochasticPoolingParams"}}},
    "Convolution": {
        "id": "#convolutionParams",
        "short_name": "conv"},
    "Deconvolution": {
        "id": "#deconvolutionParams",
        "short_name": "deconv"},
    "Activation": {
        "id": "#activationParams",
        "short_name": "activation",
        "subtype_selector_id": "#activationType",
        "subtypes": {"ReLU": {"id": "#reluParams"},
            "ReLU6": {"id": "#relu6Params"},
            "LeakyReLU": {"id": "#leakyReluParams"},
            "ParametericReLU": {"id": "#parametericReluParams"},
            "ELU": {"id": "#eluParams"},
            "Sigmoid": {"id": "#sigmoidParams",
                "short_name": "σ"},
            "HardSigmoid": {"id": "#hardSigmoidParams"},
            "TanH": {"id": "#tanhParams",
                "short_name": "tanh"},
            "Softmax": {"id": "#softmaxParams"},
            "Softsign": {"id": "#softsignParams"},
            "Softplux": {"id": "#softplusParams"}}},
    "Normalization": {
        "id": "#normalizationParams",
        "short_name": "norm",
        "subtype_selector_id": "#normalizationType",
        "subtypes": {"LocalResponseNormalization": {"id": "#localResponseNormalizationParams"},
            "BatchNormalization": {"id": "#batchNormalizationParams"},
            "L2Normalization": {"id": "#l2NormalizationParams"}}},
    "Regularization": {
        "id": "#regularizationParams",
        "short_name": "regularize",
        "subtype_selector_id": "#regularizationType",
        "subtypes": {"Dropout": {"id": "#dropoutParams"},
            "Maxout": {"id": "#maxoutParams"},
            "Zoneout": {"id": "#zoneoutParams"},
            "DropConnect": {"id": "#dropConnectParams"}}},
    "DataManipulation": {
        "id": "#dataManipulationParams",
        "short_name": "manipulate",
        "subtype_selector_id": "#dataManipulationType",
        "subtype": {"Reshape": {"id": "#reshapeParams"},
            "Concatenate": {"id": "#concatenateParams"},
            "Flatten": {"id": "#flattenParams"},
            "Permute": {"id": "#permuteParams"}}},
    "ElementWise": {
        "id": "#elementWiseParams",
        "short_name": "+",
        "subtype_selector_id": "#elementWiseType",
        "subtype": {"Add": {"id": "#addParams"},
            "Multiply": {"id": "#multiplyParams"}}},
    "Stochastic": {
        "id": "#stochasticParams",
        "short_name": "stochastic",
        "subtype": {"GaussianNoise": {"id": "#gaussianParams"},
            "UniformNoise": {"id": "#uniformParams"},
            "GumbleSoftmax": {"id": "#gumbleSoftmaxParams"}}},
    "InnerProduct": {"id": "#innerProductParams", "short_name": "fc"},
    "SpecialBlock": {"id": "#specialBlockParams", "short_name": "special"},
    "Recurrent": {"id": "#recurrentParams", "short_name": "recurrent"},
    "Advanced": {
        "id": "#advancedParams",
        "short_name": "advanced",
        "subtype": {"Memory": {"id": "#memoryParams"},
            "Attention": {"id": "#attentionParams"}}}
};


var SidebarManager = function() {
    this.modes = ["before", "designer", "share_explore", "account", "after"];
    this.mode_icons = [];
    for (var key = 0; key < this.modes.length; key++) {
        this.mode_icons.push($("#" + this.modes[key] + "_icon"));
    }
    this.current_mode = "designer";
    this.add_layer_icon = $("#addLayerIcon");
    this.layer_name = $("#layerName");
    this.full_details_switch = $("#fullDetails");
    this.layer_type = $("#layerType");
    this.available_models = 0;
    this.grid = false;
};

SidebarManager.prototype.change_selected_color = function(color_idx) {
    for (var i = 0; i < 6; i++) {
        var color_element = $('#color' + i.toString());
        if (i == color_idx) {
            $(color_element).html('<i class="glyphicon glyphicon-ok" style="margin-top: 3px;margin-left:50%;left:-8px;color:rgba(255,255,255,0.7)"></i>');
        } else {
            $(color_element).html('');
        }
    }
};


SidebarManager.prototype.show_remove_layer_button = function() {
    $("#removeLayerIcon").addClass('rotated');
    $("#removeLayer").addClass('move-right');
    $("#removeLayer").removeClass('invisible-btn');
    $("#addLayerIcon").addClass('rotated-90');
    $("#addLayer").addClass('move-left');
};

SidebarManager.prototype.hide_remove_layer_button = function() {
    $("#removeLayerIcon").removeClass('rotated');
    $("#removeLayer").removeClass('move-right');
    $("#removeLayer").addClass('invisible-btn');
    $("#addLayerIcon").removeClass('rotated-90');
    $("#addLayer").removeClass('move-left');
};

SidebarManager.prototype.set_layer_name = function(text) {
    $(this.layer_name).val(text);
};

SidebarManager.prototype.focus_layer_name = function() {
    setTimeout(function () {
        $("#layerName").focus();
    }, 1);
};

SidebarManager.prototype.set_full_details_switch = function(value) {
    $(this.full_details_switch)[0].checked = value;
};


SidebarManager.prototype.add_model_to_canvas_overlay = function(model) {
    var object =
        '<div class="grid-item grid-item--width2 animated"> ' +
            '<figure class="card"> ' +
                '<div class="card-barrier"></div> ' +
                '<div class="card-thumbnail-container"> ' +
                    '<span class="remove-model" onclick="sidebar_manager.remove_model_from_server(' + model.id + ')"><i class="material-icons">delete</i></span>' +
                    '<a class="card-thumbnail" onclick="sidebar_manager.load_model_from_server(\'' + model.json_state + '\')" ' +
                        'style="background-image: url(\'models\/' + model.json_state + '.png\");" draggable="false"></a> ' +
                '</div>' +
                '<figcaption class="card-title-section"> ' +
                    '<div class="card-title editable" title="Inception v4">' + model.name + '</div> ' +
                    '<div class="card-title-owner">Itai Caspi ' +
                        '<div class="stars"><span><i class="fa fa-star" aria-hidden="true"></i>' + model.stars + '</span></div> ' +
                    '</div> ' +
                    '<div class="card-tags"> ' +
                        '<mark data-entity="detection"></mark> ' +
                        '<mark data-entity="classification"></mark> ' +
                    '</div> ' +
                '</figcaption> ' +
            '</figure> ' +
        '</div>';

    var models_container = $("#models_container");
    $(models_container).prepend($(object));
};

SidebarManager.prototype.show_models_in_canvas_overlay = function(models) {
    var grid = $('.grid');
    // add models to canvas overlay
    $(grid).empty();
    if (this.grid) {
        $(this.grid).masonry('destroy');
    }
    for (var i = 0; i < models.length; i++) {
        this.add_model_to_canvas_overlay(models[i]);
    }
    $(grid).imagesLoaded(function() {
        $(grid).masonry({
            // options
            itemSelector: '.grid-item',
            columnWidth: 100
        });
    });

    // show canvas overlay
    if (this.available_models == 0 && models.length > 0 && this.current_mode == 'account') {
        this.show_canvas_explore();
    }

    this.available_models = models.length;
};

SidebarManager.prototype.load_model_from_server = function(json_state) {
    load_model_from_server(json_state);
    this.hide_canvas_explore();
    this.switch_sidebar_mode('designer');
};


SidebarManager.prototype.remove_model_from_server = function(model_id) {
    remove_model_from_server(model_id);
    update_user_models_from_server();
};

SidebarManager.prototype.save_model_to_server = function() {
    upload_current_state_to_server();
    update_user_models_from_server();
};

SidebarManager.prototype.show_canvas_explore = function() {
    $("#canvas_explore").fadeIn();
    if (!this.grid) {
        this.grid = $('.grid');
        $(this.grid).masonry({
            // options
            itemSelector: '.grid-item',
            columnWidth: 100
        });
    }
    $(this.grid).removeClass("fadeOutDown");
    $(this.grid).addClass("fadeInUp");
    $('.grid-item').hover(
        function(){ $(this).addClass('pulse') },
        function(){ $(this).removeClass('pulse') }
    );
    $(".canvas").addClass("blur");
    $("#canvas_keys").addClass("blur");
    // $("#sidebar_container").removeClass("col-xs-2").addClass("col-xs-3", "slow");
    // $("#canvas_container").removeClass("col-xs-9").addClass("col-xs-8", "slow");
};

SidebarManager.prototype.hide_canvas_explore = function() {
    $(".canvas").removeClass("blur");
    $("#canvas_keys").removeClass("blur");
    $(this.grid).removeClass("fadeInUp");
    $(this.grid).addClass("fadeOutDown");
    $("#canvas_explore").fadeOut();
    // $("#sidebar_container").removeClass("col-xs-3").addClass("col-xs-2", "slow");
    // $("#canvas_container").removeClass("col-xs-8").addClass("col-xs-9", "slow");
};


SidebarManager.prototype.switch_sidebar_mode = function(mode) {
    //switch the sidebar mode
    this.current_mode = mode;
    var key;
    for (key = 0; key < this.modes.length; key++) {
        $(this.mode_icons[key]).parent('div').removeClass("wrapping-side-icon");
        $(this.mode_icons[key]).removeClass("before-side-icon");
        $(this.mode_icons[key]).removeClass("selected-side-icon");
        $(this.mode_icons[key]).removeClass("after-side-icon");
    }
    for (key = 0; key <= this.modes.length; key++) {
        if (this.modes[key] == mode) {
            $(this.mode_icons[key-1]).parent('div').addClass("wrapping-side-icon");
            $(this.mode_icons[key-1]).addClass("before-side-icon");
            $(this.mode_icons[key]).addClass("selected-side-icon");
            $(this.mode_icons[key+1]).addClass("after-side-icon");
            $(this.mode_icons[key+1]).parent('div').addClass("wrapping-side-icon");
            $("#" + this.modes[key]).fadeIn("fast");
        } else {
            $("#" + this.modes[key]).hide();
        }
    }
    if (mode == "share_explore" || (mode == "account" && this.available_models > 0)) {
        this.show_canvas_explore();
    } else {
        this.hide_canvas_explore();
    }

};


SidebarManager.prototype.start = function() {
    $("#welcome_screen_container").addClass("fadeOut");
    $("#welcome_screen_container").fadeOut("slow");
    // $('.main').css({
    //     '-webkit-filter':'none',
    //     '-moz-filter':'none',
    //     '-o-filter':'none',
    //     '-ms-filter':'none',
    //     'filter':'none',
    // });
    $("#sidebar_icons_container").fadeIn("slow");
    // $("#sidebar_icons_container").addClass("fadeInLeft");
    $("#sidebar_container").fadeIn("slow");
    $("#sidebar_container").addClass("fadeInLeft");
};



SidebarManager.prototype.switch_layer_type = function(layerType, layerSubtype) {
    var key;
    // close all other than the given type
    for (key in layer_types) {
        if (layerType == key) {
            $(layer_types[key]["id"]).show("fast");
        } else {
            $(layer_types[key]["id"]).hide("fast");
        }
        // choose subtype
        for (var subtype_key in layer_types[key]["subtypes"]) {
            if (layerSubtype == subtype_key) {
                $(layer_types[key]["subtypes"][subtype_key]["id"]).show("fast");
            } else {
                $(layer_types[key]["subtypes"][subtype_key]["id"]).hide("fast");
            }
        }
    }
};

SidebarManager.prototype.select_layer_type = function() {
    // open the parameters section for the selected layer type only
    var layerType = $(this.layer_type).val();
    var layerSubtype = $(layer_types[layerType]["subtype_selector_id"]).val();
    this.switch_layer_type(layerType, layerSubtype);
};


SidebarManager.prototype.change_selected_layer_type = function(layerType, layerSubtype) {
    $(this.layer_type).val(layerType);
    $(layer_types[layerType]["subtype_selector_id"]).val(layerSubtype);
};

SidebarManager.prototype.logged_in_mode = function() {
    $("#UserAuthenticationForm").removeClass("fadeIn");
    $("#UserAuthenticationForm").hide();
    $("#user_greeting").text("Hi, " + $("#username").val());
    $("#UserDetails").show();
    $("#UserDetails").addClass("fadeInUp");
    update_user_models_from_server();
};

SidebarManager.prototype.logged_out_mode = function() {
    $("#UserDetails").removeClass("fadeInUp");
    $("#UserDetails").hide();
    $("#UserAuthenticationForm").show();
    $("#UserAuthenticationForm").addClass("fadeIn");
};

SidebarManager.prototype.logout = function() {
    var form = $('#UserDetails');
    $(form).attr('action', '/logout');
    $(form).submit(function(){
        jQuery.post({
            url: "/logout",
            type: "POST",
            data : $(form).serialize(),
            success: function(){
                sidebar_manager.logged_out_mode();
            }
        });
        return false;
    });
};

SidebarManager.prototype.login = function() {
    var form = $('#UserAuthenticationForm');
    $(form).attr('action', '/login');
    $(form).submit(function(){
        jQuery.post({
            url: "/login",
            type: "POST",
            data : $(form).serialize(),
            statusCode: {
                200: function() { sidebar_manager.logged_in_mode(); },
                401: function() { console.log("error"); }
            }
        });
        return false;
    });
};

SidebarManager.prototype.signup = function() {
    var form = $('#UserAuthenticationForm');
    $(form).attr('action', '/signup');
    $(form).submit(function(){
        jQuery.post({
            url: "/signup",
            type: "POST",
            data : $(form).serialize(),
            success: function(){
                console.log('form submitted.');
            }
        });
        return false;
    });
};
