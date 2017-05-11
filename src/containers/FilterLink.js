import { connect } from 'react-redux'
import { setVisibilityFilter } from '../actions'
import Link from '../components/Link'

const mapStateToProps = (state, ownProps) => ({
	active: ownProps.filter === state.visibilityFilter
})

const mapDispatchToProps = (dispatch, ownProps) => ({
	onClick: () => {
		dispatch(setVisibilityFilter(ownProps.filter))
	}
})

const FilterLink = connect(
	// null,
	mapStateToProps,
	mapDispatchToProps,
	// null,
	// {
		// only call `mapStateToProps` if `visibilityFilter` has changed
		// areStatesEqual: (prev, next) => prev.visibilityFilter === next.visibilityFilter
	// }
)(Link)

export default FilterLink
