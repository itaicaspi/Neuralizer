/**
 * Created by Itai Caspi on 26/07/2016.
 */

function object_to_layer(obj) {
    var layer;
    if (obj.subtype != "") {
        layer = new window[obj.subtype](obj);
    } else {
        layer = new window[obj.type](obj);
    }
    return layer;
}


var inheritsFrom = function (child, parent) {
    child.prototype = Object.create(parent.prototype);
    child.prototype.constructor = child;
};

var Layer = function() {
    this.output =  new Tensor(1,1,1);
    this.weight = new Tensor();
    this.type = "Layer";
    this.subtype = "";
    this.description = "";
    this.name = "";
};

Layer.prototype.updateOutputSize = function() {
    this.output = this.input.clone();
};

Layer.prototype.updateWeightSize = function() {
};

Layer.prototype.setInput = function(inputTensor) {
    this.input = inputTensor;
    this.updateOutputSize();
    this.updateWeightSize();
};

Layer.prototype.toKeras = function() {
    // returns a list of code lines
    return {
        dependencies: {},
        code: [""]
    };
};

////////////////////////////////////////
//  DataPlaceholder

var DataPlaceholder = function(width, height, depth) {
    if (height == undefined) {
        // copy constructor
        var layer = width;
        assign(this, layer);
        this.output = new Tensor(layer.output);
    } else {
        Layer.call(this);
        this.output = new Tensor(width,height,depth);
    }
    this.type = "DataPlaceholder";
    this.description = this.output.width + "x" + this.output.height + "x" + this.output.depth;
};

inheritsFrom(DataPlaceholder, Layer);

DataPlaceholder.prototype.toKeras = function(input_layers) {
    if (input_layers.length == 0) {
        return {
            dependencies: {},
            code: ["Input(shape=(" + this.output.width + "," + this.output.height + "," + this.output.depth + "))"]
        };
    } else {
        var input = input_layers[0];
        return {
            dependencies: {},
            code: [this.name + " = Lambda(lambda x: x + 0)(" + input + ")"]
        };
    }
};

////////////////////////////////////////
//  Convolution

var Convolution = function(outputDepth, kernelWidth, kernelHeight, strideX, strideY, padX, padY, dilationX, dilationY) {
    if (kernelWidth == undefined) {
        // copy constructor
        var layer = outputDepth;
        assign(this, layer);
        this.output = new Tensor(layer.output);
    } else {
        Layer.call(this);
        this.output = new Tensor(1,1,outputDepth);
        this.kernelWidth = kernelWidth;
        this.kernelHeight = kernelHeight;
        this.strideX = strideX;
        this.strideY = strideY;
        this.padX = padX;
        this.padY = padY;
        this.dilationX = (dilationX != undefined) ? dilationX : 1;
        this.dilationY = (dilationY != undefined) ? dilationY : 1;
    }
    this.type = "Convolution";
    this.description = "Kernel " + this.kernelHeight + "x" + this.kernelWidth + " Stride " + this.strideX + " OFMs " + this.output.depth;
};

inheritsFrom(Convolution, Layer);

Convolution.prototype.updateOutputSize = function() {
    this.output.width = Math.floor((this.input.width + 2*this.padX - this.kernelWidth) / this.strideX + 1);
    this.output.height = Math.floor((this.input.height + 2*this.padY - this.kernelHeight) / this.strideY + 1);
};

Convolution.prototype.toBox = function(center, color) {
    var outputCenter = new Vertex(center.x, center.y, center.z);
    return this.output.toBox(outputCenter, color);
};

Convolution.prototype.toKeras = function(input_layers) {
    var input = input_layers[0];
    if (this.dilationX > 1) {
        // dilated convolution
        return {
            dependencies: {library: "keras.layers.convolutional", classes: ["AtrousConvolution2D"]},
            code: [this.name + " = AtrousConvolution2D(" + this.output.depth + "," + this.kernelWidth + "," + this.kernelHeight
                    + ", atrous_rate=(" + this.dilationX + "," + this.dilationY + ")"
                    + ", subsample=(" + this.strideX + "," + this.strideY + "))(" + input + ")"]
        };
    } else {
        return {
            dependencies: {library: "keras.layers.convolutional", classes: ["Convolution2D"]},
            code: [this.name + " = Convolution2D(" + this.output.depth + "," + this.kernelWidth + "," + this.kernelHeight
            + ", subsample=(" + this.strideX + "," + this.strideY + "))(" + input + ")"]
        };
    }
};

