function assertCellAttrsMatch(cell, attr) {
    var matches = true;
    _.each(attr, function(val, key) {
        if(cell.get(key) != val){ matches = false; }
    });

    return matches;
}
function assertMatricesMatch(mat1, mat2) {
    var matches = true;
    if( mat1.getHeight() != mat2.getHeight() ) { matches = false; }
    if( mat1.getWidth() != mat2.getWidth() ) { matches = false; }
    for(var i=0; i<mat1.getHeight(); i++) {
        for(var j=0; j<mat1.getWidth(); j++) {
            var cell1 = mat1.at(i,j);
            var cell2 = mat2.at(i,j);
            if( cell1 && cell2 ) {
                if( cell1.get('color') != cell2.get('color') ) { matches = false; }
            } else if( cell1 != cell2 ) { matches = false; }
        }
    }

    return matches;
}
function assertMatrixMatchesArray(mat1, arr) {
    var matches = true;
    if( mat1.getHeight() != arr.length ) { matches = false; }
    if( mat1.getWidth() != arr[0].length ) { matches = false; }
    for(var i=0; i<mat1.getHeight(); i++) {
        for(var j=0; j<mat1.getWidth(); j++) {
            var cell1 = mat1.at(i,j);
            if(cell1 != null) {
                if( cell1.get('color') != arr[i][j] ) { matches = false; }
            } else if( arr[i][j] != null ) { matches = false; }
        }
    }

    return matches;
}

test('assertCellAttrsMatch', function() {
    var cell = new CellModel({
        row: 0,
        col: 0,
        color: 0
    });
    ok( assertCellAttrsMatch(cell, {
        row: 0,
        col: 0,
        color: 0
    }) );
    ok( !assertCellAttrsMatch(cell, {
        row: 0,
        col: 0,
        color: 1
    }) );
});
test('assertMatricesMatch', function() {
    var m1 = [[1, 0], [0, 1]];
    var m2 = [[0, 0], [0, 1]];

    var mat1 = new DropGameMatrix({height: 2, width: 2, numColors: 2 });
    mat1.generateMatrix(m1);
    var mat2 = new DropGameMatrix({height: 2, width: 2, numColors: 2 });
    mat2.generateMatrix(m1);

    ok( assertMatricesMatch(mat1, mat2) );
    mat2.generateMatrix(m2);
    ok( !assertMatricesMatch(mat1, mat2) );

    mat1.setAddr(0,0,null);
    ok( !assertMatricesMatch(mat1, mat2) );
    mat2.setAddr(0,0,null);
    ok( assertMatricesMatch(mat1, mat2) );
});

module('CellModel');
test('getColorString', function() {
    var cell = new CellModel({ color: 0 });
    var colorMap = ['black', 'white'];
    equal(cell.getColorString(colorMap), 'black');
    cell.set('color', 1);
    equal(cell.getColorString(colorMap), 'white');
});
test('matches', function() {
    var cell1 = new CellModel({ color: 0 });
    var cell2 = new CellModel({ color: 0 });
    ok( cell1.matches(cell2) );
    cell2.set('color', 1);
    ok( !cell1.matches(cell2) );
});
test('isVisited', function() {
    var cell = new CellModel();
    ok( !cell.isVisited() );
    cell.set('visited', true);
    ok( cell.isVisited() );
});
test('updateCellAddr', function() {
    var cell = new CellModel({ row: 0, col: 0 });
    ok( assertCellAttrsMatch(cell, {row: 0, col: 0}) );
    cell.updateCellAddr(1, 2);
    ok( assertCellAttrsMatch(cell, {row: 1, col: 2}) );
});


