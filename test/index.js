var test = require('tape')
var Observ = require('observ')

var ObservVarhash = require('../index')

test('ObservVarhash is a function', function (assert) {
  assert.equal(typeof ObservVarhash, 'function')
  assert.end()
})

test('ObservVarhash contains correct initial value', function (assert) {
  var obj = ObservVarhash({
    foo: Observ('foo'),
    bar: Observ('bar')
  })

  var state = obj()
  assert.equal(state.foo, 'foo')
  assert.equal(state.bar, 'bar')

  assert.end()
})

test('observ emits change', function (assert) {
  var obj = ObservVarhash({
    foo: Observ('foo'),
    bar: Observ('bar')
  })
  var changes = []

  obj(function (state) {
    changes.push(state)
  })

  obj.foo.set('foo')
  obj.foo.set('foo2')
  obj.bar.set('bar2')

  assert.equal(changes.length, 3)
  assert.deepEqual(changes[0], {
    foo: 'foo', bar: 'bar', _diff: { 'foo': 'foo' }
  })
  assert.deepEqual(changes[1], {
    foo: 'foo2', bar: 'bar', _diff: { 'foo': 'foo2' }
  })
  assert.deepEqual(changes[2], {
    foo: 'foo2', bar: 'bar2', _diff: { 'bar': 'bar2' }
  })
  assert.notEqual(changes[0], changes[1])
  assert.notEqual(changes[1], changes[2])

  assert.end()
})

test('add key', function (assert) {
  var obj = ObservVarhash({
    foo: Observ('foo'),
    bar: Observ('bar')
  })
  var changes = []

  obj(function (state) {
    changes.push(state)
  })

  obj.put('baz', Observ('baz'))

  assert.equal(changes.length, 1)
  assert.deepEqual(changes[0], {
    foo: 'foo', bar: 'bar', baz: 'baz', _diff: { 'baz': 'baz' }
  })

  assert.deepEqual(obj(), {
    foo: 'foo', bar: 'bar', baz: 'baz', _diff: { 'baz': 'baz' }
  })
  assert.end()
})

test('remove key', function (assert) {
  var obj = ObservVarhash({
    foo: Observ('foo'),
    bar: Observ('bar')
  })
  var changes = []

  obj(function (state) {
    changes.push(state)
  })

  obj.delete('foo')

  assert.equal(changes.length, 1)
  assert.deepEqual(changes[0], {
    bar: 'bar', _diff: { 'foo': null }
  })

  assert.deepEqual(obj(), {
    bar: 'bar', _diff: { 'foo': null }
  })
  assert.end()
})

test('supports both observs and values', function (assert) {
  var obj = ObservVarhash({
    foo: Observ('foo'),
    bar: 'bar'
  })

  assert.equal(typeof obj.foo, 'function')
  assert.equal(obj.foo(), 'foo')
  assert.equal(obj.bar, 'bar')

  assert.end()
})

test('works with nested things', function (assert) {
  var obj = ObservVarhash({
    fruits: ObservVarhash({
      apples: Observ(3),
      oranges: Observ(5)
    }),
    customers: Observ(5)
  })
  var initialState = obj()
  var changes = []
  var fruitChanges = []

  obj(function (state) {
    changes.push(state)
  })

  obj.fruits(function (state) {
    fruitChanges.push(state)
  })

  obj.fruits.oranges.set(6)
  obj.customers.set(10)
  obj.fruits.apples.set(4)

  assert.equal(changes.length, 3)
  assert.equal(fruitChanges.length, 2)

  assert.notEqual(changes[0], initialState)
  assert.notEqual(changes[1], changes[0])
  assert.notEqual(changes[2], changes[1])

  assert.notEqual(fruitChanges[0], initialState.fruits)
  assert.notEqual(fruitChanges[1], fruitChanges[0])

  assert.deepEqual(initialState, {
    customers: 5,
    fruits: { apples: 3, oranges: 5 }
  })

  assert.deepEqual(changes[0], {
    customers: 5,
    fruits: { apples: 3, oranges: 6, _diff: { 'oranges': 6 } },
    _diff: { fruits: { oranges: 6 } }
  })
  assert.deepEqual(changes[1], {
    customers: 10,
    _diff: { customers: 10 },
    fruits: { apples: 3, oranges: 6, _diff: { oranges: 6 } }
  })
  assert.deepEqual(changes[2], {
    customers: 10,
    _diff: { fruits: { apples: 4 } },
    fruits: { apples: 4, oranges: 6, _diff: { apples: 4 } }
  })

  assert.deepEqual(initialState.fruits, {
    apples: 3, oranges: 5
  })
  assert.deepEqual(fruitChanges[0], {
    apples: 3, oranges: 6, _diff: { oranges: 6 }
  })
  assert.deepEqual(fruitChanges[1], {
    apples: 4, oranges: 6, _diff: { apples: 4 }
  })

  assert.equal(changes[1].fruits, changes[0].fruits,
    'unchanged properties are the same value')

  assert.end()
})
