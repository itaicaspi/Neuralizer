/**
 * Created by icaspi on 1/30/2017.
 */


/////////////////////////////////////
//  Group

var Group = function(name, shapes, margin) {
    if (typeof name == "object") {
        // copy constructor
        Rectangle.call(this, name);
    } else {
        this.shapes = shapes;
        this.margin = (typeof margin != 'undefined') ? margin : 20;
        this.move_and_resize_to_fit_shapes(this.shapes);
        Rectangle.call(this, this.x, this.y, this.width, this.height, 6, 0, 3, "", new Color(150, 150, 150, 0), new Color(150, 150, 150, 1), false, undefined, undefined, true, -1);
    }
    this.type = "Group";
};

inheritsFrom(Group, Rectangle);

Group.prototype.move_and_resize_to_fit_shapes = function(shapes) {
    bb = canvas_manager.get_bounding_box_over_shapes(shapes);
    this.width = bb.max_x - bb.min_x + this.margin*2;
    this.height = bb.max_y - bb.min_y + this.margin*2;
    this.x = (bb.max_x + bb.min_x)/2;
    this.y = (bb.max_y + bb.min_y)/2;
};

Group.prototype.update = function() {
    this.move_and_resize_to_fit_shapes(this.shapes);
    this.update_vertices();
};

Group.prototype.highlight = function() {
    Object.getPrototypeOf(Group.prototype).highlight.call(this);
    for (var i = 0; i < this.shapes.length; i++) {
        this.shapes[i].highlight();
    }
};


Group.prototype.darken = function() {
    Object.getPrototypeOf(Group.prototype).darken.call(this);
    for (var i = 0; i < this.shapes.length; i++) {
        this.shapes[i].darken();
    }
};


/////////////////////////////////////
//  CanvasManager

var CanvasManager = function(canvas) {
    this.zoom = 1;
    this.offset_x = 0;
    this.offset_y = 0;

    this.canvas = canvas;
    this.fix_canvas_size(canvas);
    this.ctx = this.canvas.getContext('2d');

    // shapes
    this.shapes = [];
    this.arrows = [];
    this.current_arrow = new Line([], 5, new Color(0, 0, 0, 1), 3);
    this.snap_threshold = 10;

    // canvas selection
    this.selection_box = new Rectangle(0, 0, 0, 0, 10, 0, 2, "", new Color(0, 0, 0, 0), new Color(100, 100, 100, 1), true, undefined, true);
    this.selected_shapes = [];
    this.selected_color_idx = 0;

    // clipboard
    this.clipboard = [];
    this.paste_random_move_size = 20;

    // cursor management
    this.shape_with_content_pointed_by_cursor = false;
    this.shape_with_border_pointed_by_cursor = false;
    this.arrow_with_border_pointed_by_cursor = false;
    this.arrow_with_end_pointed_by_cursor = false;
    this.cursor_diff_x = 0;
    this.cursor_diff_y = 0;
    this.cursor_x = 0;
    this.cursor_y = 0;
    this.cursor_accum_x = 0;
    this.cursor_accum_y = 0;
    this.mouse_is_pressed = false;
    this.available_mouse_buttons = ["left", "middle", "right"];
    this.pressed_mouse_button = this.available_mouse_buttons[0];

    // state storing
    // the buffer is initialized with an empty state, current_timestep points to the last stored state
    this.stored_states = [this.curr_state_to_json()];
    this.current_timestep = 0;

    // draw
    this.animationIntervalId = 0;
    this.draw_required = false;

};

CanvasManager.prototype.fix_canvas_size = function(canvas) {
    if (canvas != undefined) {
      this.canvas = canvas;
    }
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
};

CanvasManager.prototype.zoom_canvas = function(delta, center_zoom) {
    if (this.zoom <= 0.1 && delta < 0) return;

    delta = 1 + delta/this.zoom;
    if (center_zoom == undefined) {
        this.translate_canvas(-this.cursor_x + this.offset_x, -this.cursor_y + this.offset_y);
    }
    this.zoom *= delta;
    this.ctx.translate(this.offset_x, this.offset_y);
    this.ctx.scale(delta, delta);
    this.ctx.translate(-this.offset_x, -this.offset_y);
    if (center_zoom == undefined) {
        this.translate_canvas((this.cursor_x - this.offset_x)/delta, (this.cursor_y - this.offset_y)/delta);
    }
    $("#zoom_value").html(Math.round(100*this.zoom) + "%");
    this.draw_required = true;
    this.draw_curr_state_if_necessary();
};

CanvasManager.prototype.translate_canvas = function(dx, dy) {
    this.offset_x -= dx;
    this.offset_y -= dy;
    this.cursor_x -= dx;
    this.cursor_y -= dy;
    this.ctx.translate(dx, dy);
};

//////////////////////////////
// Clipboard Management

CanvasManager.prototype.copy_from_clipboard = function() {
    var i;
    this.clipboard = [];

    // clone all the selected shapes
    for (i = 0; i < this.selected_shapes.length; i++) {
        // I clone each object so that it will be detached from the original object
        var copiedObject = this.selected_shapes[i].clone();
        copiedObject.set_layer(this.selected_shapes[i].layer);
        this.clipboard.push(copiedObject);
    }
};

