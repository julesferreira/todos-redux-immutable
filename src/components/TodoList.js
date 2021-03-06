import React from 'react'
import Todo from './Todo'

const TodoList = ({ todos, onTodoClick }) => (
	<ul>
		{todos.map(todo =>
			<Todo
				key={todo.id}
				todo={todo}
				onClick={onTodoClick}
			/>
		)}
	</ul>
)

export default TodoList
