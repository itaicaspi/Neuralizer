/**
 * Created by icaspi on 1/30/2017.
 */

var SidebarManager = function() {
    this.modes = ["before", "designer", "import_export", "share_explore", "account", "after"];
    this.mode_icons = [];
    for (var key = 0; key < this.modes.length; key++) {
        this.mode_icons.push($("#" + this.modes[key] + "_icon"));
    }
    this.add_layer_icon = $("#addLayerIcon");
    this.layer_name = $("#layerName");
    this.full_details_switch = $("#fullDetails");
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

};