module('MatrixCollection');
test('at', function() {
    var mat = new DropGameMatrix({
        height: 4,
        width: 4,
        numColors: 5,
    });

    equal( mat.at(0,0), mat._matrix[0][0] );
});
test('getHeight', function() {
    var mat = new DropGameMatrix({height: 2, width: 3, numColors: 1});
    equal( mat.getHeight(), 2 );
});
test('getWidth', function() {
    var mat = new DropGameMatrix({height: 2, width: 3, numColors: 1});
    equal( mat.getWidth(), 3 );
});
test('setAddr', function() {
    var mat = new DropGameMatrix({height: 2, width: 2, numColors: 1});
    ok( mat.at(0,0) );
    mat.setAddr(0,0,null);
    equal( mat.at(0,0), null);
    var cell = new CellModel();
    mat.setAddr(0,0,cell);
    equal( mat.at(0,0), cell);
});
test('generateRandomMatrix', function() {
    var mat1 = new DropGameMatrix({height: 2, width: 2, numColors: 2 });
    mat1.generateRandomMatrix();
    var mat2 = new DropGameMatrix({height: 2, width: 2, numColors: 2 });
    mat2.generateRandomMatrix();

    ok( !assertMatricesMatch(mat1, mat2) );
});
test('generateMatrix', function() {
    var m = [[1,0], [0,1]];
    var mat1 = new DropGameMatrix({height: 2, width: 2, numColors: 2 });
    mat1.generateMatrix(m);

    ok( assertMatrixMatchesArray(mat1, m) );
});
test('_generateRandomCell', function() {
    var mat = new DropGameMatrix({height: 2, width: 2, numColors: 1});
    var cell = mat._generateRandomCell(0, 0);
    ok( assertCellAttrsMatch(cell, {row: 0, col: 0}) );
    ok( cell.get('color') != undefined );
});
test('selectCell', function() {
    var m = [[1,0], [0,0]];
    var mat = new DropGameMatrix({height: 2, width: 2, numColors: 2 });
    mat.generateMatrix(m);

    equal( mat.selectCell(0,0), 0 );
    ok( assertMatrixMatchesArray(mat, m) );
    equal( mat.selectCell(0,1), 3 );
    ok( assertMatrixMatchesArray(mat, [[null, null], [null, 1]]) );
});
test('_removeGroup', function() {
    var m = [[1,0], [1,1]];
    var mat = new DropGameMatrix({height: 2, width: 2, numColors: 2 });
    mat.generateMatrix(m);

    mat._removeGroup( mat.at(0,0) );
    ok( assertMatrixMatchesArray(mat, [[null, 0], [null, null]]) );
});
test('countCellsLeft', function() {
    var mat = new DropGameMatrix({height: 2, width: 2, numColors: 2 });
    equal( mat.countCellsLeft(), 4 );
    mat.setAddr(0,0,null);
    equal( mat.countCellsLeft(), 3 );
    mat.setAddr(0,1,null);
    equal( mat.countCellsLeft(), 2 );
    mat.setAddr(1,0,null);
    equal( mat.countCellsLeft(), 1 );
    mat.setAddr(1,1,null);
    equal( mat.countCellsLeft(), 0 );
});
test('countMovesLeft', function() {
    var m = [[0,0], [1,1]];
    var mat = new DropGameMatrix({height: 2, width: 2, numColors: 2 });
    mat.generateMatrix(m);
    equal( mat.countMovesLeft(), 2 );

    var m = [[1,0], [1,1]];
    mat.generateMatrix(m);
    equal( mat.countMovesLeft(), 1 );

    var m = [[1,0], [0,1]];
    mat.generateMatrix(m);
    equal( mat.countMovesLeft(), 0 );
});
test('_visitGroup', function() {
    var m = [[0,0], [1,1]];
    var mat = new DropGameMatrix({height: 2, width: 2, numColors: 2 });
    mat.generateMatrix(m);
    mat._visitGroup(mat.at(0,0));
    ok( mat.at(0,0).isVisited() );
    ok( mat.at(0,1).isVisited() );
    ok( !mat.at(1,0).isVisited() );
    ok( !mat.at(1,1).isVisited() );
});
test('_resetAllVisited', function() {
    var m = [[0,0], [1,1]];
    var mat = new DropGameMatrix({height: 2, width: 2, numColors: 2 });
    mat.generateMatrix(m);
    mat._visitGroup(mat.at(0,0));
    ok( mat.at(0,0).isVisited() );
    ok( mat.at(0,1).isVisited() );
    mat._resetAllVisited()
    ok( !mat.at(0,0).isVisited() );
    ok( !mat.at(0,1).isVisited() );
    ok( !mat.at(1,0).isVisited() );
    ok( !mat.at(1,1).isVisited() );
});
test('each', function() {
    var mat = new DropGameMatrix({height: 2, width: 2, numColors: 2 });
    var count = 0;
    mat.each(function() { count++; });
    equal(count, mat.getHeight()*mat.getWidth());
});
test('removeCell', function() {
    var mat = new DropGameMatrix({height: 2, width: 2, numColors: 2 });
    mat.removeCell(mat.at(0,0));
    deepEqual( mat.at(0,0), null );
});
test('_cellHasAdjacent', function() {
    var m = [[1,0], [1,1]];
    var mat = new DropGameMatrix({height: 2, width: 2, numColors: 2 });
    mat.generateMatrix(m);

    ok( mat._cellHasAdjacent(mat.at(0,0)) );
    ok( !mat._cellHasAdjacent(mat.at(0,1)) );
});
test('_hasAdjacent', function() {
    var m = [[1,0], [1,1]];
    var mat = new DropGameMatrix({height: 2, width: 2, numColors: 2 });
    mat.generateMatrix(m);

    ok( mat._hasAdjacent(0,0) );
    ok( !mat._hasAdjacent(0,1) );
});
test('_applyRightColumnGravity', function() {
    var m = [[1,0], [1,0]];
    var mat = new DropGameMatrix({height: 2, width: 2, numColors: 2 });
    mat.generateMatrix(m);
    mat._removeGroup(mat.at(0,1));
    ok( !mat._isColumnEmpty(0) );
    ok( mat._isColumnEmpty(1) );
    mat._applyRightColumnGravity();
    ok( mat._isColumnEmpty(0) );
    ok( !mat._isColumnEmpty(1) );
});
test('_isColumnEmpty', function() {
    var mat = new DropGameMatrix({height: 2, width: 2, numColors: 2 });
    mat.removeCell(mat.at(0,0));
    mat.removeCell(mat.at(1,0));
    ok( mat._isColumnEmpty(0) );
    ok( !mat._isColumnEmpty(1) );
});
test('_applyDownGravity', function() {
    var m = [[1,0], [0,1]];
    var mat = new DropGameMatrix({height: 2, width: 2, numColors: 2 });
    mat.generateMatrix(m);
    mat.removeCell(mat.at(0,0));
    mat._applyDownGravity();
    ok( assertMatrixMatchesArray(mat, [[null, 0], [0,1]]) );
    mat.removeCell(mat.at(1,1));
    mat._applyDownGravity();
    ok( assertMatrixMatchesArray(mat, [[null, null], [0,0]]) );
});