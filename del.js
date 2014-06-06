var Tombstone = require('./tombstone')

module.exports = del

function del (key) {
  var obs = this
  var modified = obs()

  delete modified[key]

  var diff = {}
  diff[key] = Tombstone

  modified._diff = diff

  obs.set(modified)
  return obs
}