CanvasManager.prototype.paste_from_clipboard = function() {
    var i;
    var random_translation_x = this.paste_random_move_size*Math.random();
    var random_translation_y = this.paste_random_move_size*Math.random();
    this.reset_selected_shapes();
    this.darken_all_shapes();
    for (i = 0; i < this.clipboard.length; i++) {
        // I clone again each object from the clipboard so that multiple pastes will be possible
        var copiedObject = this.clipboard[i].clone();
        copiedObject.set_layer(this.clipboard[i].layer);
        copiedObject.translate(50 + random_translation_x, 50 + random_translation_y);

        if (copiedObject.type != "Line") {
            copiedObject.highlight();
            if (this.layer_name_is_in_use(copiedObject.name)) {
                copiedObject.name = this.add_layer_counter(copiedObject.name);
            }
            this.shapes.push(copiedObject);
            this.selected_shapes.push(copiedObject);
        } else {
            this.arrows.push(copiedObject);
        }
    }
    this.save_state();
    this.draw_required = true;
};

CanvasManager.prototype.add_layer_counter = function(layer_name) {
    var counter = 1;
    while (canvas_manager.layer_name_is_in_use(layer_name + "_" + counter)) {
        counter += 1;
    }
    return layer_name + "_" + counter;
};


/////////////////////////////////
// Pointer and Selection Methods

CanvasManager.prototype.snap_to_grid = function(step_size, counter, diff) {
    // uses the step size for shape movement to determine the new shape location
    var after = (counter + diff) / step_size;
    var before = counter / step_size;
    var change = 0;
    if (after < 0) {
        change = Math.ceil(after) - Math.ceil(before);
    } else {
        change = Math.floor(after) - Math.floor(before);
    }
    if (change != 0) {
        diff = change * step_size;
        counter = 0;
    } else {
        counter += diff;
        diff = 0;
    }
    return [counter, diff];
};

CanvasManager.prototype.get_primary_selected_shape = function() {
    if (this.selected_shapes.length > 0) {
        return this.selected_shapes[0];
    }
    return false;
};


CanvasManager.prototype.update_cursor_state = function(x, y, pressed_button, is_pressed) {
    this.cursor_diff_x = x/this.zoom - this.canvas.getBoundingClientRect().left/this.zoom - this.cursor_x + this.offset_x;
    this.cursor_diff_y = y/this.zoom - this.canvas.getBoundingClientRect().top/this.zoom - this.cursor_y + this.offset_y;
    this.cursor_x = (x - this.canvas.getBoundingClientRect().left)/this.zoom + this.offset_x;
    this.cursor_y = (y - this.canvas.getBoundingClientRect().top)/this.zoom + this.offset_y;
    this.mouse_is_pressed = (typeof is_pressed != 'undefined') ? is_pressed : this.mouse_is_pressed;
    if (pressed_button < this.available_mouse_buttons.length) {
        this.pressed_mouse_button = this.available_mouse_buttons[pressed_button];
    }
    this.update_pointed_objects();
};

CanvasManager.prototype.update_pointed_objects = function() {
    this.shape_with_content_pointed_by_cursor = false;
    this.shape_with_border_pointed_by_cursor = false;
    this.arrow_with_border_pointed_by_cursor = false;
    this.arrow_with_end_pointed_by_cursor = false;

    var i;
    for (i = 0; i < this.shapes.length; i++) {
        var shape = this.shapes[i];
        if (shape.pointer_is_on_the_border(this.cursor_x, this.cursor_y, this.ctx)) {
            this.shape_with_border_pointed_by_cursor = shape;
        } else if (shape.pointer_is_inside(this.cursor_x, this.cursor_y)) {
            this.shape_with_content_pointed_by_cursor = shape;
        }
    }

    for (i = 0; i < this.arrows.length; i++) {
        var arrow = this.arrows[i];
        if (arrow.pointer_is_on_end(this.cursor_x, this.cursor_y, this.ctx)) {
            this.arrow_with_end_pointed_by_cursor = arrow;
        } else if (arrow.pointer_is_on_the_border(this.cursor_x, this.cursor_y, this.ctx)) {
            this.arrow_with_border_pointed_by_cursor = arrow;
        }
    }
};

CanvasManager.prototype.select_shape = function(shape) {
    this.selected_shapes = [shape];
    if (shape.type == "Group") {
        this.selected_shapes = this.selected_shapes.concat(shape.shapes);
    }
    this.highlight_selected_shapes();
};

CanvasManager.prototype.update_selected_shapes_from_selection_box = function() {
    // update the selected shapes from the selection box position
    if (Math.abs(this.selection_box.width) < 10 || Math.abs(this.selection_box.height) < 10) return;

    this.selected_shapes = [];
    for (var i = 0; i < this.shapes.length; i++) {
        var shape = this.shapes[i];
        var left_check = (shape.x - shape.width/2) > this.selection_box.x;
        var top_check = (shape.y - shape.height/2) > this.selection_box.y;
        var right_check = (shape.x + shape.width/2) < this.selection_box.x + this.selection_box.width;
        var bottom_check = (shape.y + shape.height/2) < this.selection_box.y + this.selection_box.height;
        if ((left_check == true && top_check == true && right_check == true && bottom_check == true) ||
            (left_check == false && top_check == false && right_check == false && bottom_check == false) ||
            (left_check == true && top_check == false && right_check == true && bottom_check == false) ||
            (left_check == false && top_check == true && right_check == false && bottom_check == true)) {
            this.selected_shapes.push(shape);
        }
    }
};

