var extend = require("xtend")

module.exports = put

function put (key, value) {
  var obs = this
  var modified = obs()

  var diff = {}
  diff[key] = value()

  modified._diff = diff

  obs.set(extend(modified, diff))
  return obs
}
