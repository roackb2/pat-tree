var uuid = require("../node_modules/node-uuid").v4;

module.exports = BTree;

function BTree() {
 	this.root = new Node();
}

BTree.prototype = {
	//checked
	getRoot: function() {
		return this.root;
	},

	//checked
	getRootId: function() {
		return this.root.id;
	},

	isRoot: function(id) {
		return this.root.id == id;
	},

	isLeftChild: function(childId) {
		var node = this.getNode(childId);
		if(!node) {
			throw "node not exists";
		} else if(!node.parent) {
			throw "no parent"; 
		} else {
			var parent = node.parent;
			if(parent.left != null && parent.left.id == childId) {
				return true;
			} else {
				return false;
			}			
		}
	},

	isRightChild: function(childId) {
		var node = this.getNode(childId)
		if(!node) {
			throw "node not exists";
		} else if(!node.parent) {
			throw "no parent"; 
		} else {
			var parent = node.parent;
			if(parent.right != null && parent.right.id == childId) {
				return true;
			} else {
				return false;
			}			
		}
	},

	//checked
	getNode: function(id) {
		return this._traverse(this.root, id);
	},

	//checked
	getNodeId: function(node) {
		return node.id;
	},

	getParent: function(id) {
		var node = this.getNode(id);
		if(!node || !node.parent) {
			return;
		} else {
			return node.parent;
		}
	},

	//checked
	getLeftChild: function(id) {
		var node = this.getNode(id);
		if(!node || !node.left) {
			return;
		} else {
			return node.left;
		}
	},

	//checked
	getRightChild: function(id) {
		var node = this.getNode(id);
		if(!node || !node.left) {
			return;
		} else {
			return node.right;
		}
	},

	//checked
	createNode: function(id) {
		return new Node(id);
	},

	//checked
	setNodeData: function(id, data) {
		var node = this.getNode(id);
		if(node) {
			node.data = data;
			return true;
		} else {
			return false;
		}
	},

	//checked
	appendLeftChild: function(id, subtree) {
		var node = this.getNode(id);
		if(!node) {
			return false;
		} else if(node.left) {
			return false;
		} else {
			var target;
			if(subtree instanceof BTree){
				target = subtree.root;
			} else {
				target = subtree;
			}
			node.left = target;
			target.parent = node;
			return true;
		}
	},

	//checked
	appendRightChild: function(id, subtree) {
		var node = this.getNode(id);
		if(!node) {
			return false;
		} else if(node.right) {
			return false;
		} else {
			var target;
			if(subtree instanceof BTree) {
				target = subtree.root;
			} else {
				target = subtree;
			}
			node.right = target;
			target.parent = node;
			return true;
		}
	},

	detachLeftChild: function(id) {
		var node = this.getNode(id);
		if(!node || !node.left) {
			return;
		} else {
			leftChild = node.left;
			node.left = null;
			return leftChild;
		}
	},

	detachRightChild: function(id) {
		var node = this.getNode(id);
		if(!node || !node.right) {
			return;
		} else {
			rightChild = node.right;
			node.right = null;
			return rightChild;
		}
	},

	removeSubtree: function(id) {
		var node = this.getNode(id);
		if(node) {
			this._remove(node);
			return true;
		} else {
			return false;
		}
	},

	//checked
	reparentToLeft: function(id, newParentId) {
		var node = this.getNode(id);
		var newParent = this.getNode(newParentId);
		if(!node || !newParent || newParent.left) {
			return false;
		} else {
			var oldParent = node.parent;
			newParent.left = node;
			node.parent = newParent;
			if(oldParent.left.id == id) {
				oldParent.left = null;
			} else if (oldParent.right.id == id) {
				oldParent.right = null;
			}
			return true;
		}
	},

	//checked
	reparentToRight: function(id, newParentId) {
		var node = this.getNode(id);
		var newParent = this.getNode(newParentId);
		if(!node || !newParent || newParent.right) {
			return false;
		} else {
			var oldParent = node.parent;
			newParent.right = node;
			node.parent = newParent;
			if(oldParent.left.id == id) {
				oldParent.left = null;
			} else if(oldParent.right.id == id) {
				oldParent.right = null;
			}
			return true;
		}
	},

	//checked
	_traverse: function(node, id) {
		//console.log(node.id);
		if(node.id === id) {
			return node; 
		} else if(!node.left && !node.right) {
			return;
		} else if(!node.left) {
			return this._traverse(node.right, id);
		} else if(!node.right) {
			return this._traverse(node.left, id);
		} else {
			var leftResult = this._traverse(node.left, id);
			if(!leftResult) {
				var rightResult = this._traverse(node.right, id);
				if(!rightResult) {
					return;
				} else {
					return rightResult;
				}
			} else {
				return leftResult;
			}
		}
	},

	_remove: function(node) {
		var result = true;
		if(node === undefined || node === null) {
			return false;
		} else if(!node.left && !node.right) {
			result = true;
		} else if(node.left != null && node.right != null) {
			var left = this._remove(node.left);
			var right = this._remove(node.right);
			result = left & right;
		} else if(node.left != null) {
			result = this._remove(node.left);
		} else {
			result = this._remove(node.right);
		}
		var parent = node.parent;
		if(parent.left != null && parent.left.id == node.id) {
			parent.left = null;
		} else if(parent.right != null && parent.right.id == node.id) {
			parent.right = null;
		}
		delete node;
		return result;
	},
}

function Node(id) {
	if(id === undefined) {
		this.id = uuid();
	} else {
		this.id = id;
	}
	this.data = null;
	this.parent = null;
	this.left = null;
	this.right = null;
}

Node.prototype = {
	setData: function(data) {
		this.data = data;
	},

	setLeftChild: function(node) {
		this.left = node;
	},

	setRightChild: function(node) {
		this.right = node;
	},
}
