/**
 * Created by icaspi on 1/30/2017.
 */

var layer_types = {
    "Data": {
        "Data Placeholder": {
            "short_name": "data",
            "properties": {
                "Width": {"type": "number", "value": 1, "min": 1, "max": 10000},
                "Height": {"type": "number", "value": 1, "min": 1, "max": 10000},
                "Depth": {"type": "number", "value": 1, "min": 1, "max": 10000}
            }
        },
        "Whitening": {}
    },
    "Layers": {
        "Pooling": {
            "short_name": "pool",
            "subtypes": {
                "Max Pooling": {},
                "Average Pooling": {},
                "Stochastic Pooling": {}
            },
            "properties": {
                "Window Properties": {
                    "type": "group",
                    "properties": {
                        "Width": {"type": "number", "value": 1, "min": 1, "max": 10000},
                        "Height": {"type": "number", "value": 1, "min": 1, "max": 10000},
                        "Stride": {"type": "number", "value": 1, "min": 1, "max": 10000},
                        "Padding": {"type": "number", "value": 0, "min": 0, "max": 10000}
                    }
                }
            }
        },
        "Convolution": {
            "short_name": "conv",
            "properties": {
                "Kernel Properties": {
                    "type": "group",
                    "properties": {
                        "Width": {"type": "number", "value": 1, "min": 1, "max": 10000},
                        "Height": {"type": "number", "value": 1, "min": 1, "max": 10000},
                        "Stride": {"type": "number", "value": 1, "min": 1, "max": 10000},
                        "Dilation": {"type": "number", "value": 1, "min": 1, "max": 10000},
                        "Padding": {"type": "number", "value": 0, "min": 0, "max": 10000}
                    }
                },
                "Number of OFMs": {"type": "number", "value": 1, "min": 1, "max": 10000}
            }
        },
        "Deconvolution": {
            "short_name": "deconv",
            "properties": {
                "Kernel Properties": {
                    "type": "group",
                    "properties": {
                        "Width": {"type": "number", "value": 1, "min": 1, "max": 10000},
                        "Height": {"type": "number", "value": 1, "min": 1, "max": 10000},
                        "Stride": {"type": "number", "value": 1, "min": 1, "max": 10000},
                        "Dilation": {"type": "number", "value": 1, "min": 1, "max": 10000},
                        "Padding": {"type": "number", "value": 0, "min": 0, "max": 10000}
                    }
                },
                "Number of OFMs": {"type": "number", "value": 1, "min": 1, "max": 10000}
            }
        },
        "Activation": {
            "short_name": "activation",
            "subtypes": {
                "ReLU": {},
                "ReLU6": {},
                "Leaky ReLU": {},
                "Parameteric ReLU": {},
                "ELU": {},
                "Sigmoid": {
                    "short_name": "σ"
                },
                "Hard Sigmoid": {},
                "TanH": {
                    "short_name": "tanh"
                },
                "Softmax": {},
                "Softsign": {},
                "Softplux": {}
            }
        },
        "Normalization": {
            "short_name": "norm",
            "subtypes": {
                "Local Response Normalization": {
                    "properties": {
                        "Number of Neighbours": {"type": "number", "value": 1, "min": 1, "max": 10000},
                        "Alpha": {"type": "number", "value": 1, "min": 0, "max": 1, "step": 0.001},
                        "Beta": {"type": "number", "value": 1, "min": 0, "max": 1, "step": 0.001},
                        "K": {"type": "number", "value": 1, "min": 1, "max": 10000}
                    }
                },
                "Batch Normalization": {},
                "L2 Normalization": {}
            }
        },
        "Regularization": {
            "short_name": "regularize",
            "subtypes": {
                "Dropout": {},
                "Maxout": {},
                "Zoneout": {},
                "DropConnect": {}
            },
            "properties": {
                "Keep Probability": {"type": "number", "value": 0.9, "min": 0, "max": 1}
            }
        },
        "Data Manipulation": {
            "short_name": "manipulate",
            "subtypes": {
                "Reshape": {},
                "Concatenate": {},
                "Flatten": {},
                "Permute": {}
            }
        },
        "Element Wise": {
            "short_name": "elem",
            "subtypes": {
                "Add": {},
                "Multiply": {}
            }
        },
        "Stochastic": {
            "short_name": "stochastic",
            "subtypes": {
                "Gaussian Noise": {},
                "Uniform Noise": {},
                "Gumble Softmax": {}
            }
        },
        "Inner Product": {
            "short_name": "fc",
            "properties": {
                "Output Size": {"type": "number", "value": 1, "min": 1, "max": 100000}
            }
        },
        "Special Block": {
            "short_name": "special",
            "subtypes": {
                "Inception": {},
                "Residual Block": {},
                "DenseNet Block": {},
                "Dense Encoder": {},
                "Dense Decoder": {},
                "Convolutional Encoder": {},
                "Convolutional Decoder": {}
            }
        },
        "Recurrent": {
            "short_name": "recurrent",
            "subtypes": {
                "RNN": {},
                "LSTM": {},
                "GRU": {}
            }
        },
        "Advanced": {
            "short_name": "advanced",
            "subtypes": {
                "Memory": {},
                "Attention": {}
            }
        }
    },
    "Optimization": {
        "Objective": {
            "short_name": "loss",
            "subtypes": {
                "L1 Loss": {},
                "L2 Loss": {},
                "Hinge Loss": {},
                "Binary Cross Entropy": {},
                "Categorical Cross Entropy": {},
                "KL Divergence": {},
                "Poisson": {},
                "Cosine Porximity": {}
            }
        },
        "Optimizer": {
            "short_name": "optimizer",
            "subtypes": {
                "SGD": {
                    "properties": {
                        "Momentum": {"type": "number", "value": 0.01, "min": 0, "max": 100, "step": 0.0000000001}
                    }
                },
                "RMSprop": {
                    "properties": {
                        "Rho": {"type": "number", "value": 0.9, "min": 0, "max": 1000, "step": 0.00001},
                        "Epsilon": {"type": "number", "value": 1e-8, "min": 0, "max": 1, "step": 0.00001}
                    }
                },
                "Adagrad": {
                    "properties": {
                        "Epsilon": {"type": "number", "value": 1e-8, "min": 0, "max": 1, "step": 0.00001}
                    }
                },
                "Adadelta": {
                    "properties": {
                        "Rho": {"type": "number", "value": 0.95, "min": 0, "max": 1000, "step": 0.00001},
                        "Epsilon": {"type": "number", "value": 1e-8, "min": 0, "max": 1, "step": 0.00001}
                    }
                },
                "Adam": {
                    "properties": {
                        "Beta1": {"type": "number", "value": 0.9, "min": 0, "max": 1, "step": 0.00001},
                        "Beta2": {"type": "number", "value": 0.999, "min": 0, "max": 1, "step": 0.00001},
                        "Epsilon": {"type": "number", "value": 1e-8, "min": 0, "max": 1, "step": 0.00001}
                    }
                },
                "Adamax": {
                    "properties": {
                        "Beta1": {"type": "number", "value": 0.9, "min": 0, "max": 1, "step": 0.00001},
                        "Beta2": {"type": "number", "value": 0.999, "min": 0, "max": 1, "step": 0.00001},
                        "Epsilon": {"type": "number", "value": 1e-8, "min": 0, "max": 1, "step": 0.00001}
                    }
                },
                "Nadam": {
                    "properties": {
                        "Beta1": {"type": "number", "value": 0.9, "min": 0, "max": 1, "step": 0.00001},
                        "Beta2": {"type": "number", "value": 0.999, "min": 0, "max": 1, "step": 0.00001},
                        "Epsilon": {"type": "number", "value": 1e-8, "min": 0, "max": 1, "step": 0.00001}
                    }
                },
                "FTRL": {}
            },
            "properties": {
                "Learning Rate": {"type": "number", "value": 0.01, "min": 0, "max": 100, "step": 0.0000000001},
                "Decay": {"type": "number", "value": 0.01, "min": 0, "max": 100, "step": 0.0000000001}
            }
        }
    }


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
    this.layer_name_changed_manually = false;
    this.available_models = 0;
    this.user_models = []; // stores all the models owned by the user
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
    $("#layerNameError").hide();
    $(this.layer_name).val(text);
};

