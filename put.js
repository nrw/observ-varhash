var extend = require('xtend')

module.exports = put

function put (create) {
  return function (key, val) {
    var obs = this
    var state = extend(obs())
    var value = create(val, key)

    value = typeof value === 'function' ? value() : value

    state[key] = value
    var diff = {}

    diff[key] = value && value._diff ? value._diff : value

    state._diff = diff
    obs.set(state)
    return obs
  }
}