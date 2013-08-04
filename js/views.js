/**
 * Event Dispatcher
 *
 * Events:
 *     * moveMade returns number removed
 *     * gameOver
 *     * newGame
 *     * preNewGame
 *
 */
dispatcher = _.extend({}, Backbone.Events);


var ScoreView = Backbone.View.extend({
    el: '#score',
    score: 0,
//    coeff: 10,
    initialize: function(options) {
        this.listenTo(dispatcher, 'moveMade', this.moveHandler);
        this.listenTo(dispatcher, 'newGame', this.resetScore);

        this.render();
    },
    render: function() {
        this.$el.html('Score: '+this.score+' points');
    },
    moveHandler: function(move) {
        var value = this.computeMoveScore(move.get('removed'));
        this.updateScore(value);
        this.render();
    },
    // Move score is: n*(n-1)
    computeMoveScore: function(n) {
        return n*(n-1);
    },
    updateScore: function(value) {
        this.score += value;
        this.render();
    },
    resetScore: function() {
        this.score = 0;
        this.render();
    }
});


var NewGameBtnView = Backbone.View.extend({
    el: '#new_game',
    events: {
        'click': 'btnClicked'
    },
    btnClicked: function(e) {
        dispatcher.trigger('preNewGame');
    }
});

var MovesLeftView = Backbone.View.extend({
    el: '#moves_left',
    initialize: function() {
        this.listenTo(dispatcher, 'moveMade', this.moveCallback);
        this.listenTo(dispatcher, 'newGame', this.newGameCallback);
        this.render( game.collection.countMovesLeft() );
    },
    newGameCallback: function() {
        this.render( game.collection.countMovesLeft() );
    },
    moveCallback: function(move) {
        this.render(move.get('moves'));
    },
    render: function(moves) {
        this.$el.html(moves+' moves left');
    }
});

var BlocksLeftView = Backbone.View.extend({
    el: '#blocks_left',
    initialize: function() {
        this.listenTo(dispatcher, 'moveMade', this.countAndRender);
        this.listenTo(dispatcher, 'newGame', this.countAndRender);
        this.countAndRender();
    },
    countAndRender: function() {
        this.render( game.collection.countCellsLeft() );
    },
    render: function(cells) {
        this.$el.html(cells+' blocks left');
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
        this.listenTo(dispatcher, 'preNewGame', this.newGameHandler);

        // configure canvas and draw
        this._initializeCanvas();
        this.draw();
    },
    _clickHandler: function(e) {
        var pos = getMousePos(this.el, e);
        var cellAddr = this.getCellAddressFromXY(pos.x, pos.y);
        console.log(pos, cellAddr);
        if( cellAddr ) {
            var removed = this.collection.selectCell(cellAddr.row, cellAddr.col);
            this.draw();

            var moves = this.collection.countMovesLeft();
            dispatcher.trigger('moveMade', new Backbone.Model({
                x: pos.x, y: pos.y,
                row: cellAddr.row, col: cellAddr.col,
                removed: removed,
                moves: moves
            }));
            if( moves == 0 ) {
                dispatcher.trigger('gameOver');
            }
        }
    },
    newGameHandler: function() {
        this.collection.generateRandomMatrix();
        this._initializeCanvas();
        this.draw();

        dispatcher.trigger('newGame');
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

var DropGameFullCanvasView = DropGameCanvasView.extend({
    el: '#dropgame_canvas',
    _initializeCanvas: function() {
        // determine cell size based on canvas size
        this.$el[0].height = this.$el.parent().height();
        this.$el[0].width = this.$el.parent().width();
        var canvasHeight = this.$el.height();
        var canvasWidth = this.$el.width();
        var cheight = this._calculateInitialCellHeight(canvasHeight);
        var cwidth = this._calculateInitialCellWidth(canvasWidth);
        var csize = Math.min(cheight, cwidth);
        this._CELL_HEIGHT = csize;
        this._CELL_WIDTH = csize;
        var size = this._calculateCanvasSize(); // h, w
        var padh = Math.round((canvasHeight - size[0]) / 2);
        var padw = Math.round((canvasWidth - size[1]) / 2);

        // set canvas offsets for where to start looking for click events (BBOX)
        this.BBOX = {
            miny: canvasHeight - size[0],
            maxy: this.$el.height(),
            minx: padw,
            maxx: this.$el.height() - padw
        }
    },
    _calculateInitialCellHeight: function(height) {
        // solve for cell height based on number of cells and padding size
        // h/rows - 2p
        return Math.floor( (height / this._rows) - 2*this._CELL_PADDING);
    },
    _calculateInitialCellWidth: function(width) {
        // solve for cell height based on number of cells and padding size
        // h/rows - 2p
        return Math.floor( (width / this._cols) - 2*this._CELL_PADDING);
    },
    _drawGameMatrix: function() {
        for(var i=0; i<this._rows; i++) {
            for(var j=0; j<this._rows; j++) {
                var y = i*this._calculateCellHeight() + this.BBOX.miny;
                var x = j*this._calculateCellWidth() + this.BBOX.minx;
                this._drawCell(y, x, this.collection.at(i, j));
            }
        }
    },
    getCellAddressFromXY: function(x, y) {
        if( this._withinBBOX(x, y) ) {
            return {
                col: Math.floor((x-this.BBOX.minx) / (this._calculateCellWidth())),
                row: Math.floor((y-this.BBOX.miny) / (this._calculateCellHeight()))
            }
        }
        return null;
    },
    _withinBBOX: function(x, y) {
        if( x > this.BBOX.minx &&
            x < this.BBOX.maxx &&
            y > this.BBOX.miny &&
            y < this.BBOX.maxy ) {

            return true;
        }
        return false;
    }
})