var uuid = require("../node_modules/node-uuid").v4;

module.exports = BTree;

function BTree(id) {
 	this.root = new Node(id);
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

	isRoot: function(node) {
		return this.root.id == node.id;
	},

	isLeftChild: function(node) {
		//console.log(this.root.id);
		//var node = this.getNode(childId);
		if(!node.parent) {
			console.trace();
			throw "no parent"; 
		} else {
			var parent = node.parent;
			if(parent.left != null && parent.left.id == node.id) {
				return true;
			} else {
				return false;
			}			
		}
	},

	isRightChild: function(node) {
		//var node = this.getNode(childId)
		if(!node.parent) {
			console.trace();
			throw "no parent"; 
		} else {
			var parent = node.parent;
			if(parent.right != null && parent.right.id == node.id) {
				return true;
			} else {
				return false;
			}			
		}
	},

	getNodeType: function(node) {
		//var node = this.getNode(id);
		var type;
		if(this.isRoot(node)) {
			type = "root";
		} else if(this.isLeftChild(node)) {
			type = "left";
		} else if(this.isRightChild(node)) {
			type = "right";
		} else {
			throw "unknown position";
		}
		return type;
	},

	//checked
	getNode: function(id) {
		var node = this._find(this.root, id);
		if(!node) {
			console.trace();
			throw "node not found";
		}
		return node;
	},

	//checked
	getNodeId: function(node) {
		return node.id;
	},

	getParent: function(node) {
		//var node = this.getNode(id);
		if(!node.parent) {
			console.trace();
			throw "no parent";
		} else {
			return node.parent;
		}
	},

	//checked
	getLeftChild: function(node) {
		//var node = this.getNode(id);
		if(!node.left) {
			console.trace();
			throw "no left child";
		} else {
			return node.left;
		}
	},

	//checked
	getRightChild: function(node) {
		//var node = this.getNode(id);
		if(!node.right) {
			console.trace();
			throw "no right child";
		} else {
			return node.right;
		}
	},

	traverse: function(preCallback, inCallback, postCallback) {
		this._traverse(this.root, preCallback, inCallback, postCallback);
	},

	preOrderTraverse: function(callback) {
		this._traverse(this.root, callback);
	},

	inOrderTraverse: function(callback) {
		this._traverse(this.root, null, callback);
	},

	postOrderTraverse: function(callback) {
		this._traverse(this.root, null, null, callback);
	},

	//checked
	createNode: function(id) {
		return new Node(id);
	},

	//checked
	setNodeData: function(node, data) {
		//var node = this.getNode(id);
		node.data = data;
	},

	//checked
	appendLeftChild: function(node, subtree) {
		//var node = this.getNode(id);
		if(node.left) {
			console.trace();
			throw "left child exists";
		} else {
			var target;
			if(subtree instanceof BTree){
				target = subtree.root;
			} else if(subtree instanceof Node) {
				target = subtree;
			} else {
				console.trace();
				throw "subtree must be instance of Node or BTree."
			}
			node.left = target;
			target.parent = node;
			return true;
		}
	},

	//checked
	appendRightChild: function(node, subtree) {
		//var node = this.getNode(id);
		if(node.right) {
			console.trace();
			throw "right child exists";
		} else {
			var target;
			if(subtree instanceof BTree) {
				target = subtree.root;
			} else if(subtree instanceof Node) {
				target = subtree;
			} else {
				console.trace();
				throw "subtree must be instance of Node or BTree."
			}
			node.right = target;
			target.parent = node;
			return true;
		}
	},

	detachLeftChild: function(node) {
		//var node = this.getNode(id);
		if(!node.left) {
			return;
		} else {
			leftChild = node.left;
			node.left = null;
			leftChild.parent = null;
			return leftChild;
		}
	},

	detachRightChild: function(node) {
		//var node = this.getNode(id);
		if(!node.right) {
			return;
		} else {
			rightChild = node.right;
			node.right = null;
			rightChild.parent = null;
			return rightChild;
		}
	},

	removeSubtree: function(node) {
		//var node = this.getNode(id);
		if(node) {
			this._remove(node);
			return true;
		} else {
			return false;
		}
	},

	//checked
	reparentToLeft: function(node, newParent) {
		//var node = this.getNode(id);
		//var newParent = this.getNode(newParentId);
		if(newParent.left) {
			console.trace();
			throw "left child exists";
		} else {
			var oldParent = node.parent;
			newParent.left = node;
			node.parent = newParent;
			if(oldParent.left.id == node.id) {
				oldParent.left = null;
			} else if (oldParent.right.id == node.id) {
				oldParent.right = null;
			}
			return true;
		}
	},

	//checked
	reparentToRight: function(node, newParent) {
		//var node = this.getNode(id);
		//var newParent = this.getNode(newParentId);
		if(newParent.right) {
			console.trace();
			throw "right child exists";
		} else {
			var oldParent = node.parent;
			newParent.right = node;
			node.parent = newParent;
			if(oldParent.left.id == node.id) {
				oldParent.left = null;
			} else if(oldParent.right.id == node.id) {
				oldParent.right = null;
			}
			return true;
		}
	},

	//checked
	_find: function(node, id) {
		//console.log(node.id);
		if(node.id === id) {
			return node; 
		} else if(!node.left && !node.right) {
			return;
		} else if(!node.left) {
			return this._find(node.right, id);
		} else if(!node.right) {
			return this._find(node.left, id);
		} else {
			var leftResult = this._find(node.left, id);
			if(!leftResult) {
				var rightResult = this._find(node.right, id);
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

	_traverse: function(node, preCallback, inCallback, postCallback) {
		if(preCallback) {
			preCallback(node);			
		}
		if(node.left) {
			this._traverse(node.left, preCallback, inCallback, postCallback);
		}
		if(inCallback) {
			inCallback(node);
		}
		if(node.right) {
			this._traverse(node.right, preCallback, inCallback, postCallback);
		}
		if(postCallback) {
			postCallback(node);
		}
		return;
	},

	_remove: function(node) {
		var result = true;
		if(!node) {
			console.trace();
			throw "missing parameter"
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
