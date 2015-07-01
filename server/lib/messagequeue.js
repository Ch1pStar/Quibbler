
/**
 * @constructor
 * @param {int}
 */
function MessageQueue(size){
  // Default size if not specified
  if(typeof size == 'undefined'){
    size = 100;
  }
  if(typeof size !== 'number'){
    throw new Error("'"+size.toString()+ "' is not a valid size!");
  }
  this._size = size+1;
  this._data = new Array(this._size);
  // Most current message to be executed
  this._head = 0;
  // Latest message to enter the queue
  this._tail = 0;
}

/**
 * Adds an item at the end of the queue
 * @param  {Object}
 */
MessageQueue.prototype.push = function(message) {

  this._data[this._tail] = message;
  this._tail = (this._tail + 1) % this._size;
  if (this._tail == this._head){
    this._head = (this._head + 1) % this._size; /* full, overwrite */
  }

};

/**
 * Returns the first in line item in the queue
 * and moves the _head pointer to the next item
 * @return {Object}
 */
MessageQueue.prototype.next = function() {

  var message = this._data[this._head];
  this._data[this._head] = null;
  this._head = (this._head + 1) % this._size;
  return message;
};

/**
 * Assert if the buffer is empty
 * @return {Boolean}
 */
MessageQueue.prototype.empty = function() {
  return this._tail == this._head;
};

/**
 * Assert if the buffer is full
 * @return {Boolean}
 */
MessageQueue.prototype.full = function() {
  return (this._tail+1)%this._size == this._head;
};


module.exports = MessageQueue;