SidebarManager.prototype.set_layer_params = function(layer) {
    var layerType = layer.type.replace(/ /g,'');
    var layerSubtype = layer.subtype.replace(/ /g,'');
    var layerSubtypeSelector = $('#' + layerType + 'Type');
    $(this.layer_type).val(layerType).change();
    $(layerSubtypeSelector).val(layerSubtype).change();
    this.select_layer_type();
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
    if (model.stars == undefined) {
        model.stars = 0;
    }
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
                        '<a class="stars" onclick="sidebar_manager.toggle_model_star(' + model.id + ')"><span>' +
                            '<i class="fa fa-star" aria-hidden="true" style="margin-right: 5px"></i>' + model.stars + '</span>' +
                        '</a> ' +
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

SidebarManager.prototype.show_filtered_models_in_canvas_overlay = function(filter_text) {
    filter_text = filter_text.toLowerCase();
    var models = [];
    for (var i = 0; i < this.user_models.length; i++) {
        if (this.user_models[i].name.toLowerCase().search(filter_text) != -1) {
            models.push(this.user_models[i]);
        }
    }
    this.show_models_in_canvas_overlay(models);
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
    $('.grid-item').hover(
        function(){ $(this).addClass('pulse') },
        function(){ $(this).removeClass('pulse') }
    );
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

SidebarManager.prototype.toggle_model_star = function(model_id) {
    toggle_model_star(model_id);
};

SidebarManager.prototype.remove_model_from_server = function(model_id) {
    remove_model_from_server(model_id);
};

SidebarManager.prototype.save_model_to_server = function() {
    upload_current_state_to_server();
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
    $("#canvas_zoom").fadeIn();
};



SidebarManager.prototype.switch_layer_type = function(layerType, layerSubtype) {
    var key;
    // close all other than the given type
    for (var layer_type_group in layer_types) {
        var group = layer_types[layer_type_group];
        for (key in group) {
            key_fixed = key.replace(/ /g,'');
            if (layerType == key_fixed) {
                $("#" + key_fixed + "Params").show("fast");
            } else {
                $("#" + key_fixed + "Params").hide("fast");
            }
            // choose subtype
            for (var subtype_key in group[key]["subtypes"]) {
                subtype_key_fixed = subtype_key.replace(/ /g,'');
                if (layerSubtype == subtype_key_fixed) {
                    $("#" + key_fixed + subtype_key_fixed + "Params").show("fast");
                } else {
                    $("#" + key_fixed + subtype_key_fixed + "Params").hide("fast");
                }
            }
        }
    }

};

SidebarManager.prototype.select_layer_type = function() {
    // open the parameters section for the selected layer type only
    var layerType = $(this.layer_type).val();
    var layerSubtypeSelector = $('#' + layerType + 'Type');
    var layerSubtype = "";
    if (layerSubtypeSelector.get(0)) {
        layerSubtype = layerSubtypeSelector.val();
    }
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

SidebarManager.prototype.create_properties = function(container, properties, prefix) {
    for (var property in properties) {
        var property_type = properties[property]['type'];
        if (property_type == "group") {
            var group_label = $('<label style="color:white; margin-top: 10px">' + property + '</label>');
            var group_container = $('<div style="margin: 20px"></div>');
            $(container).append($(group_label));
            $(container).append($(group_container));
            this.create_properties(group_container, properties[property]['properties'], prefix + property.replace(/ /g,''));
        } else if (property_type == "number") {
            var row = $('<div class="row" style="margin-top: 10px"></div>');
            $(container).append($(row));
            var input_label = $('<div class="col-xs-6"><label for="' + prefix + property.replace(/ /g,'') + '">' + property + '</label></div>');
            var input_col = $('<div class="col-xs-6"></div>');
            var input = $('<input type="number" id="' + prefix + property.replace(/ /g,'') + '" class="form-control">');
            for (var attribute in properties[property]) {
                $(input).attr(attribute, properties[property][attribute]);
            }
            $(row).append(input_label).append(input_col);
            $(input_col).append(input);
        }
    }
};

SidebarManager.prototype.create_layers_factory = function(container) {
    for (var layer_types_group in layer_types) {
        var group = layer_types[layer_types_group];
        for (var layer_type in group) {
            var layer_params = $('<div class="form-group collapse" id="' + layer_type.replace(/ /g,'') + 'Params"></div>');
            $(container).append($(layer_params));
            // subtype selection
            if ('subtypes' in group[layer_type] && Object.keys(group[layer_type]['subtypes']).length > 0) {
                var subtype_selector_id = (layer_type + 'Type').replace(/ /g,'');
                var subtype_selector_label = $('<label for="' + subtype_selector_id + '">' + layer_type + ' Type</label>');
                var subtype_selector = $('<select id="' + subtype_selector_id + '" class="form-control selectpicker" onchange="sidebar_manager.select_layer_type()">');
                $(layer_params).append($(subtype_selector_label));
                $(layer_params).append($(subtype_selector));
                for (var subtype in group[layer_type]['subtypes']) {
                    var subtype_selector_option = $('<option value="' + subtype.replace(/ /g,'') + '">' + subtype + '</option>');
                    $(subtype_selector).append($(subtype_selector_option));

                    // subtype properties
                    var subtype_params = group[layer_type]['subtypes'][subtype];
                    if ('properties' in subtype_params && Object.keys(subtype_params['properties']).length > 0) {
                        var subtype_prefix = (layer_type + subtype).replace(/ /g,'');
                        var subtype_container = $('<div id="' + subtype_prefix + 'Params"></div>');
                        $(layer_params).append($(subtype_container));
                        this.create_properties(subtype_container, subtype_params['properties'], subtype_prefix);
                    }
                }
            }
            // properties
            if ('properties' in group[layer_type] && Object.keys(group[layer_type]['properties']).length > 0) {
                this.create_properties(layer_params, group[layer_type]['properties'], layer_type.replace(/ /g,''));
            }
        }
    }

};

SidebarManager.prototype.create_layers_selector = function(container) {
    $(container).append('<label for="layerType" style="color:white">Layer Type</label>');
    var selector = $('<select id="layerType" class="form-control selectpicker" onchange="sidebar_manager.select_layer_type()"></select>');
    $(container).append($(selector));
    for (var layer_types_group in layer_types) {
        var optgroup = $('<optgroup label="' + layer_types_group + '"></optgroup>');
        $(selector).append($(optgroup));
        var group = layer_types[layer_types_group];
        for (var layer_type in group) {
            $(optgroup).append('<option value="' + layer_type.replace(/ /g,'') + '">' + layer_type + '</option>');
        }
    }
    this.layer_type = $("#layerType");
};