CanvasManager.prototype.change_selected_shapes_color = function(color_idx) {
    this.selected_color_idx = color_idx;
    var r = border_colors[color_idx].r;
    var g = border_colors[color_idx].g;
    var b = border_colors[color_idx].b;
    var max_val = Math.max(Math.max(r, g), b);

    for (var s = 0; s < this.selected_shapes.length; s++) {
        var border_color = new Color(r, g, b, 1);
        var fill_color = new Color(r + 0.5 * max_val, g + 0.5 * max_val, b + 0.5 * max_val, 0);

        this.selected_shapes[s].change_fill_color(fill_color);
        this.selected_shapes[s].change_border_color(border_color);
        for (var a = 0; a < this.arrows.length; a++) {
            this.arrows[a].linked_shape_color_change(this.selected_shapes[s], this.arrows);
        }
        this.selected_shapes[s].highlight();
    }

    this.save_state();
    this.draw_required = true;
    this.draw_curr_state_if_necessary();
};


CanvasManager.prototype.darken_all_shapes = function() {
    var i;
    for (i = 0; i < this.shapes.length; i++) {
        this.shapes[i].darken();
    }

    this.draw_required = true;
};

CanvasManager.prototype.highlight_selected_shapes = function() {
    this.darken_all_shapes();
    var i;
    for (i = 0; i < this.selected_shapes.length; i++) {
        this.selected_shapes[i].highlight();
    }
    if (this.shape_with_content_pointed_by_cursor) {
        this.shape_with_content_pointed_by_cursor.highlight();
    }

    this.draw_required = true;
    this.draw_curr_state_if_necessary();
};

CanvasManager.prototype.group_selected_shapes = function() {
    shape = new Group("", this.selected_shapes);
    canvas_manager.add_shape(shape);
};

CanvasManager.prototype.remove_selected_shapes = function() {
    var i, j;
    var connected_arrows = [];
    // get all connected arrows
    var temp_connected_arrows = this.find_connected_arrows(this.selected_shapes);
    while (temp_connected_arrows.length > 0) {
        for (i = 0; i < temp_connected_arrows.length; i++) {
            connected_arrows.push(temp_connected_arrows[i]);
        }
        temp_connected_arrows = this.find_connected_arrows(temp_connected_arrows);
    }
    for (var a = this.arrows.length - 1; a >= 0; a--) {
        for (j = 0; j < connected_arrows.length; j++) {
            if (connected_arrows[j].key == this.arrows[a].key) {
                this.arrows.splice(a, 1);
                break;
            }
        }
    }
    groups = this.separate_groups_and_shapes(this.shapes)['groups'];
    for (var s = this.selected_shapes.length - 1; s >= 0; s--) {
        for (var g = 0; g < groups.length; g++) {
            // update all groups that include this shape
            var shape_index = this.get_shape_index_in_list(groups[g].shapes, this.selected_shapes[s]);
            if (shape_index != -1) {
                groups[g].shapes.splice(shape_index, 1);
                if (groups[g].shapes.length == 0) {
                    // no shapes left in group
                    var shape_index = this.get_shape_index_in_list(this.shapes, groups[g]);
                    this.shapes.splice(shape_index, 1);
                } else {
                    groups[g].update();
                }
            }
        }
        var shape_index = this.get_shape_index_in_list(this.shapes, this.selected_shapes[s]);
        this.shapes.splice(shape_index, 1);
        this.selected_shapes.splice(s, 1);
    }

    this.draw_required = true;
    // this.draw_curr_state_if_necessary();
};


CanvasManager.prototype.update_all_groups = function() {
    groups = this.separate_groups_and_shapes(this.shapes)["groups"];
    for (var i = 0; i < groups.length; i++) {
        groups[i].update();
    }
};

CanvasManager.prototype.separate_groups_and_shapes = function(shapes_list) {
    var groups = [];
    var shapes = [];
    for (var i = 0; i < shapes_list.length; i++) {
        if (shapes_list[i].type == "Group") {
            groups.push(shapes_list[i]);
        } else {
            shapes.push(shapes_list[i]);
        }
    }
    return {"groups": groups, "shapes": shapes};
};

CanvasManager.prototype.move_selected_shapes = function() {
    var diff_used = this.move_shapes_with_alignment(this.selected_shapes, this.cursor_diff_x + this.cursor_accum_x, this.cursor_diff_y + this.cursor_accum_y);
    this.cursor_accum_x = (this.cursor_diff_x + this.cursor_accum_x - diff_used.x);
    this.cursor_accum_y = (this.cursor_diff_y + this.cursor_accum_y - diff_used.y);
    this.update_all_groups();
};

CanvasManager.prototype.align_selected_shapes = function(vertically, horizontally) {
    var center = new Vertex(0,0,0);
    for (var v = 0; v < this.selected_shapes.length; v++) {
        center = center.add(this.selected_shapes[v].get_center());
    }
    center = center.mul(1.0/this.selected_shapes.length);
    for (var v = 0; v < this.selected_shapes.length; v++) {
        var diff = center.subtract(this.selected_shapes[v].get_center());
        if (!vertically) {
            diff.x = 0;
        }
        if (!horizontally) {
            diff.y = 0;
        }
        this.move_shapes([this.selected_shapes[v]], diff.x, diff.y);
    }
};


CanvasManager.prototype.shape_is_selected = function(shape) {
    // check if the given shape is currently selected
    var i;
    for (i = 0; i < this.selected_shapes.length; i++) {
        if (shape.key == this.selected_shapes[i].key) {
            return true;
        }
    }
    return false;
};

