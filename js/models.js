var CellModel = Backbone.Model.extend({
    getColorString: function(colormap) { return colormap[this.color] },
});

var DropGameMatrix = Backbone.Collection.extend({
    modelClass: CellModel,
    initialize: function(options) {
        this.height = options.height;
        this.width = options.width;
        this.numColors = options.numColors;
        this._generateMatrix();
    },
    _generateMatrix: function() {
        var mat = new Array(this.height)
        for(var i=0; i<this.height; i++) {
            mat[i] = new Array(this.width);
            for(var j=0; j<this.width; j++) {
                mat[i][j] = this._generateCell();
            }
        }
        this._matrix = mat;
    },
    _generateCell: function() {
        return new this.modelClass( {color: _.random(0, this.numColors-1)} );
    },
    getHeight: function() { return this.height; },
    getWidth: function() {return this.width; },
    at: function(row, col) { return this._matrix[row][col]; },
    selectCell: function(row, col) {},      // TODO
    _hasAdjacent: function(row, col) {
        // check left
        // check top
        // check right
        // check bottom
    },
    _applyGravity: function() {},           // TODO
    _applyRightGravity: function() {},      // TODO
    _applyDownGravity: function() {},       // TODO
});
