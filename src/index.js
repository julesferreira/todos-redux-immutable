import React from 'react'
import { render } from 'react-dom'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import App from './components/App'
import reducer from './reducers'
import * as actions from './actions'
import Perf from 'react-addons-perf'

const store = createStore(reducer)

render(
	<Provider store={store}>
		<App />
	</Provider>,
	document.getElementById('root')
)

window.benchmark = (count) => {
	// Perf.start()
	const t1 = performance.now()
	for (let i = 0; i < count; i++) {
		store.dispatch(actions.addTodo('test'))
	}
	for (let i = 0; i < count; i += 2) {
		store.dispatch(actions.toggleTodo(i))
	}
	for (let i = 0; i < 1; i++) {
		store.dispatch(actions.setVisibilityFilter('SHOW_ACTIVE'))
		store.dispatch(actions.setVisibilityFilter('SHOW_COMPLETED'))
		store.dispatch(actions.setVisibilityFilter('SHOW_ALL'))
	}
	return performance.now() - t1;
	// Perf.stop()
	// Perf.printWasted()
}
