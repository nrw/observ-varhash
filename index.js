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
      throw new Error('cannot create an observ-varhash with a key named' +
        '"name". Clashes with `Function.prototype.name`.')
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
      obs._removeListeners[key] = observ(watch(obs, key))
    }
  })

  return obs
}

// api
function get (key) { return this[key] }

function put (createFn) {
  return function (key, val) {
    var obs = this
    var observ = createFn(val, key)
    var state = prepareChange(obs, key)
    var value = typeof observ === 'function' ? observ() : observ

    state[key] = value

    if (typeof observ === 'function') {
      obs._removeListeners[key] = observ(watch(obs, key))
    }

    state._diff = diff(key, value)
    obs.set(state)
    obs[key] = observ

    return obs
  }
}

function del (key) {
  var state = prepareChange(this, key)

  delete state[key]
  state._diff = diff(key, TOMBSTONE)
  this.set(state)

  return this
}

// helpers
function watch (obs, key, state) {
  return function (value) {
    var state = extend(obs())
    state[key] = value
    state._diff = diff(key, value)
    obs.set(state)
  }
}

function prepareChange (obs, key) {
  var state = extend(obs())

  if (obs._removeListeners[key]) {
    obs._removeListeners[key]()
    delete obs._removeListeners[key]
  }

  return state
}

function diff (key, value) {
  var obj = {}
  obj[key] = value && value._diff ? value._diff : value
  return obj
}

function Tombstone () {
  this.toString = function () { return '[object Tombstone]' }
  this.toJSON = function () { return '[object Tombstone]' }
}
