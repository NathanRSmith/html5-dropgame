var CellModel = Backbone.Model.extend({
    defaults: { 'visited':  false },
    getColorString: function(colormap) { return colormap[this.get('color')] },
    matches: function(cell) { try { return this.get('color') == cell.get('color'); } catch(e) { return false; } },
    isVisited: function() { return this.get('visited'); }
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
                mat[i][j] = this._generateCell(i, j);
            }
        }
        this._matrix = mat;
    },
    _generateCell: function(row, col) {
        return new this.modelClass({
            color: _.random(0, this.numColors-1),
            row: row,
            col: col
        });
    },
    getHeight: function() { return this.height; },
    getWidth: function() { return this.width; },
    at: function(row, col) { try { return this._matrix[row][col]; } catch(e) { return undefined; } },
    selectCell: function(row, col) {
        // remove cell in group (if more than one)
        this._removeGroup(this.at(row, col));
        // apply gravities
        this._applyGravity()
        this._resetAllVisited();
    },      // TODO
    _removeGroup: function(cell) {
        var that = this;
        var count = 0;
        this._resetAllVisited();
        if( this._visitGroup(cell) == true ) {
            this.each(function(val) {
                if( val && val.isVisited() ) {
                    that.removeCell(val);
                    count++;
                }
            });
        }
        return count;
    },
    countMovesLeft: function() {
        var that = this;
        this._resetAllVisited();
        var count = 0;
        // count groups of two or more
        // for each cell, if it has not been visited, call adjacent matching cells until none remain in group
        this.each(function(cell) {
            if( that._visitGroup(cell) == true ) {
                count++;
            }
        });

        this._resetAllVisited();
        return count;
    },
    _visitGroup: function(cell) {
        if( !cell.isVisited() ) {
            var row = cell.get('row');
            var col = cell.get('col');
            cell.set('visited', true);
            var n = this._cellHasAdjacent(cell);
            if( n == true ) {
                var c;
                c = this.at(row, col-1);
                if( c && !c.isVisited() && cell.matches(c) ) { this._visitGroup(c); }
                c = this.at(row-1, col);
                if( c && !c.isVisited() && cell.matches(c) ) { this._visitGroup(c); }
                c = this.at(row, col+1);
                if( c && !c.isVisited() && cell.matches(c) ) { this._visitGroup(c); }
                c = this.at(row+1, col);
                if( c && !c.isVisited() && cell.matches(c) ) { this._visitGroup(c); }
            }
            return n;
        }
    },
    _resetAllVisited: function() {
        this.each(function(cell) {
            if(cell) { cell.set('visited', false); }
        });
    },
    each: function(callback) {
        for(var i=0; i<this.getHeight(); i++) {
            for(var j=0; j<this.getWidth(); j++) {
                callback(this.at(i,j), [i,j], this.collection);
            }
        }
    },
    removeCell: function(cell) {
        this._matrix[cell.get('row')][cell.get('col')] = null;
    },
    _cellHasAdjacent: function(cell) {
        var row = cell.get('row');
        var col = cell.get('col');
        // check all directions
        if( cell.matches(this.at(row, col-1)) ) { return true; }
        if( cell.matches(this.at(row-1, col)) ) { return true; }
        if( cell.matches(this.at(row, col+1)) ) { return true; }
        if( cell.matches(this.at(row+1, col)) ) { return true; }
        return false;
    },
    _hasAdjacent: function(row, col) {
        return this._cellHasAdjacent( this.at(row, col) );
    },
    _applyGravity: function() {
        this._applyDownGravity();
        this._applyRightGravity();
    },
    _applyRightGravity: function() {},      // TODO
    _applyDownGravity: function() {
        // iterate from bottom up
        // if cell is null, move column down until filled
        
    },       // TODO
});
