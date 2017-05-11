import todos from './todos'
import visibilityFilter from './visibilityFilter'

// redux `combineReducers` treats state as plain js objects. the drop-in
// replacement from _redux-immutable_ is aware of the immutable api, and able
// to correctly iterate over these structures
import { combineReducers } from 'redux-immutable'
import { Record, List } from 'immutable'

// state stored as immutable Record composed of List and string
const InitialState = Record({
	todos: List(),
	visibilityFilter: 'SHOW_ALL'
})

// root reducer
const todoApp = combineReducers({
	todos,
	visibilityFilter
},
	// pass initial state to root reducer
	InitialState
)

export default todoApp
