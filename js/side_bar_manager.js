/**
 * Created by icaspi on 1/30/2017.
 */

var SidebarManager = function() {
    this.add_layer_icon = $("#addLayerIcon");
    this.layer_name = $("#layerName");
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
