import undoable from 'redux-undo';

const lead = (state, action) => {
    switch (action.type) {
        case 'ADD_LEAD':
            return {
                _id: action._id,
                name: action.name
            }
        default:
            return state
    }
}

const leads = (state = [], action) => {
    switch (action.type) {
        case 'ADD_LEAD':
            return [
                ...state,
                lead(undefined, action)
            ]
        default:
            return state
    }
}

const undoableLeads = undoable(leads)

export default undoableLeads