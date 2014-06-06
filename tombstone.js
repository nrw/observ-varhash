module.exports = new Tombstone()

function Tombstone () {
  this.toString = function () {
    return '[object Tombstone]'
  }
  this.toJSON = function () {
    return '[object Tombstone]'
  }
}