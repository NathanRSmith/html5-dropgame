var CellModel = Backbone.Model.extend({
    defaults: { 'visited':  false },
    getColorString: function(colormap) { return colormap[this.get('color')] },
    matches: function(cell) { try { return this.get('color') == cell.get('color'); } catch(e) { return false; } },
    isVisited: function() { return this.get('visited'); },
    updateCellAddr: function(row, col) {
        this.set('row', row);
        this.set('col', col);
    }
});

var DropGameMatrix = Backbone.Collection.extend({
    modelClass: CellModel,
    initialize: function(options) {
        this.height = options.height;
        this.width = options.width;
        this.numColors = options.numColors;
        this._generateRandomMatrix();
    },
    _generateRandomMatrix: function() {
        var mat = new Array(this.height)
        for(var i=0; i<this.height; i++) {
            mat[i] = new Array(this.width);
            for(var j=0; j<this.width; j++) {
                mat[i][j] = this._generateRandomCell(i, j);
            }
        }
        this._matrix = mat;
    },
    generateMatrix: function(matrix) {
        var mat = new Array(this.height)
        for(var i=0; i<this.height; i++) {
            mat[i] = new Array(this.width);
            for(var j=0; j<this.width; j++) {
                mat[i][j] = new this.modelClass({row: i, col: j, color: matrix[i][j]});
            }
        }
        this._matrix = mat;
    },
    _generateRandomCell: function(row, col) {
        return new this.modelClass({
            color: _.random(0, this.numColors-1),
            row: row,
            col: col
        });
    },
    getHeight: function() { return this.height; },
    getWidth: function() { return this.width; },
    at: function(row, col) { try { return this._matrix[row][col]; } catch(e) { return undefined; } },
    setAddr: function(row, col, val) {
        this._matrix[row][col] = val;
    },
    selectCell: function(row, col) {
        // remove cell in group (if more than one)
        var count = this._removeGroup(this.at(row, col));

        console.log(count);
        // apply gravities
        this._applyGravity();
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
        if( cell && !cell.isVisited() ) {
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
    _applyRightGravity: function() {
        // check if any column is empty, if so, shift to the right
        // go from right to left
        for(var j=this.getWidth()-1; j>=1; j--) {   // columns, but not first
            if( this._isColumnEmpty(j) ) {

                // search for next non-empty column
                var offset = -1;
                for(var x=j-1; x>=0; x--) {
                    if( !this._isColumnEmpty(x) ) {
                        offset = x;
                        break;
                    }
                }

                // move columns over
                for(var x=offset; x>=0; x--) {
                    for(var i=0; i<this.getHeight(); i++ ) {
                        if( this.at(i, x) ) {
                            this.setAddr(i, j-offset+x, this.at(i, x));
                            this.at(i, j-offset+x).updateCellAddr(i, j-offset+x);
                            this.setAddr(i, x, null);
                        }
                    }
                }
            }
        }
    },
    _isColumnEmpty: function(col) {
        var empty = true;
        for(var i=0; i<this.getHeight(); i++) {
            if( this.at(i, col) != null ) {
                empty = false;
                break;
            }
        }
        return empty;
    },
    _applyDownGravity: function() {
        // iterate from bottom up
        // if cell is null, move column down until filled
        for(var i=this.getHeight()-1; i>=0; i--) {
            for(var j=0; j<this.getWidth(); j++) {
                if( this.at(i,j) == null ) {

                    // look up and find next filled cell
                    var offset = -1;
                    for(var y=i-1; y>=0; y--) {
                        if( this.at(y,j) != null ) {
                            offset = y;
                            break;
                        }
                    }

                    // move column down
                    for(var y=offset; y>=0; y--) {
                        if( this.at(y, j) ) {
                            this.setAddr(i-offset+y, j, this.at(y, j));
                            this.at(i-offset+y, j).updateCellAddr(i-offset+y, j);
                            this.setAddr(y, j, null);
                        }
                    }

                }
            }
        }
    },
    printMatrix: function() {
        for(var i=0; i<this.getHeight(); i++) {
            var l = [];
            for(var j=0; j<this.getWidth(); j++) {
                if(this.at(i,j))
                    l.push(this.at(i,j).get('color'));
                else
                    l.push('n');
            }
            console.log(l.join(', '));
        }
    },
    printVisited: function() {
        for(var i=0; i<this.getHeight(); i++) {
            var l = [];
            for(var j=0; j<this.getWidth(); j++) {
                if(this.at(i,j))
                    l.push(boolToInt(this.at(i,j).get('visited')));
                else
                    l.push('n');
            }
            console.log(l.join(', '));
        }
    }
});
