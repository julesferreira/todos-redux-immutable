import { connect } from 'react-redux'
import { toggleTodo } from '../actions'
import TodoList from '../components/TodoList'

const getVisibleTodos = (todos, filter) => {
	switch (filter) {
		case 'SHOW_ALL':
			return todos
		case 'SHOW_COMPLETED':
			return todos.filter(t => t.completed)
		case 'SHOW_ACTIVE':
			return todos.filter(t => !t.completed)
		default:
			throw new Error('Unknown filter: ' + filter)
	}
}

const mapStateToProps = (state) => ({
	todos: getVisibleTodos(state.todos, state.visibilityFilter)
})
// const mapStateToProps = (state) => { 
// 	console.log(getVisibleTodos(state.todos, state.visibilityFilter));
	
// 	return ({
// 	todos: getVisibleTodos(state.todos, state.visibilityFilter)
// 	})
// }

const mapDispatchToProps = {
	onTodoClick: toggleTodo
}

const VisibleTodoList = connect(
	mapStateToProps,
	mapDispatchToProps,
	null,
	{
		// only call `mapStateToProps` if `visibilityFilter` has changed
		// areOwnPropsEqual: (prev, next) => {
		// 	return true
		// },
		// areStatePropsEqual: (prev, next) => {
		// 	console.log(prev.todos, next.todos);
		// 	return prev.todos === next.todos
		// }
	}
)(TodoList)

export default VisibleTodoList
