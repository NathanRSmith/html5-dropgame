/**
 * Event Dispatcher
 *
 * Events:
 *     * moveMade returns number removed
 *     * gameOver
 *     * preGameOver
 *     * postGameOver
 *     * newGame
 *     * preNewGame
 *
 */
dispatcher = _.extend({}, Backbone.Events);

var SummaryView = Backbone.View.extend({
    el: '#game_summary',
    time: null,
    totalMoves: null,
    blocksLeft: null,
    score: null,
    scorePenalty: null,
    totalScore: null,
    initialize: function(options) {
        this.listenTo(dispatcher, 'postGameOver', this.gameOverHandler);
        this.listenTo(dispatcher, 'newGame', this.newGameHandler);
    },
    gameOverHandler: function() {
        this.$('.game-time').html( this.fetchTime() );
        this.$('.total-moves').html( this.fetchMoves() );
        this.$('.blocks-left').html( this.fetchBlocksLeft() );
        this.$('.score').html( this.fetchScore() );
        this.$('.score-penalty').html( this.fetchScorePenalty() );
        this.$('.total-score').html( this.fetchTotalScore() );
        this.show();
    },
    fetchTime: function() {
        this.time = gameTimeView.getTime();
        return gameTimeView.getTimeString();
    },
    fetchMoves: function() {
        this.totalMoves = game.totalMoves;
        return this.totalMoves;
    },
    fetchBlocksLeft: function() {
        this.blocksLeft = game.collection.countCells();
        return this.blocksLeft;
    },
    fetchScore: function() {
        this.score = scoreView.getScore();
        return this.score;
    },
    fetchScorePenalty: function() {
        this.scorePenalty = scoreView.calculateScorePenalty(this.blocksLeft);
        return this.scorePenalty;
    },
    fetchTotalScore: function() {
        this.totalScore = this.score - this.scorePenalty;
        return this.totalScore;
    },
    newGameHandler: function() { this.hide(); },
    show: function() { this.$el.show(); },
    hide: function() { this.$el.hide(); }
});

var GameTimeView = Backbone.View.extend({
    el: '#game_time',
    timer: null,
    refresh: 1000,
    time: 0,            // in sec
    starttime: null,    // in sec
    initialize: function(options) {
        this.listenTo(dispatcher, 'preGameOver', this.stopTimer);
        this.listenTo(dispatcher, 'newGame', this.startTimer);
        this.startTimer();
    },
    render: function() {
        this.$el.html(this.getTimeString());
    },
    getTime: function() { return this.time; },
    getTimeString: function(time) {
        time = time || this.time;
        var min = parseInt( time / (60) );
        var sec = parseInt( time % (60) );
        return this._getIntTimeString(min)+':'+this._getIntTimeString(sec)
    },
    _getIntTimeString: function(n) {
        var s = n.toString();
        if(s.length == 1) {
            return '0'+s;
        }
        return s;
    },
    startTimer: function() {
        var that = this;
        this.starttime = Date.now();
        this.time = 0;
        this.timer = setInterval(function() {
            that.timeEventHandler();
        }, this.refresh);
        this.render();
    },
    timeEventHandler: function() {
        this.time = parseInt( (Date.now() - this.starttime) / 1000 );
        this.render();
    },
    stopTimer: function() {
        this.time = parseInt( (Date.now() - this.starttime) / 1000 );
        clearInterval(this.timer);
        this.render();
    }
});

var ScoreView = Backbone.View.extend({
    el: '#score',
    score: 0,
    scorePenalty: 0,
//    coeff: 10,
    initialize: function(options) {
        this.listenTo(dispatcher, 'moveMade', this.moveHandler);
        this.listenTo(dispatcher, 'newGame', this.resetScore);

        this.render();
    },
    render: function() {
        this.$el.html('Score: '+this.score);
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
    },
    getScore: function() {
        return this.score;
    },
    // penalty is 10*n
    calculateScorePenalty: function(blocksLeft) {
        this.scorePenalty = 10*blocksLeft;
        return this.scorePenalty;
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
        this.render( game.collection.countGroups() );
    },
    newGameCallback: function() {
        this.render( game.collection.countGroups() );
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
        this.render( game.collection.countCells() );
    },
    render: function(cells) {
        this.$el.html(cells+' blocks left');
    }
});


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
    gameOver: false,
    totalMoves: 0,
    events: {
        'click': '_clickHandler'
    },
    initialize: function(options) {
        this.subclassPreInitialize(options);
        this._rows = options.rows || this._rows;
        this._cols = options.cols || this._cols;
        this._NUM_COLORS = options.numColors || this._NUM_COLORS;

        // initialize game model
        this.collection = new this._gameMatrixClass({
            height: this._rows,
            width: this._cols,
            numColors: this._NUM_COLORS
        });

        this.listenTo(dispatcher, 'preNewGame', this.newGameHandler);

        // configure canvas and draw
        this._initializeCanvas();
        this.draw();
        this.subclassPostInitialize(options);
    },
    subclassPreInitialize: function() {},
    subclassPostInitialize: function() {},
    _clickHandler: function(e) {
        if( this.gameOver == false ) {
            var pos = getMousePos(this.el, e);
            var cellAddr = this.getCellAddressFromXY(pos.x, pos.y);
            console.log(pos, cellAddr);
            if( cellAddr ) {
                var removed = this.collection.selectCell(cellAddr.row, cellAddr.col);
                this.draw();

                var moves = this.collection.countGroups();
                this.totalMoves++;
                dispatcher.trigger('moveMade', new Backbone.Model({
                    x: pos.x, y: pos.y,
                    row: cellAddr.row, col: cellAddr.col,
                    removed: removed,
                    moves: moves
                }));
                if( moves == 0 ) {
                    this.gameOver = true;
                    dispatcher.trigger('preGameOver');
                    dispatcher.trigger('gameOver');
                    dispatcher.trigger('postGameOver');
                }
            }
        }
    },
    newGameHandler: function() {
        this.totalMoves = 0;
        this.gameOver = false;
        this.collection.generateRandomMatrix();
        this._initializeCanvas();
        this.draw();

        dispatcher.trigger('newGame');
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
    subclassPostInitialize: function(options) {
        var that = this;
        $(window).resize(function(e) { that.resizeHandler(e); });
    },
    resizeTimeout: null,
    resizeHandler: function(e) {
        var that = this;
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(function() {
            that._initializeCanvas();
            that.draw();
        }, 100);
    },
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
            maxx: this.$el.width() - padw
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