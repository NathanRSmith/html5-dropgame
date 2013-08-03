/**
 * Event Dispatcher
 *
 * Events:
 *     * moveMade returns number removed
 *     * gameOver
 *
 */
dispatcher = _.extend({}, Backbone.Events);


var MovesLeftView = Backbone.View.extend({
    el: '#moves_left',
    initialize: function() {
        this.listenTo(dispatcher, 'moveMade', this.moveCallback);
        this.render( game.collection.countMovesLeft() );
    },
    moveCallback: function(move) {
        this.render(move.get('moves'));
    },
    render: function(moves) {
        this.$el.html(moves+' moves left');
    }
});


//var MoveLogView = Backbone.View.extend({
//    el: '#move_log',
//    entryViews: [],
//    collection: new Backbone.Collection(),
//    initialize: function(options) {
//        this.listenTo(dispatcher, 'moveMade', this.addEntry)
//    },
//    addEntry: function(move) {
//        this.collection.add([move]);
//        var view = new MoveEntryView({model: move});
//        this.$el.prepend(view.$el);
//    }
//});
//var MoveEntryView = Backbone.View.extend({
//    initialize: function(options) { this.render() },
//    render: function() {
//        var $el = $('<li/>', {
//            html: 'Clicked: '+this.model.get('x')+', '+this.model.get('y')+'.'+
//                ' Cell: '+this.model.get('row')+', '+this.model.get('col')+'.'+
//                ' Removed: '+this.model.get('count')
//        });
//        this.setElement($el);
//    }
//});



// TODO Add knowledge of canvas padding
var DropGameCanvasView = Backbone.View.extend({
    _backgroundColor: '#000',
    _gameMatrixClass: DropGameMatrix,
    _rows: 10,
    _cols: 10,
    _NUM_COLORS: 5,
    _COLOR_MAP: [
        'blue',
        'red',
        'green',
        'orange',
        'purple'
    ],
    _CELL_HEIGHT: 25,
    _CELL_WIDTH: 25,
    _CELL_PADDING: 2,
    _CANVAS_PADDING: 0,
    DEBUG_MATRIX: [
        [0,0,1],
        [2,1,1],
        [1,0,0]
    ],
    events: {
        'click': '_clickHandler'
    },
    initialize: function(options) {
        this._rows = options.rows || this._rows;
        this._cols = options.cols || this._cols;
        this._NUM_COLORS = options.numColors || this._NUM_COLORS;

        // initialize game model
        this.collection = new this._gameMatrixClass({
            height: this._rows,
            width: this._cols,
            numColors: this._NUM_COLORS
        });

        this.listenTo(dispatcher, 'gameOver', this.gameOverHandler);

        // configure canvas and draw
        this._initializeCanvas();
        this.draw();
    },
    _clickHandler: function(e) {
        var pos = getMousePos(this.el, e);
        var cellAddr = this.getCellAddressFromXY(pos.x, pos.y);
        console.log(pos, cellAddr);
        var removed = this.collection.selectCell(cellAddr.row, cellAddr.col);
        this.draw();

        var moves = this.collection.countMovesLeft();
        dispatcher.trigger('moveMade', new Backbone.Model({
            x: pos.x, y: pos.y,
            row: cellAddr.row, col: cellAddr.col,
            removed: removed,
            moves: moves,
        }));
        if( moves == 0 ) {
            dispatcher.trigger('gameOver');
        }
    },
    gameOverHandler: function() {
        alert('Game Over!');
    },
    getCellAddressFromXY: function(x, y) {
        return {
            col: Math.floor(x / (this._calculateCellWidth())),
            row: Math.floor(y / (this._calculateCellHeight()))
        }
    },
    draw: function() {
        this._drawBackground();
        this._drawGameMatrix();
    },
    _initializeCanvas: function() {
        var csize = this._calculateCanvasSize();
        this.$el.attr('height', csize[0]);
        this.$el.attr('width', csize[1]);
    },
    _calculateCanvasSize: function() {
        var height = this._rows*this._calculateCellHeight();
        var width = this._cols*this._calculateCellWidth();
        return [height, width];
    },
    _calculateCellHeight: function() { return this._CELL_HEIGHT + 2*this._CELL_PADDING; },
    _calculateCellWidth: function() { return this._CELL_WIDTH + 2*this._CELL_PADDING; },
    _drawBackground: function() {
        this.$el.drawRect({
          fillStyle: this._backgroundColor,
          x: 0, y: 0,
          width: this.$el.width(),
          height: this.$el.height(),
          fromCenter: false
        });
    },
    _drawGameMatrix: function() {
        for(var i=0; i<this._rows; i++) {
            for(var j=0; j<this._rows; j++) {
                var y = i*this._calculateCellHeight();
                var x = j*this._calculateCellWidth();
                this._drawCell(y, x, this.collection.at(i, j));
            }
        }
    },
    _drawCell: function(y, x, cell) {
        if( cell ){
            this.$el.drawRect({
                fillStyle: cell.getColorString(this._COLOR_MAP),
                x: x+this._CELL_PADDING, y: y+this._CELL_PADDING,
                width: this._CELL_WIDTH, height: this._CELL_HEIGHT,
                fromCenter: false
            });
        }
    },
    printColors: function() {
        console.log(this._COLOR_MAP.join(', '));
    }
});