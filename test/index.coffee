test = require 'tape'
Observ = require 'observ'
ObservStruct = require 'observ-struct'
ObservVarhash = require '../'

test 'ObservVarhash is a function', (t) ->
  t.equal typeof ObservVarhash, 'function'
  t.end()

test 'ObservVarhash contains correct initial value', (t) ->
  obj = ObservVarhash {foo: 'foo', bar: 'bar'}, (obj, key) ->
    Observ obj

  state = obj()

  t.equal state.foo, 'foo'
  t.equal state.bar, 'bar'
  t.end()

test 'works without create fn', (t) ->
  obj = ObservVarhash {foo: 'foo', bar: 'bar'}

  state = obj()

  t.equal state.foo, 'foo'
  t.equal state.bar, 'bar'
  t.end()

test 'observ emits change', (t) ->
  obj = ObservVarhash {foo: Observ('foo'), bar: Observ('bar')}

  changes = []

  obj (state) -> changes.push state

  obj.foo.set 'foo'
  obj.foo.set 'foo2'
  obj.bar.set 'bar2'
  t.equal changes.length, 3
  t.same changes[0],
    foo: 'foo'
    bar: 'bar'
    _diff: {foo: 'foo'}

  t.same changes[1],
    foo: 'foo2'
    bar: 'bar'
    _diff: {foo: 'foo2'}

  t.same changes[2],
    foo: 'foo2'
    bar: 'bar2'
    _diff: {bar: 'bar2'}

  t.notEqual changes[0], changes[1]
  t.notEqual changes[1], changes[2]
  t.end()

test 'add key', (t) ->
  obj = ObservVarhash {foo: Observ('foo'), bar: Observ('bar')}

  changes = []

  obj (state) -> changes.push state

  obj.put 'baz', Observ('baz')
  t.equal changes.length, 1
  t.same changes[0],
    foo: 'foo'
    bar: 'bar'
    baz: 'baz'
    _diff: {baz: 'baz'}

  t.same obj(),
    foo: 'foo'
    bar: 'bar'
    baz: 'baz'
    _diff: {baz: 'baz'}

  t.end()

test 'emits change for added key', (t) ->
  obj = ObservVarhash {foo: Observ('foo')}

  changes = []

  obj (state) -> changes.push state

  obj.put 'bar', Observ('bar')
  obj.get('bar').set 'baz'
  t.equal changes.length, 2
  t.same changes[0],
    foo: 'foo'
    bar: 'bar'
    _diff: {bar: 'bar'}

  t.same obj(),
    foo: 'foo'
    bar: 'baz'
    _diff: {bar: 'baz'}

  t.end()

test 'remove key', (t) ->
  obj = ObservVarhash {foo: Observ('foo'), bar: Observ('bar')}

  changes = []

  obj (state) ->
    changes.push state

  t.equal Object.keys(obj._removeListeners).length, 2

  obj.delete 'foo'

  t.equal Object.keys(obj._removeListeners).length, 1
  t.equal changes.length, 1
  t.same changes[0],
    bar: 'bar'
    _diff:
      foo: ObservVarhash.Tombstone

  t.same obj(),
    bar: 'bar'
    _diff:
      foo: ObservVarhash.Tombstone

  t.end()

test 'supports both observs and values', (t) ->
  obj = ObservVarhash {foo: Observ('foo'), bar: 'bar'}

  t.equal typeof obj.foo, 'function'
  t.equal obj.foo(), 'foo'
  t.equal obj.bar, 'bar'
  t.end()

test 'works with nested things', (t) ->
  obj = ObservVarhash
    fruits: ObservVarhash {apples: Observ(3), oranges: Observ(5)}
    customers: Observ(5)

  initialState = obj()
  changes = []
  fruitChanges = []

  obj (state) -> changes.push state
  obj.fruits (state) -> fruitChanges.push state

  obj.fruits.oranges.set 6
  obj.customers.set 10
  obj.fruits.apples.set 4

  t.equal changes.length, 3
  t.equal fruitChanges.length, 2
  t.notEqual changes[0], initialState
  t.notEqual changes[1], changes[0]
  t.notEqual changes[2], changes[1]
  t.notEqual fruitChanges[0], initialState.fruits
  t.notEqual fruitChanges[1], fruitChanges[0]

  t.same initialState,
    customers: 5
    fruits:
      apples: 3
      oranges: 5

  t.same changes[0],
    customers: 5
    fruits:
      apples: 3
      oranges: 6
      _diff:
        oranges: 6

    _diff:
      fruits:
        oranges: 6

  t.same changes[1],
    customers: 10
    _diff:
      customers: 10

    fruits:
      apples: 3
      oranges: 6
      _diff:
        oranges: 6

  t.same changes[2],
    customers: 10
    _diff:
      fruits:
        apples: 4

    fruits:
      apples: 4
      oranges: 6
      _diff:
        apples: 4

  t.same initialState.fruits,
    apples: 3
    oranges: 5

  t.same fruitChanges[0],
    apples: 3
    oranges: 6
    _diff:
      oranges: 6

  t.same fruitChanges[1],
    apples: 4
    oranges: 6
    _diff:
      apples: 4

  t.equal changes[1].fruits, changes[0].fruits,
    'unchanged properties are the same value'
  t.end()

test 'emits nested change', (t) ->
  obj = ObservStruct
    fruits: ObservVarhash {apples: 3, oranges: 5}, (val, key) -> Observ val
    customers: Observ(5)

  initialState = obj()
  changes = []
  fruitChanges = []

  obj (state) -> changes.push state

  obj.fruits (state) -> fruitChanges.push state

  obj.fruits.oranges.set 6
  obj.customers.set 10
  obj.fruits.apples.set 4

  t.equal changes.length, 3
  t.equal fruitChanges.length, 2
  t.notEqual changes[0], initialState
  t.notEqual changes[1], changes[0]
  t.notEqual changes[2], changes[1]
  t.notEqual fruitChanges[0], initialState.fruits
  t.notEqual fruitChanges[1], fruitChanges[0]

  t.same initialState,
    customers: 5
    fruits:
      apples: 3
      oranges: 5

  t.same changes[0],
    customers: 5
    fruits:
      apples: 3
      oranges: 6
      _diff:
        oranges: 6

    _diff:
      fruits:
        oranges: 6

  t.same changes[1],
    customers: 10
    _diff:
      customers: 10

    fruits:
      apples: 3
      oranges: 6
      _diff:
        oranges: 6

  t.same changes[2],
    customers: 10
    _diff:
      fruits:
        apples: 4

    fruits:
      apples: 4
      oranges: 6
      _diff:
        apples: 4

  t.same initialState.fruits,
    apples: 3
    oranges: 5

  t.same fruitChanges[0],
    apples: 3
    oranges: 6
    _diff:
      oranges: 6

  t.same fruitChanges[1],
    apples: 4
    oranges: 6
    _diff:
      apples: 4

  t.equal changes[1].fruits, changes[0].fruits,
    'unchanged properties are the same value'
  t.end()

test 'throws for keys that hide api', (t) ->
  obj = ObservVarhash {foo: 'foo', bar: 'bar'}

  t.throws -> obj.put 'put', {baz: 'baz'}
  t.throws -> obj.put 'get', {baz: 'baz'}
  t.throws -> obj.put 'delete', {baz: 'baz'}
  t.throws -> obj.put '_removeListeners', {baz: 'baz'}
  t.doesNotThrow -> obj.put 'baz', {baz: 'baz'}

  t.end()
