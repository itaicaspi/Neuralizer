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
    this.add_layer_icon = $("#addLayerIcon");
    this.layer_name = $("#layerName");
    this.full_details_switch = $("#fullDetails");
    this.layer_type = $("#layerType");
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

SidebarManager.prototype.toggle_add_or_remove_button = function() {
    if ($(this.add_layer_icon).attr('data-original-title') == "Add") {
        $(this.add_layer_icon).attr('data-original-title', "Remove");
    } else {
        $(this.add_layer_icon).attr('data-original-title', "Add");
    }
    $(this.add_layer_icon).toggleClass('rotated');
};


SidebarManager.prototype.set_add_or_remove_button_to_add = function() {
    if ($(this.add_layer_icon).hasClass('rotated')) {
        this.toggle_add_or_remove_button();
    }
};

SidebarManager.prototype.set_add_or_remove_button_to_remove = function() {
    if (!$(this.add_layer_icon).hasClass('rotated')) {
        this.toggle_add_or_remove_button();
    }
};

SidebarManager.prototype.set_layer_name = function(text) {
    $(this.layer_name).val(text);
};

SidebarManager.prototype.focus_layer_name = function() {
    setTimeout(function () {
        $(this.layer_name).focus();
    }, 1);
};

SidebarManager.prototype.set_full_details_switch = function(value) {
    $(this.full_details_switch)[0].checked = value;
};


SidebarManager.prototype.switch_sidebar_mode = function(mode) {
    //switch the sidebar mode
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
    if (mode == "share_explore") {
        $("#canvas_explore").fadeIn();
        $('.grid').masonry({
            // options
            itemSelector: '.grid-item',
            columnWidth: 100
        });
        $(".grid").removeClass("fadeOutDown");
        $(".grid").addClass("fadeInUp");
        $('.grid-item').hover(
            function(){ $(this).addClass('pulse') },
            function(){ $(this).removeClass('pulse') }
        )
        $(".canvas").addClass("blur");
        $("#canvas_keys").addClass("blur");
        // $("#sidebar_container").removeClass("col-xs-2").addClass("col-xs-3", "slow");
        // $("#canvas_container").removeClass("col-xs-9").addClass("col-xs-8", "slow");
    } else {
        $(".canvas").removeClass("blur");
        $("#canvas_keys").removeClass("blur");
        $(".grid").removeClass("fadeInUp");
        $(".grid").addClass("fadeOutDown");
        $("#canvas_explore").fadeOut();
        // $("#sidebar_container").removeClass("col-xs-3").addClass("col-xs-2", "slow");
        // $("#canvas_container").removeClass("col-xs-8").addClass("col-xs-9", "slow");
    }

};


SidebarManager.prototype.start = function() {
    $("#welcome_screen_container").addClass("zoomOut");
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