////////////////////////////////////////
//  Inner Product

var InnerProduct = function(outputDepth) {
    if (typeof outputDepth == "object") {
        // copy constructor
        assign(this, outputDepth);
    } else {
        Layer.call(this);
        this.output.width = 1;
        this.output.height = 1;
        this.output.depth = outputDepth;
        this.type = "InnerProduct";
    }
};

InnerProduct.prototype.updateOutputSize = function() {
};

inheritsFrom(InnerProduct, Layer);

InnerProduct.prototype.toKeras = function(input_layers) {
    var input = input_layers[0];
    var dense_input = input + "_flatten";
    return {
        dependencies: {library: "keras.layers.core", classes: ["Dense", "Flatten"]},
        code: [dense_input + " = Flatten()(" + input + ")",
            this.name + " = Dense(" + this.output.depth + ")(" + dense_input + ")"]
    };
};

////////////////////////////////////////
//  Pooling

var Pooling = function(kernelWidth, kernelHeight, strideX, strideY, padX, padY) {
    if (typeof kernelWidth == "object") {
        // copy constructor
        assign(this, kernelWidth);
    } else {
        Layer.call(this);
        this.kernelWidth = kernelWidth;
        this.kernelHeight = kernelHeight;
        this.strideX = strideX;
        this.strideY = strideY;
        this.padX = padX; // TODO: change the padding to same or valid
        this.padY = padY;
        this.type = "Pooling";
        this.description = "Kernel " + this.kernelHeight + "x" + this.kernelWidth + " Stride " + this.strideX;
    }
};

inheritsFrom(Pooling, Layer);

Pooling.prototype.updateOutputSize = function() {
    this.output.width = Math.floor((this.input.width + 2*this.padX - this.kernelWidth) / this.strideX + 1);
    this.output.height = Math.floor((this.input.height + 2*this.padY - this.kernelHeight) / this.strideY + 1);
};

////////////////////////////////////////
//  Max Pooling

var MaxPooling = function(kernelWidth, kernelHeight, strideX, strideY, padX, padY) {
    Pooling.call(this, kernelWidth, kernelHeight, strideX, strideY, padX, padY);
    this.subtype = "MaxPooling";
};

inheritsFrom(MaxPooling, Pooling);

MaxPooling.prototype.toKeras = function(input_layers) {
    var input = input_layers[0];

    return {
        dependencies: {library: "keras.layers.pooling", classes: ["MaxPooling2D"]},
        code: [this.name + " = MaxPooling2D(pool_size=(" + this.kernelWidth + "," + this.kernelHeight
               + "), strides=(" + this.strideX + "," + this.strideY + "))(" + input + ")"]
    };
};

////////////////////////////////////////
//  Average Pooling

var AveragePooling = function(kernelWidth, kernelHeight, strideX, strideY, padX, padY) {
    Pooling.call(this, kernelWidth, kernelHeight, strideX, strideY, padX, padY);
    this.subtype = "AveragePooling";
};

inheritsFrom(AveragePooling, Pooling);

AveragePooling.prototype.toKeras = function(input_layers) {
    var input = input_layers[0];

    return {
        dependencies: {library: "keras.layers.pooling", classes: ["AveragePooling2D"]},
        code: [this.name + " = AveragePooling2D(pool_size=(" + this.kernelWidth + "," + this.kernelHeight + "), strides=(" + this.strideX + "," + this.strideY + "))(" + input + ")"]
    };
};

////////////////////////////////////////
//  Stochastic Pooling

var StochasticPooling = function(kernelWidth, kernelHeight, strideX, strideY, padX, padY) {
    Pooling.call(this, kernelWidth, kernelHeight, strideX, strideY, padX, padY);
    this.subtype = "StochasticPooling";
};

inheritsFrom(StochasticPooling, Pooling);

////////////////////////////////////////
//  Deconvolution

var Deconvolution = function(numOutputs, kernelWidth, kernelHeight, strideX, strideY, padX, padY, pooling_type) {
    if (typeof numOutputs == "object") {
        // copy constructor
        assign(this, numOutputs);
    } else {
        Layer.call(this);
        this.kernelWidth = kernelWidth;
        this.kernelHeight = kernelHeight;
        this.strideX = strideX;
        this.strideY = strideY;
        this.padX = padX;
        this.padY = padY;
        this.type = "Deconvolution";
        this.description = "Kernel " + this.kernelHeight + "x" + this.kernelWidth + " Stride " + this.strideX;
    }
};

