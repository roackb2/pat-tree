var Node = require("./Node.js");

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
		if(!node.parent) {
			console.trace();
			throw "no parent";
		} else {
			return node.parent;
		}
	},

	//checked
	getLeftChild: function(node) {
		if(!node.left) {
			console.trace();
			throw "no left child";
		} else {
			return node.left;
		}
	},

	//checked
	getRightChild: function(node) {
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
		this._preOrderTraverse(this.root, callback);
	},

	inOrderTraverse: function(callback) {
		this._inOrderTraverse(this.root, callback);
	},

	postOrderTraverse: function(callback) {
		this._postOrderTraverse(this.root, callback);
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
		if(node) {
			this._remove(node);
			return true;
		} else {
			return false;
		}
	},

	//checked
	reparentToLeft: function(node, newParent) {
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
		if(node.id == id) {
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

	_preOrderTraverse: function(node, callback) {
		callback(node);
		if(node.left) {
			this._preOrderTraverse(node.left, callback);
		}
		if(node.right) {
			this._preOrderTraverse(node.right, callback);
		}
		return;
	},

	_inOrderTraverse: function(node, callback) {
		if(node.left) {
			this._inOrderTraverse(node.left, callback);
		}
		callback(node);
		if(node.right) {
			this._inOrderTraverse(node.right, callback);
		}
		return;
	},

	_postOrderTraverse: function(node, callback) {
		if(node.left) {
			this._postOrderTraverse(node.left, callback);
		}
		if(node.right) {
			this._postOrderTraverse(node.right, callback);
		}
		callback(node);
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