CanvasManager.prototype.select_all_shapes = function() {
    this.selected_shapes = [];
    for (var i = 0; i < this.shapes.length; i++) {
        this.selected_shapes.push(this.shapes[i]);
    }
    this.highlight_selected_shapes();
};

CanvasManager.prototype.reset_selected_shapes = function() {
    this.selected_shapes = [];
};

CanvasManager.prototype.hide_selection_box = function() {
    this.selection_box.hide();
    this.selection_box.width = 0;
    this.selection_box.height = 0;
    this.draw_required = true;
};

CanvasManager.prototype.initialize_selection_box = function() {
    this.selection_box.x = this.cursor_x;
    this.selection_box.y = this.cursor_y;
    this.selection_box.stroke = 2/this.zoom;
    this.selection_box.border = 10/this.zoom;
    this.reset_selected_shapes();
    this.draw_required = true;
};

CanvasManager.prototype.set_selection_box = function() {
    this.selection_box.width = this.cursor_x - this.selection_box.x;
    this.selection_box.height = this.cursor_y - this.selection_box.y;
    this.selection_box.update_vertices();
    this.selection_box.show();
    this.update_selected_shapes_from_selection_box();
    this.draw_required = true;
};

CanvasManager.prototype.selection_box_is_active = function() {
    return this.selection_box.width != 0 || this.selection_box.height != 0;
};

CanvasManager.prototype.get_unselected_shapes = function() {
    var unselected_shapes = [];
    for (var i = 0; i < this.shapes.length; i++) {
        var is_selected = false;
        for (var j = 0; j < this.selected_shapes.length; j++) {
            if (this.selected_shapes[j].key == this.shapes[i].key) {
                is_selected = true;
            }
        }
        if (!is_selected) {
            unselected_shapes.push(this.shapes[i]);
        }
    }
    return unselected_shapes;
};

//////////////////////////
// Drawing Methods

CanvasManager.prototype.draw_curr_state_if_necessary = function() {
    // draws only if the drawing flag was turned on
    if (this.draw_required) {
        this.draw_curr_state();
    }
};

CanvasManager.prototype.sort_shapes = function(shapes) {
    function compare(a,b) {
        if (a.z_index < b.z_index)
            return -1;
        if (a.z_index > b.z_index)
            return 1;
        return 0;
    }
    shapes.sort(compare);
    return shapes;
};

CanvasManager.prototype.draw_curr_state = function() {
    this.clear_canvas();

    // draw everything
    this.sort_shapes(this.shapes);
    this.draw_array(this.separate_groups_and_shapes(this.shapes)["groups"]);
    this.draw_array(this.arrows);
    this.selection_box.draw(this.ctx);
    this.current_arrow.draw(this.ctx);
    this.draw_array(this.separate_groups_and_shapes(this.shapes)["shapes"]);
    // this.draw_array(this.sort_shapes(this.shapes));
    this.update_key_info();
    this.update_helpers();

    // draw cursor markers
    if (!this.mouse_is_pressed || this.selected_shapes.length == 0) {
        if (this.arrow_with_end_pointed_by_cursor && this.current_arrow.points == 0) {
            this.draw_circle(this.arrow_with_end_pointed_by_cursor.border_color.to_string(), "white", 4, this.cursor_x, this.cursor_y, 5);
            this.draw_text("click to detach", this.cursor_x+50, this.cursor_y, 14);
        } else if (this.shape_with_border_pointed_by_cursor) {
            this.draw_circle(this.shape_with_border_pointed_by_cursor.border_color.to_string(), "transparent", 0, this.cursor_x, this.cursor_y, 5);
            //draw_text("click to attach", xm+50, ym, 14);
        } else if (this.arrow_with_border_pointed_by_cursor) {
            this.draw_circle(this.arrow_with_border_pointed_by_cursor.border_color.to_string(), "transparent", 0, this.cursor_x, this.cursor_y, 5);
            //draw_text("click to attach", xm+50, ym, 14);
        }
    }
};

CanvasManager.prototype.clear_canvas = function() {
    this.ctx.clearRect(this.offset_x, this.offset_y, this.canvas.width/this.zoom, this.canvas.height/this.zoom);
};

CanvasManager.prototype.draw_array = function(array) {
    for (var i = 0; i < array.length; i++) {
        array[i].draw(this.ctx);
    }
};

CanvasManager.prototype.draw_text = function(text, x, y, size) {
    this.ctx.font = size*this.zoom + "px Calibri";
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "black";
    this.ctx.shadowColor = "white";
    this.ctx.shadowOffsetX = 1;
    this.ctx.shadowOffsetY = 1;
    this.ctx.shadowBlur = 2;
    this.ctx.fillText(text, x, y);
    this.ctx.shadowColor = "transparent";
};

CanvasManager.prototype.draw_circle = function(color, border_color, border_width, x, y, size) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, size, 0, 2 * Math.PI, false);
    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = border_color;
    this.ctx.lineWidth = border_width;
    this.ctx.stroke();
    this.ctx.fill();
};


////////////////////////////
// Canvas overlay objects