inheritsFrom(Deconvolution, Layer);

Deconvolution.prototype.updateOutputSize = function() {
    this.output.width = (this.input.width - 1)*this.strideX - 2*this.padX + this.kernelWidth;
    this.output.height = (this.input.height - 1)*this.strideY - 2*this.padY + this.kernelHeight;
};

Deconvolution.prototype.toKeras = function(input_layers) {
    var input = input_layers[0];

    return {
        dependencies: {library: "keras.layers.convolutional", classes: ["Deconvolution2D"]},
        code: [this.name + " = Deconvolution2D(" + this.output.depth + "," + this.kernelWidth + "," + this.kernelHeight
        + ", subsample=(" + this.strideX + "," + this.strideY + "))(" + input + ")"]
    };

};

////////////////////////////////////////
//  DataManipulation

var DataManipulationLayer = function() {
    Layer.call(this);
    this.type = "DataManipulation";
};

inheritsFrom(DataManipulationLayer, Layer);

////////////////////////////////////////
//  Concatenate

var Concatenate = function() {
    DataManipulationLayer.call(this);
    this.subtype = "Concatenate";
};

inheritsFrom(Concatenate, DataManipulationLayer);

////////////////////////////////////////
//  Reshape

var Reshape = function() {
    DataManipulationLayer.call(this);
    this.subtype = "Reshape";
};

inheritsFrom(Reshape, DataManipulationLayer);

////////////////////////////////////////
//  Flatten

var Flatten = function() {
    DataManipulationLayer.call(this);
    this.subtype = "Flatten";
};

inheritsFrom(Flatten, DataManipulationLayer);

////////////////////////////////////////
//  Permute

var Permute = function() {
    DataManipulationLayer.call(this);
    this.subtype = "Permute";
};

inheritsFrom(Permute, DataManipulationLayer);

////////////////////////////////////////
//  Repeat

var Repeat = function() {
    DataManipulationLayer.call(this);
    this.subtype = "Repeat";
};

inheritsFrom(Repeat, DataManipulationLayer);

////////////////////////////////////////
//  Normalization Layer

var NormalizationLayer = function() {
    Layer.call(this);
    this.type = "Normalization";
};

inheritsFrom(NormalizationLayer, Layer);

////////////////////////////////////////
//  Local Response Normalization

var LRN = function(numNeighbours, k, alpha, beta) {
    if (typeof numNeighbours == "object") {
        // copy constructor
        assign(this, numNeighbours);
    } else {
        NormalizationLayer.call(this);
        this.numNeighbours = numNeighbours;
        this.k = k;
        this.alpha = alpha;
        this.beta = beta;
        this.subtype = "LRN";
        this.description = "α " + this.alpha + " β " + this.beta + " K " + this.k;
    }
};

inheritsFrom(LRN, NormalizationLayer);


////////////////////////////////////////
//  Batch Normalization

var BatchNormalization = function() {
    NormalizationLayer.call(this);
    this.subtype = "BatchNormalization";
};

inheritsFrom(BatchNormalization, NormalizationLayer);

////////////////////////////////////////
//  L2 Normalization

var L2Normalization = function() {
    NormalizationLayer.call(this);
    this.subtype = "L2Normalization";
};

inheritsFrom(L2Normalization, NormalizationLayer);


////////////////////////////////////////
//  Activatrion

var ActivationLayer = function() {
    Layer.call(this);
    this.type = "Activation";
};

inheritsFrom(ActivationLayer, Layer);

////////////////////////////////////////
//  ReLU

var ReLU = function() {
    ActivationLayer.call(this);
    this.subtype = "ReLU";
};

inheritsFrom(ReLU, ActivationLayer);

////////////////////////////////////////
//  Sigmoid

var Sigmoid = function() {
    ActivationLayer.call(this);
    this.subtype = "Sigmoid";
};

inheritsFrom(Sigmoid, ActivationLayer);

////////////////////////////////////////
//  TanH

var TanH = function() {
    ActivationLayer.call(this);
    this.subtype = "TanH";
};

