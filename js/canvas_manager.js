/**
 * Created by icaspi on 1/30/2017.
 */


var CanvasManager = function(canvas) {
    this.canvas = canvas;
    this.fix_canvas_size(canvas);
    this.ctx = this.canvas.getContext('2d');

    // shapes
    this.shapes = [];
    this.arrows = [];
    this.current_arrow = new Line([], 5, new Color(0, 0, 0, 1), 3);
    this.snap_threshold = 10;

    // canvas selection
    this.selection_box = new Rectangle(0, 0, 0, 0, 2, 0, 2, "", new Color(0, 0, 0, 0), new Color(100, 100, 100, 1), true);
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
    this.draw_required = false;
};

CanvasManager.prototype.fix_canvas_size = function(canvas) {
    this.canvas = canvas;
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
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
            this.shapes.push(copiedObject);
            this.selected_shapes.push(copiedObject);
        } else {
            this.arrows.push(copiedObject);
        }
    }
    this.save_state();
    this.draw_required = true;
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
    this.cursor_diff_x = x - this.canvas.getBoundingClientRect().left - this.cursor_x;
    this.cursor_diff_y = y - this.canvas.getBoundingClientRect().top - this.cursor_y;
    this.cursor_x = x - this.canvas.getBoundingClientRect().left;
    this.cursor_y = y - this.canvas.getBoundingClientRect().top;
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
    this.highlight_selected_shapes();
};

CanvasManager.prototype.update_selected_shapes_from_selection_box = function() {
    // update the selected shapes from the selection box position
    if (Math.abs(this.selection_box.width) < 10 || Math.abs(this.selection_box.height) < 10) return;

    this.selected_shapes = [];
    for (var i = 0; i < this.shapes.length; i++) {
        var shape = this.shapes[i];
        var left_check = shape.x > this.selection_box.x;
        var top_check = shape.y > this.selection_box.y;
        var right_check = shape.x + shape.width < this.selection_box.x + this.selection_box.width;
        var bottom_check = shape.y + shape.height < this.selection_box.y + this.selection_box.height;
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
    }

    this.save_state();
    this.draw_required = true;
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
    for (var s = this.selected_shapes.length - 1; s >= 0; s--) {
        var shape_index = this.get_shape_index(this.selected_shapes[s]);
        this.shapes.splice(shape_index, 1);
        this.selected_shapes.splice(s, 1);
    }
    this.draw_required = true;
};


CanvasManager.prototype.move_selected_shapes = function() {
    var diff_used = this.move_shapes_with_alignment(this.selected_shapes, this.cursor_diff_x + this.cursor_accum_x, this.cursor_diff_y + this.cursor_accum_y);
    this.cursor_accum_x = (this.cursor_diff_x + this.cursor_accum_x - diff_used.x);
    this.cursor_accum_y = (this.cursor_diff_y + this.cursor_accum_y - diff_used.y);
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
    this.reset_selected_shapes();
    this.draw_required = true;
};

