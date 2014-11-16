var Tree = require("./lib/BTree");

module.exports = PATtree;

function PATtree() {
	this.tree = new Tree();
}

PATtree.prototype = {

	INTERNAL: "internal",
	EXTERNAL: "external",
	charBits: 15,
	addDocument: function(doc) {
		var sentenses = splitDocument(doc);
		for(var i = 0; i < sentenses.length; i++) {

		}
	},

	_insert: function(tree, nodeId, sistring) {
		var node = tree.getNode(nodeId);
		if(tree.isRoot(nodeId) && tree.root.data == null) {
			tree.setNodeData(nodeId, {
				type: this.EXTERNAL,
				sistring: sistring
			});
		} else if(node.data.type == this.INTERNAL) {
			var prefix = node.data.prefix;
			var position = node.data.position;
			var samePrefix = true;
			for(var i = 0; i < prefix.length; i++) {
				if(prefix[i] != sistring[i]) {
					samePrefix = false;
				}
			}
			if(samePrefix) {
				var branchBit = sistring[position].valueOf();
				if(branchBit == 0) {
					if(node.left == null) {
						var leftChild = tree.createNode();
						leftChild.data = {
							type: this.EXTERNAL,
							sistring: sistring
						};
						tree.appendLeftChild(nodeId, leftChild);
					} else {
						this._insert(tree, node.left.id, sistring);
					}
				} else if(branchBit == 1) {
					if(node.right == null) {
						var rightChild = tree.createNode();
						rightChild.data = {
							type: this.EXTERNAL,
							sistring: sistring
						}
						tree.appendRightChild(nodeId, rightChild);
					} else {
						this._insert(tree, node.right.id, sistring);						
					}
				} else {
					throw "invalid bit number";
				}
			} else { // the prefix of the sistring and all sistrings of the internal node do not match
				this._rebuildInternalSubtree(tree, node, sistring);
			}
		} else if(node.data.type == this.EXTERNAL) {
			this._rebuildInternalSubtree(tree, node, sistring);
		}
	},

	_rebuildInternalSubtree: function(tree, node, sistring) {
		var nodeString;
		if(node.data.type == this.INTERNAL) {
			nodeString = node.data.prefix;
		} else if(node.data.type == this.EXTERNAL) {
			nodeString = node.data.sistring;
		}
		var branchBit = this._findBranchPosition(nodeString, sistring);
		var parent = node.parent;
		var subtree = new Tree();


		var subtreeRoot = subtree.getRoot();
		subtreeRoot.data = {
			type: this.INTERNAL,
			position: branchBit,
			prefix: sistring.slice(0, branchBit)
		};

		var externalNode = subtree.createNode();
		externalNode.data = {
			type: this.EXTERNAL,
			sistring: sistring
		};

		var nodeBranchBit = nodeString[branchBit].valueOf();
		var sistringBranchBit = sistring[branchBit].valueOf();
		if(nodeBranchBit == 0 && sistringBranchBit == 1) {
			subtree.appendLeftChild(subtreeRoot.id, node);
			subtree.appendRightChild(subtreeRoot.id, externalNode);
		} else if(nodeBranchBit == 1 && sistringBranchBit == 0){
			subtree.appendLeftChild(subtreeRoot.id, externalNode);
			subtree.appendRightChild(subtreeRoot.id, node);
		} else {
			throw "wrong branch bit";
		}

		if(!parent) {
			tree.root = subtree.root;
		} else {
			if(tree.isLeftChild(node.id)) {
				tree.detachLeftChild(parent.id);
				tree.appendLeftChild(parent.id, subtree);
			} else if(tree.isRightChild(node.id)) {
				tree.detachRightChild(parent.id);
				tree.appendRightChild(parent.id, subtree);
			} else {
				throw "child is either left nor right";
			}				
		}
	},

	_checkPrefix: function(sis1, sis2, x) {
		var result = true;;
		for(var i = 0; i < x; i++) {
			if(sis1[i] != sis2[i]) {
				result = false;
				break;
			}
		}
		//console.log("result: " + result);
		return result;
	},

	_findBranchPosition: function(sis1, sis2) {
		var maxLen = Math.min(sis1.length, sis2.length);
		var i;
		for(i = 0; i < maxLen; i++) {
			if(sis1[i] != sis2[i]) {
				break;
			}
		}
		//console.log(i);
		return i;
	},

	_toBinary: function(s) {
		var output = "";
		for(var i = 0; i < s.length; i++) {
			output += s[i].charCodeAt(0).toString(2);
		}
		return output;
	},

	_splitDocument: function(doc) {
		var regex = /[，。,.\s]+/;
		var sentenses = doc.split(regex);
		return sentenses;
	},

	_test: function() {
		var tree = this.tree;
		this._insert(tree, tree.getRootId(), "00101");
		for(var key in tree.root.data) {
			console.log(key + ": " + tree.root.data[key]);
		}		
		console.log("");
		this._insert(tree, tree.getRootId(), "0011010");
		for(var key in tree.root.data) {
			console.log(key + ": " + tree.root.data[key]);
		}		
		console.log("");
		this._insert(tree, tree.getRootId(), "011010101011");
		for(var key in tree.root.data) {
			console.log(key + ": " + tree.root.data[key]);
		}		
		console.log("");
		this._insert(tree, tree.getRootId(), "00100000000000");
		for(var key in tree.root.data) {
			console.log(key + ": " + tree.root.data[key]);
		}		
		console.log("");		
		this._insert(tree, tree.getRootId(), "10100000000000");
		for(var key in tree.root.data) {
			console.log(key + ": " + tree.root.data[key]);
		}		
		console.log("");	
		this._insert(tree, tree.getRootId(), "10100001010101000");
		for(var key in tree.root.data) {
			console.log(key + ": " + tree.root.data[key]);
		}		
		console.log("");					
	},

	_testTree: function() {
		var tree = this.tree;
		var root = tree.getRoot();
		var rootId = tree.getRootId();
		var node1 = tree.createNode();
		var node2 = tree.createNode();
		var node3 = tree.createNode();
		var node4 = tree.createNode();
		var node5 = tree.createNode();
		var node6 = tree.createNode();
		var node7 = tree.createNode();
		var node8 = tree.createNode();
		var node9 = tree.createNode();
		var node10 = tree.createNode();
		tree.appendLeftChild(root.id, node1);
		tree.appendRightChild(root.id, node2);
		tree.appendLeftChild(node1.id, node3);
		tree.appendRightChild(node1.id, node4);
		tree.appendLeftChild(node2.id, node5);
		tree.appendRightChild(node2.id, node6);
		tree.appendLeftChild(node3.id, node7);
		tree.appendRightChild(node3.id, node8);
		tree.appendLeftChild(node7.id, node9);
		tree.appendRightChild(node7.id, node10);

		var leftChildId = tree.getLeftChild(node7.id).id;
		var rightChildId = tree.getRightChild(node7.id).id;
		console.log("left child id: " + leftChildId);
		console.log("right child id: " + rightChildId);
		console.log("node7 id: " + tree.getNode(node7.id).id);

		tree.setNodeData(node7.id, {
			position: 7,
			type: "external",
			sistring: "00101101"
		});

		console.log("node1 parent: " + node1.parent.id);
		console.log("node3 parent: " + node3.parent.id);
		console.log("node4 parent: " + node4.parent.id);

		//tree._remove(node7);
		console.log("parent of node 7: " + tree.getNode(node7.id).parent.id)
		tree.reparentToRight(node7.id, node5.id);
		console.log("parent of node 7: " + tree.getNode(node7.id).parent.id);
		console.log("node 5 id: " + node5.id);
		console.log("node 5 is left child: " + tree.isLeftChild(node5.id));
		console.log("node 5 is right child: " + tree.isRightChild(node5.id));
	}

}




var PATtree = new PATtree();

var argvs = process.argv;
var command = argvs[2];
var params = process.argv.slice(3, argvs.length);
PATtree[command].apply(PATtree, params);