inheritsFrom(TanH, ActivationLayer);


////////////////////////////////////////
//  ELU

var ELU = function() {
    ActivationLayer.call(this);
    this.subtype = "ELU";
};

inheritsFrom(ELU, ActivationLayer);


////////////////////////////////////////
//  HardSigmoid

var HardSigmoid = function() {
    ActivationLayer.call(this);
    this.subtype = "HardSigmoid";
};

inheritsFrom(HardSigmoid, ActivationLayer);


////////////////////////////////////////
//  Regularization

var RegularizationLayer = function() {
    Layer.call(this);
    this.type = "Regularization";
};

inheritsFrom(RegularizationLayer, Layer);

////////////////////////////////////////
//  Dropout

var Dropout = function(keepProbability) {
    RegularizationLayer.call(this);
    this.keepProbability = keepProbability;
    this.subtype = "Dropout";
};

inheritsFrom(Dropout, RegularizationLayer);

////////////////////////////////////////
//  Maxout

var Maxout = function() {
    RegularizationLayer.call(this);
    this.subtype = "Maxout";
};

inheritsFrom(Maxout, RegularizationLayer);


////////////////////////////////////////
//  DropConnect

var DropConnect = function() {
    RegularizationLayer.call(this);
    this.subtype = "DropConnect";
};

inheritsFrom(DropConnect, RegularizationLayer);


////////////////////////////////////////
//  Zoneout

var Zoneout = function() {
    RegularizationLayer.call(this);
    this.subtype = "Zoneout";
};

inheritsFrom(Zoneout, RegularizationLayer);


////////////////////////////////////////
//  Element-Wise

var ElementWiseLayer = function() {
    Layer.call(this);
    this.type = "ElementWise";
};

inheritsFrom(ElementWiseLayer, Layer);

////////////////////////////////////////
//  Add

var Add = function() {
    ElementWiseLayer.call(this);
    this.subtype = "Add";
};

inheritsFrom(Add, ElementWiseLayer);

////////////////////////////////////////
//  Multiply

var Multiply = function() {
    ElementWiseLayer.call(this);
    this.subtype = "Multiply";
};

inheritsFrom(Multiply, ElementWiseLayer);

///////////////////////////////////////
// Sequential

var Sequential = function() {
    this.layers = [];
    this.type = "Sequential";
};

Sequential.prototype.push = function(layer) {
    if (layer.type != "Arrow") {
        if (this.layers.length == 1) {
            layer.setInput(this.layers[this.layers.length - 1]);
        } else if (this.layers.length > 1) {
            var back = 1;
            while (this.layers[this.layers.length - back].type != "Convolution") back++;
            layer.setInput(this.layers[this.layers.length - back].output);
        }
    }
    this.layers.push(layer);
};

Sequential.prototype.toObjects = function(center, color, alignment) {
    var currentCenter = center;
    var currentColor = color;
    var objects = [];
    var minPos = 9999;
    if (alignment) {
        for (var i = 0; i < this.layers.length; i++) {
            var layer = this.layers[i];
            while (this.layers.type == "Sequential") {
                // TODO: this deals only with first layer in the sequential net
                layer = layers[0];
            }
            if (layer.height < minPos) minPos = layer.height;
        }
    }
    for (var i = 0; i < this.layers.length; i++) {
        if (this.layers[i].type == "Convolution" || this.layers[i].type == "Tensor") {
            currentCenter = currentCenter.add(new Vertex(i > 0 ? this.layers[i].output.depth/2 + 25 : 0, 0, 0));
            // align objects to top or bottom
            if (alignment == "bottom" && i > 0) currentCenter.z = -(minPos - this.layers[i].output.height)/2;
            if (alignment == "top" && i > 0) currentCenter.z = (minPos - this.layers[i].output.height)/2;
            objects.push(this.layers[i].toBox(currentCenter, currentColor));
            currentColor = nextColor(currentColor);
            currentCenter = currentCenter.add(new Vertex(i == 0 ? this.layers[i].depth/2 : this.layers[i].output.depth/2, 0, 0));
        } else if (this.layers[i].type == "Arrow") {
            currentCenter = currentCenter.add(new Vertex(15, 0, 0));
            var end = currentCenter.add(new Vertex(70,0,0));
            objects.push(new Arrow(currentCenter, end));
            currentCenter = end;
        }
    }

    return objects;
};
