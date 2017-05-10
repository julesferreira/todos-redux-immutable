// for immutable
import { Record } from 'immutable'

// individual todos stored as Record
const TodoRecord = Record({
	id: null,
	text: '',
	completed: false
})

// nested reducer gets `TodoRecord` as state from `todos` (parent reducer)
const todo = (state, action) => {
	switch (action.type) {
		case 'ADD_TODO':
			// new record with non-default id and text
			return TodoRecord({
				id: action.id,
				text: action.text,
			})
		case 'TOGGLE_TODO':
			if (state.id !== action.id) {
				// not the todo you're looking for..
				return state
			}
			return state.set('completed', !state.completed)
		default:
			return state
	}
}

// reduces `todos` List from root reducer
const todos = (state, action) => {
	switch (action.type) {
		case 'ADD_TODO':
			// push `TodoRecord` from nested reducer into List
			return state.push(todo(undefined, action))
		case 'TOGGLE_TODO':
			return state.map(t =>
				todo(t, action)
			)
		default:
			return state
	}
}

export default todos