CanvasManager.prototype.get_key_object = function(key) {
    var fadeInTime = 0;
    var keys = {
        "backspace": "Undo last point",
        "esc": "Cancel edge",
        "delete": "Remove",
        "ctrl-c": "Copy",
        "ctrl-v": "Paste",
        "ctrl-z": "Undo",
        "ctrl-y": "Redo",
        "ctrl-a": "Select all"
    };
    var object;
    if (key.substring(0,4) == "ctrl") {
        object = '<span class="key-wrap"><icon class="keyboard-key ctrl"></icon><span class="key-info">+</span>' +
            '<icon class="keyboard-key ' + key.substring(5) + '"></icon></span><span class="key-info">' + keys[key] + '</span><br>';
    } else {
        object = '<span class="key-wrap"><icon class="keyboard-key ' + key + '"></icon></span><span class="key-info">' + keys[key] + '</span><br>';
    }
    return $(object).hide().fadeIn(fadeInTime);
};

CanvasManager.prototype.get_helper_object = function(key) {
    var fadeInTime = 0;
    var helpers = {
        "UndoPoint": {
            key: "backspace",
            text: "Undo last point",
            icon: "undo",
            class: 'material-icons',
            func: function() {
                if (canvas_manager.current_arrow.points > 0) {
                    canvas_manager.current_arrow.vertices.pop();
                    canvas_manager.current_arrow.points--;
                    canvas_manager.draw_required = true;
                }
            }},
        "CancelEdge": {
            key: "esc",
            text: "Cancel edge",
            icon: "cancel",
            class: 'material-icons',
            func: function() {
                canvas_manager.reset_current_arrow();
            }},
        "Remove": {
            key: "delete",
            text: "Remove",
            icon: "delete",
            class: 'material-icons',
            func: function() {
                if ($("#removeLayerIcon").hasClass('rotated')) {
                    canvas_manager.remove_selected_shapes();
                    sidebar_manager.hide_remove_layer_button();
                    canvas_manager.draw_required = true;
                }
            }},
        "Copy": {
            key: "ctrl-c",
            text: "Copy",
            icon: "content_copy",
            class: 'material-icons',
            func: function() {
                canvas_manager.show_message("Copied to clipboard");
                canvas_manager.copy_from_clipboard();
                $("#layerName").blur();}
            },
        "Paste": {
            key: "ctrl-v",
            text: "Paste",
            icon: "content_paste",
            class: 'material-icons',
            func: function() {
                canvas_manager.paste_from_clipboard();
            }},
        "Undo": {
            key: "ctrl-z",
            text: "Undo",
            icon: "undo",
            class: 'material-icons',
            func: function() {
                if (canvas_manager.undo()) {
                    canvas_manager.show_message("Undo changes");
                }
            }},
        "Redo": {
            key: "ctrl-y",
            text: "Redo",
            icon: "redo",
            class: 'material-icons',
            func: function() {
                if (canvas_manager.redo()) {
                    canvas_manager.show_message("Redo changes");
                    canvas_manager.highlight_selected_shapes();
                }
            }},
        "SelectAll": {
            key: "ctrl-a",
            text: "Select all",
            icon: "select_all",
            class: 'material-icons',
            func: function() {
                canvas_manager.select_all_shapes();
                sidebar_manager.show_remove_layer_button();
                var selected_shape = canvas_manager.get_primary_selected_shape();
                if (selected_shape) {
                    sidebar_manager.set_layer_name(selected_shape.text);
                }
            }},
        "AlignVertically": {
            key: "ctrl-[",
            text: "Align Vertically",
            icon: "vertical_align_center",
            class: 'material-icons',
            func: function() {
                canvas_manager.align_selected_shapes(false, true);
            }},
        "AlignHorizontally": {
            key: "ctrl-]",
            text: "Align Horizontally",
            icon: "vertical_align_center",
            class: 'material-icons rotated-90',
            func: function() {
                canvas_manager.align_selected_shapes(true, false);
            }},
        "Group": {
            key: "ctrl-g",
            text: "Group",
            icon: "group_work",
            class: 'material-icons',
            func: function() {
                canvas_manager.group_selected_shapes();
            }}
    };
    var object;
    // console.log(key);
    object =
        '<a href="#" style="color: black; background: transparent;">' +
        '<i class="' + helpers[key].class + '" id="' + key + '" style="margin: 10px" title="' + helpers[key].text + '">' + helpers[key].icon + '</i>' +
        '</a>';
    return $(object).hide().fadeIn(fadeInTime).click(function() {helpers[key].func(); canvas_manager.draw_curr_state_if_necessary();});
};

CanvasManager.prototype.update_key_info = function() {
    var keys_container = $("#canvas_keys");
    $(keys_container).empty();
    // // arrow is not currently being created
    // if (this.current_arrow.points > 0) {
    //     $(keys_container).append(this.get_key_object("CancelEdge"));
    //     $(keys_container).append(this.get_key_object("UndoPoint"));
    // } else {
    //     if (this.selected_shapes.length > 0) {
    //         // shape is currently selected
    //         $(keys_container).append(this.get_key_object("Remove"));
    //         $(keys_container).append(this.get_key_object("Copy"));
    //     }
    //     if (this.clipboard.length > 0) {
    //         $(keys_container).append(this.get_key_object("Paste"));
    //     }
    //     if (this.current_timestep > 0) {
    //         $(keys_container).append(this.get_key_object("Undo"));
    //     }
    //     if (this.current_timestep < this.stored_states.length - 1) {
    //         $(keys_container).append(this.get_key_object("Redo"));
    //     }
    //     if (this.shapes.length > 0) {
    //         $(keys_container).append(this.get_key_object("SelectAll"));
    //     }
    // }
};

