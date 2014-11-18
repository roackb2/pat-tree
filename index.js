var Tree = require("./lib/BTree");

module.exports = PATtree;

function PATtree() {
	this.tree = new Tree(0);
	this.documents = [];
	this.maxSistringLength = 0;
	this.index = 1;
}

PATtree.prototype = {

	INTERNAL: "internal",
	EXTERNAL: "external",

	addDocument: function(doc) {
		var sentenses = this._splitDocument(doc);
		var preIndex = this.documents.length.toString();
		for(var i = 0; i < sentenses.length; i++) {
			var index = preIndex + "." + i.toString();
			this._addSentense(sentenses[i], index);
		}
		this.documents.push(sentenses);
	},

	_addSentense: function(sentense, sentenseIndex) {
		var preIndex = sentenseIndex + ".";
		for(var i = 0; i < sentense.length; i++) {
			var charSistring = sentense.slice(i, sentense.length);
			var sistring = this._toBinary(charSistring);
			var index = preIndex + i.toString();
			this._addSistring(sistring, index);
			//console.log("\tafter adding sistring " + charSistring + ":\n");
			//console.log("check connection: " + this._checkConnections());
			//this._printTreeContent();			
		}
	},

	_addSistring: function(sistring, index) {
		var tree = this.tree;
		if(sistring.length > this.maxSistringLength) {
			this.maxSistringLength = sistring.length;
		} else {
			for(var i = sistring.length; i < this.maxSistringLength; i++) {
				sistring += "0";
			}			
		}
		this._appendZeroes(this.maxSistringLength);		
		//console.log(sistring);
		this._insert(tree, tree.root.id, sistring, index);
	},

	_insert: function(tree, nodeId, sistring, index) {
		var node = tree.getNode(nodeId);
		if(tree.isRoot(nodeId) && tree.root.data == null) {
			tree.setNodeData(nodeId, {
				type: this.EXTERNAL,
				index: index,
				sistring: sistring,
				count: 1
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
						var leftChild = this._createNode();
						leftChild.data = {
							type: this.EXTERNAL,
							sistring: sistring,
							index: index,
							count: 1
						};
						tree.appendLeftChild(nodeId, leftChild);
					} else {
						this._insert(tree, node.left.id, sistring, index);
					}
				} else if(branchBit == 1) {
					if(node.right == null) {
						var rightChild = this._createNode();
						rightChild.data = {
							type: this.EXTERNAL,
							sistring: sistring,
							index: index,
							count: 1
						}
						tree.appendRightChild(nodeId, rightChild);
					} else {
						this._insert(tree, node.right.id, sistring, index);						
					}
				} else {
					throw "invalid bit number";
				}
			} else { // the prefix of the sistring and all sistrings of the internal node do not match
				this._rebuildInternalSubtree(tree, node, sistring, index);
			}
		} else if(node.data.type == this.EXTERNAL) {
			if(node.data.sistring == sistring) {
				node.data.count++;
			} else {
				this._rebuildInternalSubtree(tree, node, sistring, index);
			}
		} else {
			throw "invalid node type (neither internal nor external)";
		}
	},

	_rebuildInternalSubtree: function(tree, node, sistring, index) {
		/*
		if(!this._checkConnections()) {
			throw "tree broken";
		}
		*/
		var nodeString;
		var sistrings = [];

		if(node.data.type == this.INTERNAL) {
			nodeString = node.data.prefix;
			sistrings = sistrings.concat(node.data.sistrings);
		} else if(node.data.type == this.EXTERNAL) {
			nodeString = node.data.sistring;
			sistrings.push(node);
		}
		var branchBit = this._findBranchPosition(nodeString, sistring);
		var parent = node.parent;
		var subtree = this._createSubTree();

		var externalNode = this._createNode();
		externalNode.data = {
			type: this.EXTERNAL,
			sistring: sistring,
			index: index,
			count: 1
		};

		sistrings.push(externalNode);

		var subtreeRoot = subtree.getRoot();
		subtreeRoot.data = {
			type: this.INTERNAL,
			position: branchBit,
			prefix: sistring.slice(0, branchBit),
			sistrings: sistrings
		};



		var type = tree.getNodeType(node.id);

		if(type == "left") {
			tree.detachLeftChild(parent.id);
		} else if(type == "right") {
			tree.detachRightChild(parent.id);
		}

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



		if(type == "root") {
			tree.root = subtree.root;
		} else if(type == "left") {
			tree.appendLeftChild(parent.id, subtree);					
		} else if(type == "right") {
			tree.appendRightChild(parent.id, subtree);
		}
		/*
		if(!this._checkConnections()) {
			throw "tree broken while inserting sistring " + sistring;
		}
		*/
	},

	_appendZeroes: function(length) {
		var tree = this.tree;
		var external = this.EXTERNAL;
		tree.preOrderTraverse(function(node) {
			if(node.data && node.data.type == external) {
				var sistring = node.data.sistring;
				var sistringLen = sistring.length;
				if(sistringLen < length) {
					for(var i = sistringLen; i < length; i++) {
						node.data.sistring += "0";
					}
				}
			}
		});
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
		//console.log(output);
		return output;
	},

	_restoreSistring: function(sistring, index) {
		var indexes = index.split(".");
		var docIndex = indexes[0];
		var sentenseIndex = indexes[1];
		var wordIndex = indexes[2];

		//console.log(" doc index: " + docIndex);
		//console.log(" sentense index: " + sentenseIndex);
		//console.log(" word index: " + wordIndex);

		var output = "";
		var sentense = this.documents[docIndex][sentenseIndex];
		//console.log(" sentense: " + sentense);
		var comparison = "";
		for(var i = wordIndex; i < sentense.length && comparison.length != sistring.length; i++) {
			var arr = [];
			var word = sentense[i];
			arr.push(sentense[i]);
			//console.log(" word: " + word);
			comparison += this._toBinary(arr);
			output += word;
		}

		return output;
	},

	_toString: function(b) {
		var output = "";
		var temp = 0;
		var charCount = b.length / 15;
		for(var i = 0; i < charCount; i++) {
			var binary = b.slice(i * 15, (i + 1) * 15);
			var number = parseInt(binary, 2);
			output += String.fromCharCode(number);
		}
		return output;
	},

	_splitDocument: function(doc) {
		var regex = /[，。,.\s]+/;
		var sentenses = doc.split(regex);
		return sentenses;
	},

	_printTreeContent: function() {
		var tree = this.tree;
		var owner = this;
		tree.preOrderTraverse(function(node) {
			console.log("id: " + node.id);
			var type = tree.getNodeType(node.id);
			console.log(type);
			if(type != "root") {
				console.log("parent: " + node.parent.id);
			}
			console.log("type: " + node.data.type);
			if(node.data.type == owner.INTERNAL) {
				console.log("position: " + node.data.position);
				console.log("prefix: " + node.data.prefix);
				console.log("sistrings: ");
				for(var i = 0; i < node.data.sistrings.length; i++) {
					var externalNodeData = node.data.sistrings[i].data;
					console.log(" sistring: " + owner._restoreSistring(externalNodeData.sistring, externalNodeData.index));
					console.log(" count: " + externalNodeData.count);
				}				
			} else if(node.data.type == owner.EXTERNAL) {
				console.log("sistring: " + owner._restoreSistring(node.data.sistring, node.data.index));
				console.log("index: " + node.data.index);
				console.log("count: " + node.data.count);
			}
			console.log();
		});		
	},

	_checkConnections: function() {
		var tree = this.tree;
		var result = true;
		tree.preOrderTraverse(function(node) {
			if(!tree.isRoot(node.id)) {
				var nodeId = node.id;
				var parent = node.parent;
				if(!parent) {
					console.log("node " + node.id + " lost its parent");
					result = false;
				}
			}
		});
		return result;
	},

	_createNode: function() {
		var tree = this.tree;
		var node = tree.createNode(this.index);
		this.index++;
		return node;
	},

	_createSubTree: function() {
		var tree = new Tree(this.index);
		this.index++;
		return tree;
	},

}


