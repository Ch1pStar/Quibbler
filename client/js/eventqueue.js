/**
 * A simple circular buffer structure
 */
define([], function(){

  /**
   * @constructor
   * @param {int}
   */
  function EventQueue(size){
    if(typeof size !== 'number'){
      throw new Error("'"+size.toString()+ "' is not a valid size!");
    }
    this._size = size+1;
    this._data = new Array(this._size);
    // Most current event to be executed
    this._head = 0;
    // Latest event to enter the queue
    this._tail = 0;
  }

  /**
   * Adds an item at the end of the queue
   * @param  {Object}
   */
  EventQueue.prototype.push = function(event) {
    this._data[this._tail] = event;
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
  EventQueue.prototype.next = function() {
    var event = this._data[this._head];
    this._data[this._head] = null;
    this._head = (this._head + 1) % this._size;
    return event;
  };

  /**
   * Assert if the buffer is empty
   * @return {Boolean}
   */
  EventQueue.prototype.empty = function() {
    return this._tail == this._head;
  };

  /**
   * Assert if the buffer is full
   * @return {Boolean}
   */
  EventQueue.prototype.full = function() {
    return (this._tail+1)%this._size == this._head;
  };

  return EventQueue;
});
