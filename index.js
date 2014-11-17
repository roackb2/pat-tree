var Tree = require("./lib/BTree");

module.exports = PATtree;

function PATtree() {
	this.tree = new Tree(0);
	this.maxSistringLength = 0;
	this.index = 1;
}

PATtree.prototype = {

	INTERNAL: "internal",
	EXTERNAL: "external",

	addDocument: function(doc) {
		var sentenses = this._splitDocument(doc);
		for(var i = 0; i < sentenses.length; i++) {
			this._addSentense(sentenses[i]);
		}
	},

	_addSentense: function(sentense) {
		for(var i = 0; i < sentense.length; i++) {
			var charSistring = sentense.slice(i, sentense.length);
			var sistring = this._toBinary(charSistring);
			this._addSistring(sistring);
			console.log("\tafter adding sistring " + charSistring + ":\n");
			//console.log("check connection: " + this._checkConnections());
			this._printTreeContent();			
		}
	},

	_addSistring: function(sistring) {
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
		this._insert(tree, tree.root.id, sistring);
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
						var leftChild = this._createNode();
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
						var rightChild = this._createNode();
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
			if(node.data.sistring == sistring) {
				//TODO: add to position list.
			} else {
				this._rebuildInternalSubtree(tree, node, sistring);
			}
		} else {
			throw "invalid node type (neither internal nor external)";
		}
	},

	_rebuildInternalSubtree: function(tree, node, sistring) {
		/*
		if(!this._checkConnections()) {
			throw "tree broken";
		}
		*/
		var nodeString;
		if(node.data.type == this.INTERNAL) {
			nodeString = node.data.prefix;
		} else if(node.data.type == this.EXTERNAL) {
			nodeString = node.data.sistring;
		}
		var branchBit = this._findBranchPosition(nodeString, sistring);
		var parent = node.parent;
		var subtree = this._createSubTree();


		var subtreeRoot = subtree.getRoot();
		subtreeRoot.data = {
			type: this.INTERNAL,
			position: branchBit,
			prefix: sistring.slice(0, branchBit)
		};

		var externalNode = this._createNode();
		externalNode.data = {
			type: this.EXTERNAL,
			sistring: sistring
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



	_splitDocument: function(doc) {
		var regex = /[，。,.\s]+/;
		var sentenses = doc.split(regex);
		return sentenses;
	},

	_printTreeContent: function() {
		var tree = this.tree;
		tree.preOrderTraverse(function(node) {
			console.log("id: " + node.id);
			var type = tree.getNodeType(node.id);
			console.log(type);
			if(type != "root") {
				console.log("parent: " + node.parent.id);
			}
			for(var key in node.data) {
				console.log(key + ": " + node.data[key]);
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

	_test: function() {
		var tree = this.tree;
		var input = "夜宿北師美術館與蔡明亮深夜長談，知道心中有幾扇門被打開了，感動不已。 \
他是一個那麼藝術的人，全身上下散發著這樣的氣味，相信並不是每件事情都必須是個 business、for some reason。就像月亮掛在那邊並不具有特定意義，千古文人卻又將自身情感繫於其中投射出千古詩篇。看「郊遊」才知道原來電影還能這樣拍。它慢的令人焦躁，卻又令人清晰著每個畫面。他可惜著電影這麼棒的媒材，到現在卻只淪落為商品為娛樂，用作品告訴人其實電影能像本書一樣，充實自己。 \
憑藉著郊遊拿下金馬影帝的李康生，劇中表現。郊遊男主角詮釋到位，讓你以為他真的曾經是個落魄到底的中年男子，導演透過層層篩選才找到他。然而知道他正是李康生之後，又讓我震驚不已。他是蔡導演二十年來的唯一男主角。\
蔡導和李康生二十年的情緣，深深讓我觸動。二十年來每部電影都有李康生，這是多麼難得的執著與緣份，李康生是蔡明亮靈魂的一部分。這微妙的關係，或許就像福爾摩斯與華生吧！ \
夜宿北美館，其實跟郊遊沒有太大的關係，而是蔡導希望在市民心中種下一棵希望的種子。喔，不是，是在小孩心中種下藝術的種子。從小讓孩子知道美術館並不是不可侵犯的殿堂，而是讓人得到心靈充足的地方。應該要學習如何接近，知道這裡親切的甚至可以睡到這裡。\
沒想到卻也吸引到我們這群老小孩，目的卻也達到了。 \
最後真的推薦各位快到北師美術館體驗郊遊這齣電影，與蔡明亮近距離互動，畢竟很多感受沒辦法透過言語傳達。一如 \"拉拉拉拉～\" \"哎呀吼嗨呀～\""; 
		this.addDocument(input);

		//console.log("traverse in pre order\n")
		this._printTreeContent();				
	},

	_testTree: function() {
		var tree = this.tree;
		var root = tree.getRoot();
		var rootId = tree.getRootId();
		var node1 = this._createNode();
		var node2 = this._createNode();
		var node3 = this._createNode();
		var node4 = this._createNode();
		var node5 = this._createNode();
		var node6 = this._createNode();
		var node7 = this._createNode();
		var node8 = this._createNode();
		var node9 = this._createNode();
		var node10 = this._createNode();
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

		var subtree = this._createSubTree();
		var subtreeRoot = subtree.getRoot();
		var node11 = this._createNode();
		var node12 = this._createNode();
		subtree.appendLeftChild(subtreeRoot.id, node11);
		subtree.appendRightChild(subtreeRoot.id, node12);


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
		console.log("parent of node 7: " + tree.getNode(node7.id).parent.id);
		//tree.removeSubtree(node4.id);
		tree.detachRightChild(node1.id);
		tree.reparentToRight(node7.id, node1.id);
		tree.detachLeftChild(node1.id);
		tree.appendLeftChild(node1.id, subtree);
		//tree.removeSubtree(node3.id);
		//tree.reparentToRight(node7.id, node5.id);
		console.log("parent of node 7: " + tree.getNode(node7.id).parent.id);
		console.log("node 5 id: " + node5.id);
		console.log("node 5 is left child: " + tree.isLeftChild(node5.id));
		console.log("node 5 is right child: " + tree.isRightChild(node5.id));

		tree.preOrderTraverse(function(node) {
			console.log("callback on node " + node.id);
		})
	}

}




var PATtree = new PATtree();

var argvs = process.argv;
var command = argvs[2];
var params = process.argv.slice(3, argvs.length);
PATtree[command].apply(PATtree, params);