CanvasManager.prototype.update_helpers = function() {
    var helpers_container = $("#canvas_helpers");
    $(helpers_container).empty();
    if (this.selected_shapes.length > 1) {
        $(helpers_container).append(this.get_helper_object('AlignVertically'));
        $(helpers_container).append(this.get_helper_object('AlignHorizontally'));
        $(helpers_container).append(this.get_helper_object('Group'));
    }
    // arrow is not currently being created
    if (this.current_arrow.points > 0) {
        $(helpers_container).append(this.get_helper_object("CancelEdge"));
        $(helpers_container).append(this.get_helper_object("UndoPoint"));
    } else {
        if (this.selected_shapes.length > 0) {
            // shape is currently selected
            $(helpers_container).append(this.get_helper_object("Remove"));
            $(helpers_container).append(this.get_helper_object("Copy"));
        }
        if (this.clipboard.length > 0) {
            $(helpers_container).append(this.get_helper_object("Paste"));
        }
        if (this.current_timestep > 0) {
            $(helpers_container).append(this.get_helper_object("Undo"));
        }
        if (this.current_timestep < this.stored_states.length - 1) {
            $(helpers_container).append(this.get_helper_object("Redo"));
        }
        if (this.shapes.length > 0) {
            $(helpers_container).append(this.get_helper_object("SelectAll"));
        }
    }
};

///////////////////////////////////////
// State Management

CanvasManager.prototype.curr_state_to_json = function() {
    return JSON.stringify({"shapes": this.shapes, "arrows": this.arrows});
};

CanvasManager.prototype.json_to_curr_state = function(json_state) {
    var state = JSON.parse(json_state);

    this.shapes = state["shapes"];
    this.arrows = state["arrows"];

    this.selected_shapes = [];

    // parse shapes
    for (var s = this.shapes.length-1; s >= 0; s--) {
        var shape = this.shapes[s];
        this.shapes[s] = object_to_shape(shape);
        this.shapes[s].set_layer(shape.layer);
    }

    // parse arrows
    for (var a = this.arrows.length-1; a >= 0; a--) {
        // this is a nasty workaround which should be changed
        var start = false;
        var end = false;
        for (var s = 0; s < this.shapes.length; s++) {
            if (this.arrows[a].linkStart.shape.key == this.shapes[s].key) {
                start = this.shapes[s];
            } else if (this.arrows[a].linkEnd.shape.key == this.shapes[s].key) {
                end = this.shapes[s];
            }
        }
        for (var i = 0; i < this.arrows.length; i++) {
            if (this.arrows[a].linkStart.shape.key == this.arrows[i].key) {
                start = this.arrows[i];
            } else if (this.arrows[a].linkEnd.shape.key == this.arrows[i].key) {
                end = this.arrows[i];
            }
        }
        this.arrows[a] = new Line(this.arrows[a], start, end);
    }

    // parse groups
    for (var s = this.shapes.length-1; s >= 0; s--) {
        var group = this.shapes[s];
        if (group.type == "Group") {
            for (var i = 0; i < group.shapes.length; i++) {
                var shape_idx = this.get_shape_index_in_list(this.shapes, group.shapes[i]);
                if (shape_idx != -1) {
                    group.shapes[i] = this.shapes[shape_idx];
                }
            }
        }
    }

};

CanvasManager.prototype.save_state = function() {
    // save the state of the designer in the buffer
    var current_state = this.curr_state_to_json();
    if (current_state != this.stored_states[this.current_timestep]) {
        this.current_timestep += 1;
        this.stored_states[this.current_timestep] = current_state;
    }
};

CanvasManager.prototype.load_state = function(state) {
    // load the given state to the designer
    this.json_to_curr_state(state);

    this.draw_required = true;
    this.draw_curr_state_if_necessary();
};


CanvasManager.prototype.undo = function() {
    // undo changes
    if (this.current_timestep > 0) {
        this.current_timestep -= 1;
        this.load_state(this.stored_states[this.current_timestep]);
        return true;
    }
    return false;
};


CanvasManager.prototype.redo = function () {
    // redo changes
    if (this.current_timestep < this.stored_states.length-1) {
        this.current_timestep += 1;
        this.load_state(this.stored_states[this.current_timestep]);
        return true;
    }
    return false;
};

//////////////////////////////////
// Shape & arrow editing

CanvasManager.prototype.remove_all_arrows_separating_border = function() {
    var i;
    for (i = 0; i < this.arrows.length; i++) {
        this.arrows[i].draw_separating_border = false;
    }
};

CanvasManager.prototype.add_all_arrows_separating_border = function() {
    var i;
    for (i = 0; i < this.arrows.length; i++) {
        this.arrows[i].draw_separating_border = true;
    }
};

CanvasManager.prototype.reset_current_arrow = function() {
    this.current_arrow = new Line([], 5, new Color(0, 0, 0, 1), 3);
};


CanvasManager.prototype.get_shape_index_in_list = function(shapes_list, shape) {
    var i;
    for (i = 0; i < shapes_list.length; i++) {
        if (shapes_list[i].key == shape.key) {
            return i;
        }
    }
    return -1;
};

CanvasManager.prototype.get_arrow_index = function(arrow) {
    var i;
    for (i = 0; i < this.arrows.length; i++) {
        if (this.arrows[i].key == arrow.key) {
            return i;
        }
    }
    return -1;
};

