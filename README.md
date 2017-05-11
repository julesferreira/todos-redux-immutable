# using Immutable.js to optimize react/redux applications

react is _le awesome_ in conjuction with a flux pattern (a la redux). let's make it _le awesomer_ (read: silly fast, even with large datasets and rapid changes).

we'll take the basic todos example from redux and look for easy optimizations with Immutable.js

## phase one: eliminate wasted renders

let's create a baseline with some performance profiling. we'll create some todos, toggle half of them, and then click through the filter options

```js
import Perf from 'react-addons-perf'

window.benchmark = (count = 100) => {
	Perf.start()
	for (let i = 0; i < count; i++) {
		store.dispatch(actions.addTodo('test'))
	}
	for (let i = 0; i < count; i += 2) {
		store.dispatch(actions.toggleTodo(i))
	}
	store.dispatch(actions.setVisibilityFilter('SHOW_ACTIVE'))
	store.dispatch(actions.setVisibilityFilter('SHOW_COMPLETED'))
	store.dispatch(actions.setVisibilityFilter('SHOW_ALL'))
	Perf.stop()
	Perf.printWasted()
}
```

### `benchmark(100)`

(index) | Owner > Component | Inclusive wasted time (ms) | Instance count | Render count
--- | --- | --- | --- | ---
0 | "TodoList > Todo" | 61.38 | 150 | 10000
1 | "Footer > Connect(Link)" | 6.6 | 3 | 453

at a cound of **100** we've called `render` **10,453** more times than was needed. at **1,000** todos, that's.. a browser crash. **200**? **40,903** unproductive renders :o

### convert state object into immutable structures

so our current state has a shape like

```js
{
	todos: [
		{
			id: int,
			text: string,
			completed: bool
		},
		...
	],
	visibilityFilter: string
}
```

we'll be converting our objects into Records and arrays into Lists

```js
Record (
	todos: List(
		Record(
			id: int,
			text: string,
			completed: bool
		),
		...
	),
	visibilityFilter: string
)
```

## updating reducers

since our state is created and updated in the reducers we'll start there with our immutable conversion

### update root reducer

```js
// reducers/index.js

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
```

we made two notable changes in this file:
1. the app state `InitialState` was defined as an immutable Record
2. the `InitialState` class was passed into `combineReducers`

### update child reducers

since `visibilityFilter` only deals in strings, we'll leave as is. on to `todos`!

```js
// reducers/todos.js

// individual todos stored as Record
const TodoRecord = Record({
	id: null,
	text: '',
	completed: false
})
```








---

# Redux Todos Example

This project template was built with [Create React App](https://github.com/facebookincubator/create-react-app), which provides a simple way to start React projects with no build configuration needed.

Projects built with Create-React-App include support for ES6 syntax, as well as several unofficial / not-yet-final forms of Javascript syntax such as Class Properties and JSX.  See the list of [language features and polyfills supported by Create-React-App](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md#supported-language-features-and-polyfills) for more information.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (Webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

