import React from 'react'
import { onlyUpdateForKeys } from 'recompose'

const Todo = ({ onClick, todo }) => (
	<li
		onClick={onClick}
		style={{
			textDecoration: todo.completed ? 'line-through' : 'none'
		}}
	>
		{todo.text}
	</li>
)

export default onlyUpdateForKeys(['todo'])(Todo)
// export default Todo
