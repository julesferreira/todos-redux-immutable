import todos from './todos'
import visibilityFilter from './visibilityFilter'

// for immutable
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
