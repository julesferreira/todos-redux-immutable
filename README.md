# using Immutable.js to optimize react/redux applications

react is _le awesome_ in conjunction with a flux pattern (a la redux). let's make it _le awesomer_ (read: silly fast, even with large datasets and rapid changes).

we'll take the basic todos example from redux and look for easy optimizations with Immutable.js

## eliminate wasted renders

let's create a baseline with some performance profiling. we'll create some todos, toggle half of them, and then click through the filter options.

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

## `benchmark(100)`

(index) | Owner > Component | Inclusive wasted time (ms) | Instance count | Render count
--- | --- | --- | --- | ---
0 | "TodoList > Todo" | 61.38 | 150 | 10000
1 | "Footer > Connect(Link)" | 6.6 | 3 | 453

at a count of **100** we've called `render` **10,453** more times than was needed. at **1,000** todos, that's.. a browser crash. **200**? **40,903** unproductive renders :o

## convert state object into immutable structures

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

we'll be converting our objects into Records and arrays into Lists.

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

## update :allthereducers:

since our state is created and updated in the reducers we'll start there with our immutable conversion.

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

hmmmmmm, so the `todos` reducer takes the array of todos as state. any actions involving an element of that array is passed to the `todo` reducer. this nested reducer takes an individual todo object as state. now that we're converting our arrays and objects to Lists and Records, we'll need to update `todos` to work with Lists, and `todo` to work with Records.

we'll need to update each action to use the new data structures. but for now, let's focus on the `'TOGGLE_TODO'` type.

```js
// reducers/todos.js

// individual todos stored as Records
const TodoRecord = Record({
  id: null,
  text: '',
  completed: false
})

// reduces `todos` List from root reducer
const todos = (state, action) => {
  switch (action.type) {
    case 'TOGGLE_TODO':
      return state.map(t =>
        todo(t, action)
      )
    ...

// nested reducer gets `TodoRecord` as state from `todos` (parent reducer)
const todo = (state, action) => {
  switch (action.type) {
    case 'TOGGLE_TODO':
      if (state.id !== action.id) {
        // not the todo you're looking for..
        return state
      }
      return state.set('completed', !state.completed)
    ...
```

three items of note:
1. `TodoRecord` defines the structure of any todo item
2. the toggle reduction for `todos` remains unchanged (the List api is largely a superset of Array)
3. in the `todo` reducer, we use List's `set` function to get a duplicate `TodoRecord` with a negated `completed` member (instead of building a new object by hand)

## update components

now our state tree is immutable, and our reducers know how to read and update it. next we'll need to update our connected react components so they can correctly parse our new structure.

### TodoList

where `TodoList` previously expected an array, we're now giving it a List. no worries tho-our components only utilize the array in ways for which our List has an identical api (e.g. `todos.map`).

we _will_, however, have to make an adjustment to our original mapper function:

```js
{todos.map(todo =>
  <Todo
    key={todo.id}
    {...todo} // le trouble.
    onClick={() => onTodoClick(todo.id)}
  />
)}
```

since each `todo` is now a Record-which by its nature lacks a universally appropriate spread specification-we'll have to pass props a bit differently.

```js
{todos.map(todo =>
  <Todo
    key={todo.id}
    onClick={() => onTodoClick(todo.id)}

    // the most common pattern i see:
    data={todo}

    // the verbose method:
    //text={todo.text}
    //completed={todo.completed}

    // the _let the mutations begin_ method:
    //{...todo.toJS()}

    // the _are you sure you wanna add the babel plugin and roll your own
    // opinionated destructuring implementation?_ method:
    //{...todo}
  />
)}
```

## connector optimization or: React Redux is magic

our todos app is once again behaving correctly. let's take another look at our wasted renders.

### `benchmark(100)`

(index) | Owner > Component | Inclusive wasted time (ms) | Instance count | Render count
--- | --- | --- | --- | ---
0 | "TodoList > Todo" | 69.96 | 150 | 10000

well looky there, **453** unproductive renders from _Footer > Connect(Link)_ have been skipped! for why?

### by default, the `connect` HOC from React Redux passes new props to the wrapped component when the result of `mergeProps` is **not** _shallowly equal_ to the previous result

this means we can short-circuit renders of the wrapped component-when we know it won't change-by:

- overriding the default comparison function, `areMergedPropsEqual`, to return false when we want children to render **and/or**
- supplying an alternate implementation of `mergeProps` that ignores incoming state and props which we know won't affect the result of descendent renders

this is grand. we can prune our props or bypass updates before our data ever hits a presentational component; however, most of the time this will be overkill as we have access to three higher-level hooks which allow us to inspect more specific slices of data and catch unproductive changes earlier:

> * [`areStatesEqual`] *(Function)*: When pure, compares incoming store state to its previous value. Default value: `strictEqual (===)`
> * [`areOwnPropsEqual`] *(Function)*: When pure, compares incoming props to its previous value. Default value: `shallowEqual`
> * [`areStatePropsEqual`] *(Function)*: When pure, compares the result of `mapStateToProps` to its previous value. Default value: `shallowEqual`