CanvasManager.prototype.set_selection_box = function() {
    this.selection_box.width = this.cursor_x - this.selection_box.x;
    this.selection_box.height = this.cursor_y - this.selection_box.y;
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

CanvasManager.prototype.draw_curr_state = function() {
    this.clear_canvas();

    // draw everything
    this.draw_array(this.shapes);
    this.draw_array(this.arrows);
    this.selection_box.draw(this.ctx);
    this.current_arrow.draw(this.ctx);
    this.update_key_info();

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
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
};

CanvasManager.prototype.draw_array = function(array) {
    for (var i = 0; i < array.length; i++) {
        array[i].draw(this.ctx);
    }
};

CanvasManager.prototype.draw_text = function(text, x, y, size) {
    this.ctx.font = size + "px Calibri";
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

CanvasManager.prototype.update_key_info = function() {
    var keys_container = $("#canvas_keys");
    $(keys_container).empty();
    // arrow is not currently being created
    if (this.current_arrow.points > 0) {
        $(keys_container).append(this.get_key_object("esc"));
        $(keys_container).append(this.get_key_object("backspace"));
    } else {
        if (this.selected_shapes.length > 0) {
            // shape is currently selected
            $(keys_container).append(this.get_key_object("delete"));
            $(keys_container).append(this.get_key_object("ctrl-c"));
        }
        if (this.clipboard.length > 0) {
            $(keys_container).append(this.get_key_object("ctrl-v"));
        }
        if (this.current_timestep > 0) {
            $(keys_container).append(this.get_key_object("ctrl-z"));
        }
        if (this.current_timestep < this.stored_states.length - 1) {
            $(keys_container).append(this.get_key_object("ctrl-y"));
        }
        if (this.shapes.length > 0) {
            $(keys_container).append(this.get_key_object("ctrl-a"));
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
        if (shape.type == "Rectangle") {
            this.shapes[s] = new Rectangle(shape);
        } else if (shape.type == "Triangle") {
            this.shapes[s] = new Triangle(shape);
        } else if (shape.type == "Circle") {
            this.shapes[s] = new Circle(shape);
        }
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

CanvasManager.prototype.reset_current_arrow = function() {
    this.current_arrow = new Line([], 5, new Color(0, 0, 0, 1), 3);
};


CanvasManager.prototype.get_shape_index = function(shape) {
    var i;
    for (i = 0; i < this.shapes.length; i++) {
        if (this.shapes[i].key == shape.key) {
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


CanvasManager.prototype.show_full_details = function(checked) {
    for (var s = 0; s < this.selected_shapes.length; s++) {
        if (checked) {
            this.selected_shapes[s].full();
        } else {
            this.selected_shapes[s].partial();
        }
    }
    for (var i = 0; i < this.arrows.length; i++) {
        this.arrows[i].linked_shapes_moved(0, 0, this.selected_shapes);
    }
    this.draw_required = true;
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


CanvasManager.prototype.get_bounding_box_over_all_shapes = function() {
    var min_x = this.canvas.width;
    var max_x = 0;
    var min_y = this.canvas.height;
    var max_y = 0;
    for (var s = 0; s < this.shapes.length; s++) {
        for (var v = 0; v < this.shapes[s].vertices.length; v++) {
            if (this.shapes[s].vertices[v].x < min_x) {
                min_x = this.shapes[s].vertices[v].x;
            }
            if (this.shapes[s].vertices[v].x > max_x) {
                max_x = this.shapes[s].vertices[v].x;
            }
            if (this.shapes[s].vertices[v].y < min_y) {
                min_y = this.shapes[s].vertices[v].y;
            }
            if (this.shapes[s].vertices[v].y > max_y) {
                max_y = this.shapes[s].vertices[v].y;
            }
        }
    }
    for (var s = 0; s < this.arrows.length; s++) {
        for (var v = 0; v < this.arrows[s].vertices.length; v++) {
            if (this.arrows[s].vertices[v].x < min_x) {
                min_x = this.arrows[s].vertices[v].x;
            }
            if (this.arrows[s].vertices[v].x > max_x) {
                max_x = this.arrows[s].vertices[v].x;
            }
            if (this.arrows[s].vertices[v].y < min_y) {
                min_y = this.arrows[s].vertices[v].y;
            }
            if (this.arrows[s].vertices[v].y > max_y) {
                max_y = this.arrows[s].vertices[v].y;
            }
        }
    }
    return {min_x: min_x, max_x: max_x, min_y: min_y, max_y: max_y};
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
        var arrow = this.arrows[i];
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
        graph[shape.key] = shape.layer;
        graph[shape.key].input_layers = [];
        var preceding_shapes = this.find_preceding_shapes(shape);
        for (j = 0; j < preceding_shapes.length; j++) {
            graph[shape.key].input_layers.push(preceding_shapes[j].key);
        }
    }
    return graph;
};