CanvasManager.prototype.get_object_with_pointed_border = function() {
    // returns a shape which has a border with the cursor over it. prioritizes shapes over arrows.
    var shape = false;
    if (this.shape_with_border_pointed_by_cursor) {
        shape = this.shape_with_border_pointed_by_cursor;
    } else if (this.arrow_with_border_pointed_by_cursor) {
        shape = this.arrow_with_border_pointed_by_cursor;
    }
    return shape;
};

CanvasManager.prototype.extend_current_arrow = function() {
    var shape = this.get_object_with_pointed_border();

    if (this.current_arrow.points > 0) {
        // extend current arrow
        this.current_arrow.points++;
    }
    if (this.arrow_with_end_pointed_by_cursor) {
        // detach pointed arrow
        this.current_arrow = this.arrow_with_end_pointed_by_cursor;
        this.arrows.splice(this.get_arrow_index(this.arrow_with_end_pointed_by_cursor), 1);
        this.current_arrow.points--;
        this.arrow_with_end_pointed_by_cursor = false;

        this.draw_required = true;
    } else if (shape) {
        // start a new line
        var line_points = shape.pointer_is_on_the_border_line(this.cursor_x, this.cursor_y, this.ctx);
        line_points.shape = shape;

        var point = new Vertex(this.cursor_x, this.cursor_y, 0);
        if (this.current_arrow.points == 0) {
            // start a new line
            this.current_arrow.start_line(point, shape.border_color, line_points);
        } else {
            // make sure the line is not linked to itself
            if (!(this.current_arrow.shapes_are_linked([shape])[0]) || this.current_arrow.linkStart.shape.type != "Line") {
                this.current_arrow.end_line(point, line_points);
                this.arrows.push(this.current_arrow);
                this.current_arrow = new Line([], 5, new Color(0, 0, 0, 1), 3);
            }
        }
        this.reset_selected_shapes();

        this.draw_required = true;
    }

};

CanvasManager.prototype.get_shape_color_idx = function(shape) {
    for (var i = 0; i < border_colors.length; i++) {
        if (border_colors[i].to_string() == shape.border_color.to_string()) {
            return i;
        }
    }
    return 0;
};

CanvasManager.prototype.add_shape = function(shape) {
    this.shapes.push(shape);
    this.select_shape(shape);
};

CanvasManager.prototype.move_shapes_with_alignment = function(shapes, diff_x, diff_y) {
    var i;
    // move shapes
    for (i = 0; i < shapes.length; i++) {
        // align to nearest center
        var shape_center = shapes[i].get_center();
        var nearest_center = this.nearest_shape_center(shape_center);
        if (Math.abs(nearest_center.dist_x) >= this.snap_threshold && Math.abs(-nearest_center.dist_x + diff_x) < this.snap_threshold) {
            diff_x = nearest_center.dist_x;
        } else if (Math.abs(nearest_center.dist_x) < this.snap_threshold && Math.abs(diff_x) < this.snap_threshold) {
            diff_x = 0;
        }
        if (Math.abs(nearest_center.dist_y) >= this.snap_threshold && Math.abs(-nearest_center.dist_y + diff_y) < this.snap_threshold) {
            diff_y = nearest_center.dist_y;
        } else if (Math.abs(nearest_center.dist_y) < this.snap_threshold && Math.abs(diff_y) < this.snap_threshold) {
            diff_y = 0;
        }
    }
    this.move_shapes(shapes, diff_x, diff_y);
    return {x: diff_x, y: diff_y};
};

CanvasManager.prototype.move_shapes = function(shapes, diff_x, diff_y) {
    var moved_shapes = [];
    var i;
    // move shapes
    for (i = 0; i < shapes.length; i++) {
        shapes[i].translate(diff_x, diff_y);
        moved_shapes.push(shapes[i]);
    }
    for (i = 0; i < this.arrows.length; i++) {
        moved_shapes.push(this.arrows[i]);
    }
    for (i = 0; i < this.arrows.length; i++) {
        this.arrows[i].linked_shapes_moved(diff_x, diff_y, moved_shapes);
    }
    this.draw_required = true;
};

CanvasManager.prototype.show_message = function(msg, slow) {
    var fade_out_time = 500;
    if (slow) {
        fade_out_time = 1000;
    }

    var canvas_overlay = $("#canvas_overlay");
    $(canvas_overlay).find("h1").text(msg);
    $(canvas_overlay).stop();
    $(canvas_overlay).fadeIn(30);
    $(canvas_overlay).fadeOut(fade_out_time);
};


CanvasManager.prototype.update_shape_name = function() {
    sidebar_manager.layer_name_changed_manually = true;
    var selected_shape = canvas_manager.get_primary_selected_shape();
    if (selected_shape) {
        selected_shape.update_text($("#layerName").val());
        groups = this.separate_groups_and_shapes(this.shapes)['groups'];
        for (var g = 0; g < groups.length; g++) {
            // update all groups that include this shape
            var shape_index = this.get_shape_index_in_list(groups[g].shapes, selected_shape);
            if (shape_index != -1) {
                groups[g].update();
            }
        }
        canvas_manager.draw_required = true;
        canvas_manager.draw_curr_state_if_necessary();
    }
};

