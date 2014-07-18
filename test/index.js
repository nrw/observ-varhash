var test = require('tape')
var Observ = require('observ')
var ObservStruct = require('observ-struct')
var ObservVarhash = require('../index.js')

test('ObservVarhash is a function', function (t) {
  t.equal(typeof ObservVarhash, 'function')
  t.end()
})

test('ObservVarhash contains correct initial value', function (t) {
  var obj = ObservVarhash({foo: 'foo', bar: 'bar'}, function (obj, key) {
    return Observ(obj)
  })

  var state = obj()

  t.equal(state.foo, 'foo')
  t.equal(state.bar, 'bar')

  t.end()
})

test('works without create fn', function (t) {
  var obj = ObservVarhash({foo: 'foo', bar: 'bar'})
  var state = obj()

  t.equal(state.foo, 'foo')
  t.equal(state.bar, 'bar')

  t.end()
})

test('observ emits change', function (t) {
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

  t.equal(changes.length, 3)
  t.same(changes[0], {foo: 'foo', bar: 'bar'})
  t.same(changes[1], {foo: 'foo2', bar: 'bar'})
  t.same(changes[2], {foo: 'foo2', bar: 'bar2'})

  t.same(changes[0]._diff, {foo: 'foo'})
  t.same(changes[1]._diff, {foo: 'foo2'})
  t.same(changes[2]._diff, {bar: 'bar2'})

  t.notEqual(changes[0], changes[1])
  t.notEqual(changes[1], changes[2])

  t.end()
})

test('add key', function (t) {
  var obj = ObservVarhash({
    foo: Observ('foo'),
    bar: Observ('bar')
  })
  var changes = []

  obj(function (state) {
    changes.push(state)
  })

  obj.put('baz', Observ('baz'))

  t.equal(changes.length, 1)
  t.same(changes[0], {foo: 'foo', bar: 'bar', baz: 'baz'})
  t.same(obj(), {foo: 'foo', bar: 'bar', baz: 'baz'})
  t.same(changes[0]._diff, {baz: 'baz'})
  t.same(obj()._diff, {baz: 'baz'})

  t.end()
})

test('emits change for added key', function (t) {
  var obj = ObservVarhash({foo: Observ('foo')})
  var changes = []

  obj(function (state) {
    changes.push(state)
  })

  obj.put('bar', Observ('bar'))
  obj.get('bar').set('baz')

  t.equal(changes.length, 2)
  t.same(changes[0], {foo: 'foo', bar: 'bar'})
  t.same(changes[0]._diff, {bar: 'bar'})
  t.same(obj(), {foo: 'foo', bar: 'baz'})
  t.same(obj()._diff, {bar: 'baz'})

  t.end()
})

test('remove key', function (t) {
  var obj = ObservVarhash({
    foo: Observ('foo'),
    bar: Observ('bar')
  })
  var changes = []

  obj(function (state) {
    changes.push(state)
  })

  t.equal(Object.keys(obj._removeListeners).length, 2)

  obj.delete('foo')

  t.equal(Object.keys(obj._removeListeners).length, 1)
  t.equal(changes.length, 1)

  t.same(changes[0], {bar: 'bar'})
  t.same(changes[0]._diff, {foo: ObservVarhash.Tombstone})
  t.same(obj(), {bar: 'bar'})
  t.same(obj()._diff, {foo: ObservVarhash.Tombstone})

  t.end()
})

test('supports both observs and values', function (t) {
  var obj = ObservVarhash({
    foo: Observ('foo'),
    bar: 'bar'
  })

  t.equal(typeof obj.foo, 'function')
  t.equal(obj.foo(), 'foo')
  t.equal(obj.bar, 'bar')

  t.end()
})

test('works with nested things', function (t) {
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

  t.equal(changes.length, 3)
  t.equal(fruitChanges.length, 2)

  t.notEqual(changes[0], initialState)
  t.notEqual(changes[1], changes[0])
  t.notEqual(changes[2], changes[1])

  t.notEqual(fruitChanges[0], initialState.fruits)
  t.notEqual(fruitChanges[1], fruitChanges[0])

  t.same(initialState, {
    customers: 5,
    fruits: {apples: 3, oranges: 5}
  })

  t.same(changes[0], {
    customers: 5,
    fruits: {apples: 3, oranges: 6}
  })
  t.same(changes[0]._diff, {fruits: {oranges: 6}})
  t.same(changes[0].fruits._diff, {'oranges': 6})
  t.same(changes[1], {
    customers: 10,
    fruits: {apples: 3, oranges: 6}
  })
  t.same(changes[1]._diff, {customers: 10})
  t.same(changes[1].fruits._diff, {oranges: 6})
  t.same(changes[2], {
    customers: 10,
    fruits: {apples: 4, oranges: 6}
  })
  t.same(changes[2]._diff, {fruits: {apples: 4}})
  t.same(changes[2].fruits._diff, {apples: 4})

  t.same(initialState.fruits, {
    apples: 3, oranges: 5
  })
  t.same(fruitChanges[0], {
    apples: 3, oranges: 6
  })
  t.same(fruitChanges[0]._diff, {oranges: 6})
  t.same(fruitChanges[1], {
    apples: 4, oranges: 6
  })
  t.same(fruitChanges[1]._diff, {apples: 4})

  t.equal(changes[1].fruits, changes[0].fruits,
    'unchanged properties are the same value')

  t.end()
})

test('throws for keys that hide api', function (t) {
  var obj = ObservVarhash({foo: 'foo', bar: 'bar'})

  t.throws(function () {
    obj.put('put', {baz: 'baz'})
  })
  t.throws(function () {
    obj.put('get', {baz: 'baz'})
  })
  t.throws(function () {
    obj.put('delete', {baz: 'baz'})
  })
  t.throws(function () {
    obj.put('_removeListeners', {baz: 'baz'})
  })
  t.doesNotThrow(function () {
    obj.put('baz', {baz: 'baz'})
  })

  t.end()
})

test('Tombstone is Tombstone', function (t) {
  var obj = ObservVarhash({
    foo: 'foo',
    bar: 'bar'
  })
  var i = 0
  obj(function (change) {
    if (i <= 1) return i++

    t.equal(change._diff.foo, ObservVarhash.Tombstone)
    t.end()
  })

  obj.delete('foo')
  obj.put('foo', 'hi')
  obj.delete('foo')
})

test('observ varhash with black list', function (t) {
  t.throws(function () {
    ObservVarhash({
      name: Observ('foo')
    })
  }, /cannot create/)

  t.end()
})

test('supports two way data binding', function (t) {
  var obs = ObservVarhash({
    foo: Observ('bar')
  })

  obs.foo.set('bar2')

  t.equal(obs().foo, 'bar2')
  t.equal(obs.foo(), 'bar2')

  obs.set({foo: 'bar3'})

  t.equal(obs().foo, 'bar3')
  t.equal(obs.foo(), 'bar3')

  t.end()
})

test('two way data binding doesnt emit twice', function (t) {
  var obs = ObservVarhash({
    foo: Observ('bar')
  })

  var values = []
  obs.foo(function (v) {
    values.push(v)
  })

  obs.set({foo: 'bar2'})
  obs.set({foo: 'bar2'})

  t.equal(values.length, 1)
  t.equal(values[0], 'bar2')

  t.end()
})
