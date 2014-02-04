if( !Modernizr.canvas ) {
    alert('HTML5 Canvas elements are not supported in your browser and you will not be able to play this game.\n' +
            'Please try another browser such as Chrome or Firefox.')
}

$(document).ready(function() {
    game = new DropGameFullCanvasView({el: '#dropgame_canvas'});
    movesLeftView = new MovesLeftView();
    newGameBtnView = new NewGameBtnView({el: '.new-game'});
    scoreView = new ScoreView();
    blocksLeftView = new BlocksLeftView();
    gameTimeView = new GameTimeView();
    summaryView = new SummaryView();
    statisticsView = new StatisticsView({localstorage: Modernizr.localstorage});
    showStatisticsBtnView = new ShowStatisticsBtnView({el: '.show-statistics'});
    helpView = new HelpView();
    showHelpBtnView = new ShowHeltBtnView();
});