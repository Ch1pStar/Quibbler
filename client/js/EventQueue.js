define([], function(){

	function EventQueue(size){
		this._size = size+1;
		this._data = new Array(this._size);
		// Most current event to be executed
		this._head = 0;
		// Latest event to enter the queue
		this._tail = 0;
	}

	EventQueue.prototype.push = function(event) {
		this._data[this._tail] = event;
	    this._tail = (this._tail + 1) % this._size;
	    if (this._tail == this._head){
	        this._head = (this._head + 1) % this._size; /* full, overwrite */
	    }
	};

	EventQueue.prototype.next = function() {
		var event = this._data[this._head];
		this._data[this._head] = null;
	    this._head = (this._head + 1) % this._size;
	    return event;
	};

	EventQueue.prototype.empty = function() {
		return this._tail == this._head;
	};

	EventQueue.prototype.full = function() {
		return (this._tail+1)%this._size == this._head;
	};

	return EventQueue;
});