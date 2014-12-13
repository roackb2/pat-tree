var Tree = require("./lib/BTree");
var Node = require("./lib/Node.js");

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

	toJSON: function() {
		var result = {};
		var header = {};
		header.maxSistringLength = this.maxSistringLength;
		header.index = this.index;
		result.header = header;
		var documents = [];
		for(var i = 0; i < this.documents.length; i++) {
			var doc = {};
			doc.id = i;
			doc.sentenses = this.documents[i];
			documents.push(doc);
		}
		result.documents = documents;
		var tree = [];
		this.preOrderTraverse(function(node) {
			var item = {};
			for(var key in node) {
				if(node[key] instanceof Node) {
					item[key] = node[key].id;
				} else if(!(typeof node[key] == 'function')){
					item[key] = node[key];
				}
			}
			tree.push(item);
		});	
		result.tree = tree;
		return result;
		
	},

	reborn: function(json) {
		this.maxSistringLength = json.header.maxSistringLength;
		this.index = json.header.index;
		json.documents.sort(function(item1, item2) {
			return item1.id - item2.id;
		})
		json.tree.sort(function(item1, item2) {
			return item1.id - item2.id;
		})
		for(var i = 0; i < json.documents.length; i++) {
			this.documents.push(json.documents[i].sentenses);
		}
		this.tree = new Tree(0);
		var nodes = [];
		for(var i = 0; i < json.tree.length; i++) {
			var node = new Node();
			nodes[json.tree[i].id] = node.reborn(json.tree[i]);
		}
		for(var i = 0; i < nodes.length; i++) {
			if(nodes[i]) {
				if(nodes[i].id != i) {
					correct = false;
					throw "index and id not aligned, index: " + i + ", id: " + nodes[i].id; 
				}
				var node = nodes[i];
				if(node.parent != null) {
					node.parent = nodes[node.parent];
				} else {
					this.tree.root = node;
				}
				if(node.left != null) {
					node.left = nodes[node.left];
				}
				if(node.right != null) {
					node.right = nodes[node.right];
				}
				if(node.sistringRepres) {
					node.sistringRepres = nodes[node.sistringRepres];
				}				
			}

		}
	}, 


	traverse: function(preCallback, inCallback, postCallback) {
		this.tree.traverse(preCallback, inCallback, postCallback);
	},

	preOrderTraverse: function(callback) {
		this.tree.preOrderTraverse(callback);
	},

	inOrderTraverse: function(callback) {
		this.tree.inOrderTraverse(callback);
	},

	postOrderTraverse: function(callback) {
		this.tree.postOrderTraverse(callback);
	},

	segmentDoc: function(doc, SLPs) {
		var result = "";					;	
		for(var i = 0; i < doc.length; i++) {
			var subContent = doc.slice(i, doc.length);
			var index = -1;
			var keyword = doc.charAt(i);
			for(var j = 0; j < SLPs.length; j++) {
				index = subContent.indexOf(SLPs[j]);
				if(index == 0) {
					keyword = SLPs[j];
					i += keyword.length - 1;
					break;
				}
			}
			result += " " + keyword;
		}
		return result;
	},

	extractSLP: function(TFTrheshold, SETreshold, verbose) {
		var owner = this;
		var totalFrequency = this.tree.root.totalFrequency;
		var lexicalPatters = [];
		var result = [];
		var sistrings = [];
		if(verbose) {
			console.log("collecting internal nodes");
		}
		this.preOrderTraverse(function(node) {
			if(node.type == owner.INTERNAL && node.totalFrequency > TFTrheshold) {
				var sistring = owner._restorePrefix(node);					
				if(sistring != "" && sistrings.indexOf(sistring) == -1) {
					var map = {};
					map.sistring = sistring;
					map.frequency = node.totalFrequency / totalFrequency;
					map.candidate = true;
					map.se = -1;
					lexicalPatters.push(map);
					sistrings.push(sistring);
					if(verbose && lexicalPatters.length % 1000 == 0) {
						console.log("done collecting No." + lexicalPatters.length + " node");
					}					
				}
			}
		});

		if(verbose) {
			console.log("collection completed, number of nodes: " + lexicalPatters.length + ", sorting nodes");			
		}
		lexicalPatters.sort(function(item1, item2) {
			return item2.sistring.length - item1.sistring.length;
		});
		sistrings.sort(function(item1, item2) {
			return item2.length - item1.length;
		});

		if(verbose) {
			console.log("start marking candidates")
		}
		for(var i = 0; i < lexicalPatters.length; i++) {
			if(lexicalPatters[i].sistring != sistrings[i]) {
				throw "internal error, sistrings not aligned.";
			}

			var map = lexicalPatters[i];
			if(map.candidate) {
				var sistring = map.sistring;
			
				var fstOverlapString = sistring.slice(0, sistring.length - 1);
				var sndOverlapString = sistring.slice(1, sistring.length);

				var fstOverlap = lexicalPatters[sistrings.indexOf(fstOverlapString)];
				var sndOverlap = lexicalPatters[sistrings.indexOf(sndOverlapString)];


				if(fstOverlap && sndOverlap) {
					map.se = map.frequency / (fstOverlap.frequency + sndOverlap.frequency - map.frequency);							
				} else if(fstOverlap) {
					map.se = map.frequency / (fstOverlap.frequency - map.frequency);				
				} else if(sndOverlap) {
					map.se = map.frequency / (sndOverlap.frequency - map.frequency);
				}

				if(map.se > SETreshold) {
					if(fstOverlap) {
						fstOverlap.candidate = false;					
					} 
					if(sndOverlap) {
						sndOverlap.candidate = false;
					}
				}

				result.push(map.sistring);
				if(verbose && result.length % 1000 == 0) {
					console.log("done processing No." + result.length + " item");
				}
			}
		} 
		if(verbose) {
			console.log("extracting SLP completes, total " + result.length + " SLPs")
		}
		return result;
	},

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
		}
	},

	_addSistring: function(sistring, index) {
		var tree = this.tree;
		if(sistring.length > this.maxSistringLength) {
			this.maxSistringLength = sistring.length;
			this._appendZeroes(this.maxSistringLength);					
		} else {
			sistring += Array(this.maxSistringLength - sistring.length + 1).join("0");		
		}
		this._insert(tree, tree.root, sistring, index);
	},

	_insert: function(tree, node, sistring, index) {
		var indexes = [];
		indexes.push(index);
		if(tree.isRoot(node) && !tree.root.type) {
			node.type = this.EXTERNAL;
			node.sistring = sistring;
			node.indexes = indexes;
		} else if(node.type == this.INTERNAL) {
			var prefix = node.prefix;
			var position = node.position;
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
						leftChild.type = this.EXTERNAL;
						leftChild.sistring = sistring;
						leftChild.indexes = indexes;
						tree.appendLeftChild(node, leftChild);
					} else {
						this._insert(tree, node.left, sistring, index);
					}
				} else if(branchBit == 1) {
					if(node.right == null) {
						var rightChild = this._createNode();
						rightChild.type = this.EXTERNAL;
						rightChild.sistring = sistring;
						rightChild.indexes = indexes;
						tree.appendRightChild(node, rightChild);
					} else {
						this._insert(tree, node.right, sistring, index);						
					}
				} else {
					throw "invalid bit number";
				}
			} else { // the prefix of the sistring and all sistringRepres of the internal node do not match
				this._rebuildInternalSubtree(tree, node, sistring, index);
			}
		} else if(node.type == this.EXTERNAL) {
			if(node.sistring == sistring) {
				node.indexes.push(index);
			} else {
				this._rebuildInternalSubtree(tree, node, sistring, index);
			}
		} else {
			throw "invalid node type (neither internal nor external)";
		}
	},

	_rebuildInternalSubtree: function(tree, node, sistring, index) {

		var nodeString;
		var indexes = [];

		indexes.push(index);

		if(node.type == this.INTERNAL) {
			nodeString = node.prefix;
		} else if(node.type == this.EXTERNAL) {
			nodeString = node.sistring;
		}
		var branchBit = this._findBranchPosition(nodeString, sistring);
		var parent = node.parent;
		var subtree = this._createSubTree();

		var externalNode = this._createNode();
		externalNode.type = this.EXTERNAL;
		externalNode.sistring = sistring;
		externalNode.indexes = indexes;

		var subtreeRoot = subtree.getRoot();
		subtreeRoot.type = this.INTERNAL;
		subtreeRoot.position = branchBit;
		subtreeRoot.prefix = sistring.slice(0, branchBit);
		subtreeRoot.externalNodeNum = 0;
		subtreeRoot.totalFrequency = 0;
		subtreeRoot.sistringRepres = externalNode;

		var type = tree.getNodeType(node);

		if(type == "left") {
			tree.detachLeftChild(parent);
		} else if(type == "right") {
			tree.detachRightChild(parent);
		}

		var nodeBranchBit = nodeString[branchBit].valueOf(); 
		var sistringBranchBit = sistring[branchBit].valueOf();
		if(nodeBranchBit == 0 && sistringBranchBit == 1) {
			subtree.appendLeftChild(subtreeRoot, node);
			subtree.appendRightChild(subtreeRoot, externalNode);
		} else if(nodeBranchBit == 1 && sistringBranchBit == 0){
			subtree.appendLeftChild(subtreeRoot, externalNode);
			subtree.appendRightChild(subtreeRoot, node);
		} else {
			throw "wrong branch bit";
		}

		if(type == "root") {
			tree.root = subtree.root;
		} else if(type == "left") {
			tree.appendLeftChild(parent, subtree);					
		} else if(type == "right") {
			tree.appendRightChild(parent, subtree);
		}

		this._updateParents(subtreeRoot);
	},

	_updateParents: function(node) {
		var owner = this;
		var left = node.left;
		var right = node.right;
		var externalNodeNum = 0;
		var totalFrequency = 0;
		if(left && right) {
			if(left.type == owner.INTERNAL) {
				externalNodeNum += left.externalNodeNum;
				totalFrequency += left.totalFrequency;
			} else if(left.type == owner.EXTERNAL) {
				externalNodeNum += 1;
				totalFrequency += left.indexes.length;
			} else {
				console.trace();
				throw "unknown node type (neither internal nor external)"
			}
			if(right.type == owner.INTERNAL) {
				externalNodeNum += right.externalNodeNum;
				totalFrequency += right.totalFrequency;
			} else if(right.type == owner.EXTERNAL) {
				externalNodeNum += 1;
				totalFrequency += right.indexes.length;
			} else {
				console.trace();
				throw "unknown node type (neither internal nor external)"
			}
		} else {
			console.trace();
			throw "internal node lost left or right child"
		}
		node.externalNodeNum = externalNodeNum;
		node.totalFrequency = totalFrequency;
		if(node.parent) {
			this._updateParents(node.parent);
		}
	},

	_appendZeroes: function(length) {
		var tree = this.tree;
		var external = this.EXTERNAL;
		tree.preOrderTraverse(function(node) {
			if(node && node.type == external) {
				var sistringLen = node.sistring.length;;
				if(sistringLen < length) {
					node.sistring += Array(length - sistringLen + 1).join("0");
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
		return i;
	},

	_toBinary: function(s) {
		var output = "";
		for(var i = 0; i < s.length; i++) {
			output += s[i].charCodeAt(0).toString(2);
		}
		return output;
	},

	_restoreSistring: function(externalNode) {
		var sistring = externalNode.sistring;
		var index = externalNode.indexes[0];
		var indexes = index.split(".");
		var docIndex = indexes[0];
		var sentenseIndex = indexes[1];
		var wordIndex = indexes[2];
		var output = "";
		var sentense = this.documents[docIndex][sentenseIndex];
		var comparison = "";
		for(var i = wordIndex; i < sentense.length && comparison.length != sistring.length; i++) {
			var arr = [];
			var word = sentense[i];
			arr.push(sentense[i]);
			comparison += this._toBinary(arr);
			output += word;
		}

		return output;
	},

	_restorePrefix: function(internalNode) {
		var prefix = internalNode.prefix;
		var externalNode = internalNode.sistringRepres;
		var index = externalNode.indexes[0];
		var indexes = index.split(".");
		var docIndex = indexes[0];
		var sentenseIndex = indexes[1];
		var wordIndex = indexes[2];

		var output = "";
		var sentense = this.documents[docIndex][sentenseIndex];
		var comparison = "";
		for(var i = wordIndex; i < sentense.length && comparison.length < prefix.length; i++) {
			var arr = [];
			var word = sentense[i];
			arr.push(sentense[i]);

			var binaryWord = this._toBinary(arr);
			if(comparison.length + binaryWord.length >= prefix.length) {
				break;
			} else {
				comparison += binaryWord;
				output += word;
			}
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

	printTreeContent: function(printExternalNodes, printDocuments) {
		var tree = this.tree;
		var owner = this;
		this.preOrderTraverse(function(node) {
			console.log("id: " + node.id);
			var type = tree.getNodeType(node);
			console.log(type);
			if(type != "root") {
				console.log("parent: " + node.parent.id);
			}
			console.log("type: " + node.type);
			if(node.type == owner.INTERNAL) {
				console.log("position: " + node.position);
				console.log("prefix: " + owner._restorePrefix(node));
				console.log("externalNodeNum: " + node.externalNodeNum);
				console.log("totalFrequency: " + node.totalFrequency);
				if(printExternalNodes)
				{
					console.log("sistringRepres: ");
					var externalNode = node.sistringRepres;
					console.log(" sistring: " + owner._restoreSistring(externalNode));
					console.log(" indexes: " + externalNode.indexes);												
				}
	
			} else if(node.type == owner.EXTERNAL) {
				console.log("sistring: " + owner._restoreSistring(node));
				console.log("indexes: " + node.indexes);
			}
			console.log();
		});	
		if(printDocuments)
		{
			console.log("documents:");
			console.log(this.documents); 	
		}
	},

	_checkConnections: function() {
		var tree = this.tree;
		var result = true;
		tree.preOrderTraverse(function(node) {
			if(!tree.isRoot(node)) {
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


