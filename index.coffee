Observ = require 'observ'
extend = require 'xtend'

ObservVarhash = (hash, createValue) ->
  createValue or= (obj) -> obj

  initialState = {}

  for key, observ of hash
    checkKey(key)
    initialState[key] = observ?() or observ

  obs = Observ(initialState)
  obs._removeListeners = {}

  obs[k] = v for k, v of methods(createValue)

  for key, observ of hash
    obs[key] = createValue(observ, key)
    obs._removeListeners[key] = obs[key]?(watch(obs, key))

  obs

# api
methods = (createValue) ->
  get: (key) -> @[key]

  put: (key, val) ->
    checkKey(key)
    observ = createValue(val, key)
    state = extend this()
    state[key] = observ?() or observ

    @_removeListeners[key]?()
    @_removeListeners[key] = observ?(watch(this, key))

    state._diff = diff(key, state[key])
    @set state

    @[key] = observ

    this

  delete: (key) ->
    state = extend this()
    @_removeListeners[key]?()

    delete @_removeListeners[key]
    delete state[key]

    state._diff = diff(key, ObservVarhash.Tombstone)
    @set state
    this

# helpers
watch = (obs, key) -> (value) ->
  state = extend obs()
  state[key] = value
  state._diff = diff(key, value)
  obs.set state

diff = (key, value) ->
  obj = {}
  obj[key] = if value and value._diff then value._diff else value
  obj

# errors
checkKey = (key) -> throw new Error msg if msg = getKeyError(key)

getKeyError = (key) ->
  reason = switch key
    when 'name'
      'Clashes with `Function.prototype.name`.'
    when 'get', 'put', 'delete', '_removeListeners'
      'Clashes with observ-varhash method'

  return '' unless reason
  "cannot create an observ-varhash with key `#{key}`, #{reason}"

# mark deletes
Tombstone = ->
Tombstone::toString = -> '[object Tombstone]'
Tombstone::toJSON = -> '[object Tombstone]'
Tombstone::inspect = -> '[object Tombstone]'

ObservVarhash.Tombstone = new Tombstone()

# export
module.exports = ObservVarhash
