/**
 * Created by Itai Caspi on 26/07/2016.
 */

var Layer = function() {
    this.output =  new Tensor();
    this.weight = new Tensor();
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

////////////////////////////////////////
//  Convolution

var Convolution = function(outputDepth, kernelWidth, kernelHeight, strideX, strideY, padX, padY) {
    Layer.call();
    this.output.depth = outputDepth;
    this.kernelWidth = kernelWidth;
    this.kernelHeight = kernelHeight;
    this.strideX = strideX;
    this.strideY = strideY;
    this.padX = padX;
    this.padY = padY;
    this.type = "Convolution";
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

////////////////////////////////////////
//  Inner Product

var InnerProduct = function(outputDepth) {
    Layer.call();
    this.output.width = 1;
    this.output.height = 1;
    this.output.depth = outputDepth;
    this.type = "InnerProduct";
};

InnerProduct.prototype.updateOutputSize = function() {
};

inheritsFrom(InnerProduct, Layer);

////////////////////////////////////////
//  Pooling

var Pooling = function(kernelWidth, kernelHeight, strideX, strideY, padX, padY, poolingType) {
    Layer.call();
    this.kernelWidth = kernelWidth;
    this.kernelHeight = kernelHeight;
    this.strideX = strideX;
    this.strideY = strideY;
    this.padX = padX;
    this.padY = padY;
    this.poolingType = poolingType;
    this.type = "Pooling";
};

inheritsFrom(Pooling, Layer);

Pooling.prototype.updateOutputSize = function() {
    this.output.width = Math.floor((this.input.width + 2*this.padX - this.kernelWidth) / this.strideX + 1);
    this.output.height = Math.floor((this.input.height + 2*this.padY - this.kernelHeight) / this.strideY + 1);
};

////////////////////////////////////////
//  Deconvolution

var Deconvolution = function(numOutputs, kernelWidth, kernelHeight, strideX, strideY, padX, padY, pooling_type) {
    Layer.call();
    this.kernelWidth = kernelWidth;
    this.kernelHeight = kernelHeight;
    this.strideX = strideX;
    this.strideY = strideY;
    this.padX = padX;
    this.padY = padY;
    this.type = "Deconvolution";
};

inheritsFrom(Deconvolution, Layer);

Deconvolution.prototype.updateOutputSize = function() {
    this.output.width = (this.input.width - 1)*this.strideX - 2*this.padX + this.kernelWidth;
    this.output.height = (this.input.height - 1)*this.strideY - 2*this.padY + this.kernelHeight;
};


////////////////////////////////////////
//  Concatenate

var Concatenate = function() {
    Layer.call();
};

inheritsFrom(Concatenate, Layer);




////////////////////////////////////////
//  Normalization Layer

var NormalizationLayer = function() {
    Layer.call();
};

inheritsFrom(NormalizationLayer, Layer);

////////////////////////////////////////
//  Local Response Normalization

var LRN = function(numNeighbours, k, alpha, beta) {
    NormalizationLayer.call();
    this.numNeighbours = numNeighbours;
    this.k = k;
    this.alpha = alpha;
    this.beta = beta;
};

inheritsFrom(LRN, NormalizationLayer);


////////////////////////////////////////
//  Batch Normalization

var BatchNormalization = function() {
    NormalizationLayer.call();
};

inheritsFrom(BatchNormalization, NormalizationLayer);


////////////////////////////////////////
//  Regularization

var RegularizationLayer = function() {
    Layer.call();
};

inheritsFrom(RegularizationLayer, Layer);

////////////////////////////////////////
//  Dropout

var Dropout = function(keepProbability) {
    RegularizationLayer.call();
    this.keepProbability = keepProbability;
};

inheritsFrom(Dropout, RegularizationLayer);

////////////////////////////////////////
//  Maxout

var Maxout = function() {
    RegularizationLayer.call();
};

inheritsFrom(Maxout, RegularizationLayer);


////////////////////////////////////////
//  DropConnect

var DropConnect = function() {
    RegularizationLayer.call();
};

inheritsFrom(DropConnect, RegularizationLayer);


////////////////////////////////////////
//  Zoneout

var Zoneout = function() {
    RegularizationLayer.call();
};

inheritsFrom(Zoneout, RegularizationLayer);

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