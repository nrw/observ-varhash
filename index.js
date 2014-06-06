var Observ = require('observ')
var extend = require('xtend')

var TOMBSTONE = ObservVarhash.Tombstone = new Tombstone()

module.exports = ObservVarhash

function ObservVarhash(hash, createFn) {
  createFn = createFn || function (obj) { return obj }

  var keys = Object.keys(hash)

  var initialState = {}

  keys.forEach(function (key) {
    if (key === 'name') {
      throw new Error('cannot create an observ-varhash ' +
        'with a key named "name". Clashes with ' +
        '`Function.prototype.name`.');
    }

    var observ = hash[key]
    initialState[key] = typeof observ === 'function' ? observ() : observ
  })

  var obs = Observ(initialState)

  obs.get = get
  obs.delete = del
  obs.put = put(createFn)

  obs._removeListeners = {}

  keys.forEach(function (key) {
    var observ = hash[key]
    obs[key] = createFn(observ, key)

    if (typeof observ === 'function') {
      obs._removeListeners[key] = observ(_watch(obs, key))
    }
  })

  return obs
}

function put (createFn) {
  return function (key, val) {
    var obs = this
    var state = extend(obs())
    var observ = createFn(val, key)

    if (obs._removeListeners[key]) {
      obs._removeListeners[key]()
      delete obs._removeListeners[key]
    }

    var value = typeof observ === 'function' ? observ() : observ

    state[key] = value

    if (typeof observ === 'function') {
      obs._removeListeners[key] = observ(_watch(obs, key))
    }

    var diff = {}
    diff[key] = value && value._diff ? value._diff : value

    state._diff = diff
    obs.set(state)
    obs[key] = observ

    return obs
  }
}

function get (key) {
  return this[key]
}

function del (key) {
  var obs = this
  var modified = obs()

  if (obs._removeListeners[key]) {
    obs._removeListeners[key]()
    delete obs._removeListeners[key]
  }

  delete modified[key]

  var diff = {}
  diff[key] = TOMBSTONE

  modified._diff = diff

  obs.set(modified)
  return obs
}

function _watch (obs, key) {
  return function (value) { return _rewatch(obs, key, value) }
}

function _rewatch (obs, key, value) {
  var state = extend(obs())
  state[key] = value
  var diff = {}
  diff[key] = value && value._diff ? value._diff : value
  state._diff = diff
  obs.set(state)
}

function Tombstone () {
  this.toString = function () { return '[object Tombstone]' }
  this.toJSON = function () { return '[object Tombstone]' }
}
