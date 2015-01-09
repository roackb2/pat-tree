var uuid = require("../node_modules/node-uuid").v4;

module.exports = Node;

function Node(id) {
	if(id == undefined) {
		this.id = uuid();
	} else {
		this.id = id;
	}
	this.parent = null;
	this.left = null;
	this.right = null;
}


Node.prototype = {
	
	setLeftChild: function(node) {
		this.left = node;
	},

	setRightChild: function(node) {
		this.right = node;
	},

	reborn: function(data) {
		for(var key in data) {
			this[key] = data[key];
		}
		return this;
	}
}
