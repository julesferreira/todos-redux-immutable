import React from 'react'

class Todo extends React.PureComponent {
	render() {
		return (
			<li
				onClick={() => this.props.onClick(this.props.todo.id)}
				style={{
					textDecoration: this.props.todo.completed ? 'line-through' : 'none'
				}}
			>
				{this.props.todo.text}
			</li>
		)
	}
}

// alternately, if we wanted to maintain the functional/compositional nature of
// our component, we could wrap it in an HOC that does the same shallow
// comparison in `shouldComponentUpdate`
//
// e.g. something akin to Recompose's `pure`
//
//const Todo = ({ onClick, todo }) => (
//...
//)
//
//export default pure(Todo)

export default Todo
