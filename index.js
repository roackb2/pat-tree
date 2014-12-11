var utils = require('./lib/utils.js');


module.exports = PATtree;



function PATtree() {
	this.tree = [];
	var header = {};
	header.pos = 0;
	header.maxSistringLength = 0;
	this.tree[0] = header;
	this.documents = [];
	//this.maxSistringLength = 0;
}

PATtree.prototype = {

	INTERNAL: "internal",
	EXTERNAL: "external",

	/*
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
	*/

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

	extractSLP: function(TFTrheshold, SETreshold) {
		var owner = this;
		var totalFrequency = this.tree.root.data.totalFrequency;
		var lexicalPatters = [];
		var result = [];
		this.preOrderTraverse(function(node) {
			if(node.data.type == owner.INTERNAL) {
				var sistring = owner._restorePrefix(node);
				if(sistring != "" && node.data.totalFrequency > TFTrheshold) {
					var map = {};
					map.sistring = sistring;
					map.frequency = node.data.totalFrequency / totalFrequency;
					map.candidate = true;
					map.se = -1;
					lexicalPatters.push(map);
				}
			}
		})
		//console.log("lexical patterns count: " + lexicalPatters.length);
		lexicalPatters.sort(function(item1, item2) {
			return item2.sistring.length - item1.sistring.length;
		});

		for(var i = 0; i < lexicalPatters.length; i++) {
			var sistring = lexicalPatters[i].sistring;
			//console.log("sistring: " + sistring);
			var fstOverlapIndex = -1;
			var sndOverlapIndex = -1;
			var fstOverlapString = sistring.slice(0, sistring.length - 1);
			var sndOverlapString = sistring.slice(1, sistring.length);

			for(var j = i; j < lexicalPatters.length; j++) {
				if(lexicalPatters[j].sistring == fstOverlapString) {
					fstOverlapIndex = j;
				}
				if(lexicalPatters[j].sistring == sndOverlapString) {
					sndOverlapIndex = j;
				}
			}

			var map = lexicalPatters[i];
			var fstOverlap;
			var sndOverlap;
			if(fstOverlapIndex != -1 && sndOverlapIndex != -1) {
				fstOverlap = lexicalPatters[fstOverlapIndex];				
				sndOverlap = lexicalPatters[sndOverlapIndex];	
				map.se = map.frequency / (fstOverlap.frequency + sndOverlap.frequency - map.frequency);							
			} else if(fstOverlapIndex != -1) {
				fstOverlap = lexicalPatters[fstOverlapIndex];				
				map.se = map.frequency / (fstOverlap.frequency - map.frequency);				
			} else if(sndOverlapIndex != -1) {
				sndOverlap = lexicalPatters[sndOverlapIndex];	
				map.se = map.frequency / (sndOverlap.frequency - map.frequency);
			}

			if(map.se > SETreshold) {
				if(fstOverlapIndex != -1) {
					fstOverlap.candidate = false;					
				} 
				if(sndOverlapIndex != -1) {
					sndOverlap.candidate = false;
				}
			}

			if(map.candidate && result.indexOf(map.sistring) == -1) {
				result.push(map.sistring);
			}
			//console.log("end of processing " + i + "th item");
		} 
		return result;
	},

	addDocument: function(doc) {
		var sentenses = utils.splitDocument(doc);
		var preIndex = this.documents.length.toString();
		for(var i = 0; i < sentenses.length; i++) {
			var index = preIndex + "." + i.toString();
			this._addSentense(sentenses[i], index);
		}
		var doc = {};
		doc.pos = this.documents.length;
		doc.sentenses = sentenses;
		this.documents.push(doc);
	},

	_addSentense: function(sentense, sentenseIndex) {
		var preIndex = sentenseIndex + ".";
		for(var i = 0; i < sentense.length; i++) {
			var charSistring = sentense.slice(i, sentense.length);
			var sistring = utils.toBinary(charSistring);
			var index = preIndex + i.toString();
			this._addSistring(sistring, index);
			//console.log("\tafter adding sistring " + charSistring + ":\n");
			//console.log("check connection: " + this._checkConnections());
			//this.printTreeContent();			
		}
	},

	_addSistring: function(sistring, index) {
		var tree = this.tree;
		//console.log("maxSistringLength: " + this.tree[0].maxSistringLength);
		if(sistring.length > this.tree[0].maxSistringLength) {
			this.tree[0].maxSistringLength = sistring.length;
			this._appendZeroes(this.tree[0].maxSistringLength);		
			//console.log(this.tree);			
		} else {
			for(var i = sistring.length; i < this.tree[0].maxSistringLength; i++) {
				sistring += "0";
			}		
			//console.log("sistring length: " + sistring.length);	
		}
		//console.log(sistring);
		this._insert(this.tree[1], sistring, index);
		//this._updateParents();				
	},

	_insert: function(node, sistring, index) {
		//var node = tree.getNode(nodeId);
		var indexes = [];
		indexes.push(index);
		if(this.tree.length == 1) {
			node = {};
			node.pos = 1;
			node.type = this.EXTERNAL;
			node.sistring = sistring;
			node.indexes = indexes;
			this.tree[1] = node;
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
					var leftPos = 2 * node.pos;
					if(!this.tree[leftPos]) {
						var leftChild = {};
						leftChild.pos = leftPos;
						leftChild.type = this.EXTERNAL;
						leftChild.sistring = sistring;
						leftChild.indexes = indexes;
						this.tree[leftPos] = leftChild;
					} else {
						this._insert(this.tree[leftPos], sistring, index);
					}
				} else if(branchBit == 1) {
					var rightPos = 2 * node.pos + 1;
					if(!this.tree[rightPos]) {
						var rightChild = {};
						rightChild.pos = rightPos;
						rightChild.type = this.EXTERNAL;
						rightChild.sistring = sistring;
						rightChild.indexes = indexes;
						this.tree[rightPos] = rightChild;
					} else {
						this._insert(this.tree[rightPos], sistring, index);						
					}
				} else {
					throw "invalid bit number";
				}
			} else { // the prefix of the sistring and all sistringRepres of the internal node do not match
				this._rebuildInternalSubtree(node, sistring, index);
			}
		} else if(node.type == this.EXTERNAL) {
			if(node.sistring == sistring) {
				node.indexes.push(index);
			} else {
				this._rebuildInternalSubtree(node, sistring, index);
			}
		} else {
			throw "invalid node type (neither internal nor external): " + node.type; 
		}
	},

	_rebuildInternalSubtree: function(node, sistring, index) {

		var nodeString;
		var indexes = [];

		indexes.push(index);

		if(node.type == this.INTERNAL) {
			nodeString = node.prefix;
		} else if(node.type == this.EXTERNAL) {
			nodeString = node.sistring;
		}
		var branchBit = utils.findBranchPosition(nodeString, sistring);
		var parent = this._getParent(node.pos);
		//var subtree = this._createSubTree();

		var externalNode = {}//this._createNode();
		externalNode.type = this.EXTERNAL;
		externalNode.sistring = sistring;
		externalNode.indexes = indexes;


		var subtreeRoot = {};//subtree.getRoot();
		subtreeRoot.pos = node.pos;
		subtreeRoot.type = this.INTERNAL;
		subtreeRoot.position = branchBit;
		subtreeRoot.prefix = sistring.slice(0, branchBit);
		subtreeRoot.externalNodeNum = 0;
		subtreeRoot.totalFrequency = 0;

		/*
		subtreeRoot.data = {
			type: this.INTERNAL,
			position: branchBit,
			prefix: sistring.slice(0, branchBit),
			externalNodeNum: 0,
			totalFrequency: 0,			
			sistringRepres: externalNode
		};
		*/


		var type = this._getType(node.pos);

		//tree.splice(node.pos, 1);

		/*
		if(type == "left") {
			tree.detachLeftChild(parent);
		} else if(type == "right") {
			tree.detachRightChild(parent);
		}
		*/
		//console.log("  node type: " + node.type);
		//console.log("  node sistring length: " + nodeString.length);
		//console.log("  sistring length: " + sistring.length);

		var nodeBranchBit = nodeString[branchBit].valueOf();
		var sistringBranchBit = sistring[branchBit].valueOf();
		if(nodeBranchBit == 0 && sistringBranchBit == 1) {
			this._probeLeft(node.pos);
			externalNode.pos = 2 * subtreeRoot.pos + 1;						
			subtreeRoot.sistringRepres = externalNode.pos;			
			this.tree[subtreeRoot.pos] = subtreeRoot;
			this.tree[externalNode.pos] = externalNode;

			//subtree.appendLeftChild(subtreeRoot, node);
			//subtree.appendRightChild(subtreeRoot, externalNode);
		} else if(nodeBranchBit == 1 && sistringBranchBit == 0){
			this._probeRight(node.pos);
			externalNode.pos = 2 * subtreeRoot.pos;
			subtreeRoot.sistringRepres = externalNode.pos;			
			this.tree[subtreeRoot.pos] = subtreeRoot;
			this.tree[externalNode.pos] = externalNode;

			//subtree.appendLeftChild(subtreeRoot, externalNode);
			//subtree.appendRightChild(subtreeRoot, node);
		} else {
			throw "wrong branch bit";
		}


		/*
		if(type == "root") {
			tree.root = subtree.root;
		} else if(type == "left") {
			tree.appendLeftChild(parent, subtree);					
		} else if(type == "right") {
			tree.appendRightChild(parent, subtree);
		}
		*/

		this._updateParents(subtreeRoot);

		/*
		if(!this._checkConnections()) {
			throw "tree broken while inserting sistring " + sistring;
		}
		*/
	},

	_updateParents: function(node) {
		var owner = this;
		//var sistringRepres = [];
		var left = this.tree[2 * node.pos];
		var right = this.tree[2 * node.pos + 1];
		var externalNodeNum = 0;
		var totalFrequency = 0;
		if(left && right) {
			if(left.type == owner.INTERNAL) {
				externalNodeNum += left.externalNodeNum;
				totalFrequency += left.totalFrequency;
				//sistringRepres = sistringRepres.concat(left.data.sistringRepres);						
			} else if(left.type == owner.EXTERNAL) {
				externalNodeNum += 1;
				totalFrequency += left.indexes.length;
				//sistringRepres.push(left);						
			} else {
				console.trace();
				throw "unknown node type (neither internal nor external)"
			}
			if(right.type == owner.INTERNAL) {
				externalNodeNum += right.externalNodeNum;
				totalFrequency += right.totalFrequency;
				//sistringRepres = sistringRepres.concat(right.data.sistringRepres);						
			} else if(right.type == owner.EXTERNAL) {
				externalNodeNum += 1;
				totalFrequency += right.indexes.length;
				//sistringRepres.push(right);						
			} else {
				console.trace();
				throw "unknown node type (neither internal nor external)"
			}
		} else {
			console.trace();
			throw "internal node lost left or right child"
		}
		//node.data.sistringRepres = sistringRepres;
		node.externalNodeNum = externalNodeNum;
		node.totalFrequency = totalFrequency;
		this.tree[node.pos] = node;
		var parent = this.tree[Math.floor(node.pos / 2)];
		if(parent && parent.pos > 0) {
			this._updateParents(parent);
		}
	},

	_appendZeroes: function(length) {
		//console.log("_appendZeroes: " + length);
		for(var i = 0; i < this.tree.length; i++) {
			var node = this.tree[i];
			if(node && node.type == this.EXTERNAL) {
				var sistring = node.sistring;
				var sistringLen = sistring.length;
				if(sistringLen < length) {
					for(var j = sistringLen; j < length; j++) {
						node.sistring += "0";
					}
				}
				//console.log(node.sistring.length);
				//console.log(this.tree[node.pos].sistring.length);				
			}
		}
	},



	_restoreSistring: function(externalNode) {
		var sistring = externalNode.data.sistring;
		var index = externalNode.data.indexes[0];
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

	_restorePrefix: function(internalNode) {
		var prefix = internalNode.data.prefix;
		var externalNode = internalNode.data.sistringRepres;
		var index = externalNode.data.indexes[0];
		var indexes = index.split(".");
		var docIndex = indexes[0];
		var sentenseIndex = indexes[1];
		var wordIndex = indexes[2];

		var output = "";
		var sentense = this.documents[docIndex][sentenseIndex];
		//console.log(" sentense: " + sentense);
		var comparison = "";
		for(var i = wordIndex; i < sentense.length && comparison.length < prefix.length; i++) {
			var arr = [];
			var word = sentense[i];
			arr.push(sentense[i]);
			//console.log(" word: " + word);

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


	_probeLeft: function(pos) {
		var itr = 1;
		while(pos * itr < this.tree.length) {
			itr *= 2;
		}
		for(itr; itr > 1; itr /= 2) {
			var half = itr / 2;

			var upper = pos * half;
			var lower = pos * itr;

			for(lower; lower < pos * itr + half; lower++, upper++) {
				if(this.tree[upper]) {
					this.tree[lower] = this.tree[upper];
					this.tree[lower].pos  = lower;
					delete this.tree[upper];

				}
			}
		}
	},


	_probeRight: function(pos) {
		var itr = 1;
		while(pos * itr < this.tree.length) {
			itr *= 2;
			//console.log(itr);
		}
		for(itr; itr > 1; itr /= 2) {
			var half = itr / 2;
			//console.log(itr);
			//console.log(half);

			var upper = pos * half;
			var lower = pos * itr + half;

			for(lower; lower < (pos + 1) * itr; lower++, upper++) {
				if(this.tree[upper]) {
					this.tree[lower] = this.tree[upper];
					this.tree[lower].pos  = lower;
					delete this.tree[upper];

				}
			}
		}
	},

	_getParent: function(pos) {
		if(pos == 1) {
			return;
		} else {
			return this.tree[Math.floor(pos / 2)];
		}

	},


	_getType: function(pos) {
		if(pos == 0) {
			return "header";
		} else if(pos == 1) {
			return "root";
		} else if(pos % 2 == 0) {
			return "left";
		} else {
			return "right";
		}
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
			console.log("type: " + node.data.type);
			if(node.data.type == owner.INTERNAL) {
				console.log("position: " + node.data.position);
				console.log("prefix: " + owner._restorePrefix(node));
				console.log("externalNodeNum: " + node.data.externalNodeNum);
				console.log("totalFrequency: " + node.data.totalFrequency);
				if(printExternalNodes)
				{
					console.log("sistringRepres: ");
					var externalNode = node.data.sistringRepres;
					console.log(" sistring: " + owner._restoreSistring(externalNode));
					console.log(" indexes: " + externalNode.data.indexes);												
				}
	
			} else if(node.data.type == owner.EXTERNAL) {
				console.log("sistring: " + owner._restoreSistring(node));
				console.log("indexes: " + node.data.indexes);
			}
			console.log();
		});	
		if(printDocuments)
		{
			console.log("documents:");
			console.log(this.documents); 	
		}
	}


}