so why did those **453** renders disappear? `areStatesEqual` + immutability. let's compare what's happening between the _state-as-object_ and _state-as-Record_ implementations:

\# | state-as-object | state-as-Record
--- | --- | ---
1 | parent component is (re)rendered or store publishes non-productive update | parent component is (re)rendered or store publishes non-productive update
2 | state **object** is passed to connector | state **Record** is passed to connector
3 | connector calls `areStatesEqual` with passed in state | connector calls `areStatesEqual` with passed in state
4 | new object !== previous object | new Record === previous Record
5 | connector calls `mapStateToProps` with passed in state |
6 | connector merges props and passes to wrapped component |
7 | wrapped component renders descendent tree |

:success:... :kinda:... five percent drop in unproductive renders isn't _bad_...

## make `Todo` pure

let's dig into the real problem child: `Todo`.

(index) | Owner > Component | Inclusive wasted time (ms) | Instance count | Render count
--- | --- | --- | --- | ---
0 | "TodoList > Todo" | 69.96 | 150 | 10000

**10,000** unnessesary renders! how the why? let's look at `TodoList` and `Todo` to figure out what's going on.

```js
const TodoList = ({ todos, onTodoClick }) => (
  <ul>
    {todos.map(todo =>
      <Todo
        key={todo.id}
        todo={todo}
        onClick={() => onTodoClick(todo.id)}
      />
    )}
  </ul>
)

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
```

hmmmmm, so `TodoList` takes two props: 

1. `todos`, a List of visible TodoRecords **and**
2. `onTodoClick`, a function that dispatches the `toggleTodo` action

during render it maps over the `todos` List and creates a `Todo` for each TodoRecord. each `Todo` is responsible for displaying its decorated `text` and issuing `toggleTodo` on click. this seems reasonable.. so why are we rendering the _crud_ out of `Todo`s?

when is `TodoList` re-rendered? the default component behavior is to render on every prop/state change. so what happens when we have **100** TodoRecords in our List and we toggle one of them? our `todos` change and.. **100** `Todo`s are rendered, even tho _only **one** of them has changed_!

### `PureComponent` to the rescue

> `React.PureComponent` is exactly like `React.Component` but implements `shouldComponentUpdate()` with a shallow prop and state comparison.

since the `todo` prop passed to each `Todo` is now immutable, we can make `Todo` a `PureComponent`; render will only be called when an individual TodoRecord has changed.

```js
class Todo extends React.PureComponent {
  render() {
    return (
      <li
        onClick={this.props.onClick}
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
```

:huzzah: now when we `benchmark(100)` we have zer... what?!?2kj04

we still have **10,000** too many renders. hmmmm.. we know our TodoRecord is safe for shallow comparison, and we're only passing one other prop: `onClick`. ahhhhh, the function is recreated each render and will never pass a shallow comparison. let's push the function creation into the `Todo` component.

```js
// TodoList
onClick={onTodoClick}

// Todo
onClick={() => this.props.onClick(this.props.todo.id)}

// alternately, we could ignore the `onClick` prop and implement
// `shouldComponentUpdate` with a strict comparison of `todo`
//shouldComponentUpdate(nextProps) {
//  return this.props.todo !== nextProps.todo
//}

// or following the functional paradigm, use an HOC like Recompose's
// `onlyUpdateForKeys`
//export default onlyUpdateForKeys(['todo'])(Todo)
```

## `benchmark(100)`

zero wasted renders! what does that mean performance-wise? let's capture some statistically-irresponsible execution times with production builds:

todos | original (ms) | immutable (ms) | ~% improvement
--- | --- | --- | ---
100 | 156 | 149 | **5**
200 | 368 | 286 | **29**
500 | 1753 | 1001 | **75**
1000 | 6743 | 3599 | **87**
2000 | 27069 | 14190 | **90**
3000 | 64313 | 34198 | **88**

the results of our immutable adjustment becomes more pronounced as the count of todos grows. once we move beyond **500** items we see performance improvements in excess of **80%**.

:partyparrot:

## so, what do we optimize next?

we've walked through two basic optimizations that are _best friends_ with Immutable.js; connector and component short-circuits. so, what's next? we'd probably do well to subscribe to Knuth's suggestion that:

> We _should_ forget about small efficiencies, say about 97% of the time: **premature optimization is the root of all evil**. Yet we should not pass up our opportunities in that critical 3%."

these optimizations are simple and impactfull; they may even fall under the category of _the critical 3%_.. but quite often they are unnessesary. for example: this trivial todos app we just optimized. 80% improvement is awesome, but chances seem low that a user would create and interact with **1,000** todos in under six seconds (the pace they'd have to set to _really_ feel the benefit).

**so maybe the better question, then, is _"when do we optimize next?"_**

**when we need it.**
###### keep the profilers close.. watch for the jank..
<sub><sub>that said, someone should really memoize that ugly selector.. i'm looking at you `getVisibleTodos`!</sub></sub>

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

