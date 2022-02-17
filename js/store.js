define("store", ["https://cdnjs.cloudflare.com/ajax/libs/redux/3.5.2/redux.js",
"https://unpkg.com/@reduxjs/toolkit@1.7.2/dist/redux-toolkit.umd.js"],

function (redux, reduxtoolkit) {

    const moleculeSlice = reduxtoolkit.createSlice(
        {
            name: 'molecule',
            initialState: {
                ID: null,
                number: null,
                formula: null,
                smiles: null,
                cas: null,
                hazardous: false,
                hazardousSpec: false,
                supplier: null,
                synthBy: null,
                receivingDate: null,
                comments: null 
            },
            reducers:
            {

            }
        }
    );

    const drawingSlice = reduxtoolkit.createSlice(
        {
            name: 'canvas',
            initialState:{
                cancel: false,
                draw: false
            },
            reducers: {
                draw: (state) =>
                {
                    state.cancel = !state.cancel;
                    state.draw = !state.draw;
                },
                cancel: (state) =>
                {
                    state.cancel = state.cancel & state.draw
                    state.draw = !state.draw;
                }
            }
        }
    )


    const reducer = reduxtoolkit.combineReducers({
        draw: drawingSlice.reducer,
        molecule: moleculeSlice.reducer
    });
    
    const store = redux.createStore(reducer);
    
    return {
        drawingSlice: drawingSlice,
        moleculeSlice: moleculeSlice,
        store: store
    }
}

);