CanvasManager.prototype.show_full_details = function(checked) {
    groups = this.separate_groups_and_shapes(this.shapes)['groups'];
    for (var s = 0; s < this.selected_shapes.length; s++) {
        if (checked) {
            this.selected_shapes[s].full();
        } else {
            this.selected_shapes[s].partial();
        }
        for (var g = 0; g < groups.length; g++) {
            // update all groups that include this shape
            var shape_index = this.get_shape_index_in_list(groups[g].shapes, this.selected_shapes[s]);
            if (shape_index != -1) {
                groups[g].update();
            }
        }
    }
    for (var i = 0; i < this.arrows.length; i++) {
        this.arrows[i].linked_shapes_moved(0, 0, this.selected_shapes);
    }
    this.draw_required = true;
    this.draw_curr_state_if_necessary();
};



CanvasManager.prototype.nearest_shape_center = function(p) {
    var unselected_shapes = this.get_unselected_shapes();
    var dist_x = Infinity;
    var dist_y = Infinity;
    for (var i = 0; i < unselected_shapes.length; i++) {
        var shape_center = unselected_shapes[i].get_center();
        if (Math.abs(p.x - shape_center.x) < Math.abs(dist_x)) {
            dist_x = p.x - shape_center.x;
        }
        if (Math.abs(p.y - shape_center.y) < Math.abs(dist_y)) {
            dist_y = p.y - shape_center.y;
        }
    }
    return {dist_x: -dist_x, dist_y: -dist_y};
};


CanvasManager.prototype.get_bounding_box_over_shapes = function(shapes) {
    var min_x = this.canvas.width;
    var max_x = 0;
    var min_y = this.canvas.height;
    var max_y = 0;
    for (var s = 0; s < shapes.length; s++) {
        for (var v = 0; v < shapes[s].vertices.length; v++) {
            if (shapes[s].vertices[v].x < min_x) {
                min_x = shapes[s].vertices[v].x;
            }
            if (shapes[s].vertices[v].x > max_x) {
                max_x = shapes[s].vertices[v].x;
            }
            if (shapes[s].vertices[v].y < min_y) {
                min_y = shapes[s].vertices[v].y;
            }
            if (shapes[s].vertices[v].y > max_y) {
                max_y = shapes[s].vertices[v].y;
            }
        }
    }
    return {min_x: min_x, max_x: max_x, min_y: min_y, max_y: max_y};
};


CanvasManager.prototype.get_bounding_box_over_all_shapes = function() {
    return this.get_bounding_box_over_shapes(this.shapes.concat(this.arrows));
};

//////////////////////////////
// Naming

CanvasManager.prototype.count_layers_with_type = function(type, subtype) {
    var counter = 0;
    for (var i = 0; i < this.shapes.length; i++) {
        if (this.shapes[i].layer.type == type && this.shapes[i].layer.subtype == subtype) {
            counter += 1;
        }
    }
    return counter;
};

CanvasManager.prototype.layer_name_is_in_use = function(name) {
    for (var i = 0; i < this.shapes.length; i++) {
        if (this.shapes[i].name == name) {
            return true;
        }
    }
    return false;
};

/////////////////////////////
//  Building the graph

CanvasManager.prototype.find_connected_arrows = function(shapes) {
    var i;
    var connected_arrows = [];
    for (i = 0; i < this.arrows.length; i++) {
        var arrow = this.arrows[i];
        var result = arrow.shapes_are_linked(shapes);
        if (result[0] || result[1]) {
            connected_arrows.push(arrow);
        }
    }
    return connected_arrows;
};


CanvasManager.prototype.find_preceding_arrows = function(shapes) {
    var i;
    var connected_arrows = [];
    for (i = 0; i < this.arrows.length; i++) {
        var arrow = this.arrows[i];
        var result = arrow.shapes_are_linked(shapes);
        if (result[1]) {
            connected_arrows.push(arrow);
        }
    }
    return connected_arrows;
};

CanvasManager.prototype.find_preceding_shapes = function(shape) {
    var i;
    var preceding_shapes = [];
    var preceding_arrows = [];
    // get all preceding arrows
    var temp_preceding_arrows = this.find_preceding_arrows([shape]);
    while (temp_preceding_arrows.length > 0) {
        for (i = 0; i < temp_preceding_arrows.length; i++) {
            preceding_arrows.push(temp_preceding_arrows[i]);
        }
        temp_preceding_arrows = this.find_preceding_arrows(temp_preceding_arrows);
    }

    // get all preceding shapes
    for (i = 0; i < preceding_arrows.length; i++) {
        var arrow = preceding_arrows[i];
        var result = arrow.shapes_are_linked(this.shapes);
        if (result[0] && result[0].type != "Line") {
            preceding_shapes.push(result[0]);
        }
    }

    return preceding_shapes;
};

CanvasManager.prototype.to_graph = function() {
    var i;
    var j;
    var graph = {};
    for (i = 0; i < this.shapes.length; i++) {
        var shape = this.shapes[i];
        shape.layer.name = shape.name; // first time setting the layer name
        graph[shape.name] = shape.layer;
        graph[shape.name].input_layers = [];
        var preceding_shapes = this.find_preceding_shapes(shape);
        for (j = 0; j < preceding_shapes.length; j++) {
            graph[shape.name].input_layers.push(preceding_shapes[j].name);
        }
    }
    return graph;
};



///////////////////////////////
// Experiments

CanvasManager.prototype.rotate_selected_shape = function() {
    var finished = false;
    for (var s = this.selected_shapes.length - 1; s >= 0; s--) {
        finished |= this.selected_shapes[s].rotate();
    }
    this.draw_required = true;
    this.draw_curr_state_if_necessary();
    if (finished) {
        clearInterval(this.animationIntervalId);
    }
};