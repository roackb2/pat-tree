pat-tree
========

PAT tree construction for Chinese document, now in development.

WARNING: This project is now in development and used for academic purpose,
		 DO NOT use this module until the WARNING statement is removed.

## Installation

	npm install pat-tree --save

## Test
	
	npm test

## Usage

# Init

	var PATtree = require("pat-tree");
	var tree = new PATtree();

# Add document

	tree.addDocument(input);

# Print tree content

	tree.printTreeContent(printExternalNodes, printDocuments);

If **printExternalNodes** is set to true, print out all external nodes for each internal node.
If **printDocuments** is set to true, print out the whole collection of the tree.

# Traversal

	tree.traverse(preCallback, inCallback, postCallback);

For convenient, there are functions for each order of traversal

	tree.preOrderTraverse(callback);
	tree.inOrderTraverse(callback);
	tree.postOrderTraverse(callback);

For example

	tree.preOrderTraverse(function(node) {
		console.log("node id: " + node.id);
	})

## Data type

# Node

Every nodes has some common informaitons, an node has the following structure:

	node = {
		id: 3, // the id of this node, data type: JSON, auto generated.
		parent: 1, // the parent id of this node, data type: integer
		left: leftChildNode, // data type: Node 
		right: rightChildNode, // data type: Node
		data: {} // payload for this node, data type : JSON
	}

Data is different for internal nodes and external nodes,
Internal nodes has following structure:
	
# Internal nodes

	internalNode.data = {
		type: "internal",  // indicates this is an internal node
		position: 13, // the branch position of external nodes, data type: integer
		prefix: "00101", // the sharing prefix of external nodes, data type: string of 0s and 1s
		externalNodeNum: 87, // number of external nodes contained in subtree of this node, data type: integer
		totalFrequency: 89, // number of the total frequency of the external nodes in the collection, data type: integer
		sistrings: ArrayOfExternalNodes // array of external nodes, data type: array
	}

# External nodes

External nodes has following structure:

	externalNode.data = {
		type: "external", // indicates this is an external node,
		sistring: "00101100110101", // binary representation of the character, data type: string
		indexes: ["0.1,3", "1.2.5"] // the positions where the sistring appears in the collection, data type: array
	}

## Collection

The whole collection consists of documents, which consists of sentenses, which consists of words.
An example could be this:

	[ [ '嗨你好',
    	'這是測試文件1' ],
  	  [ '你好',
    	'這是測試文件2' ] ]

An index is in following structure:

	DocumentPosition.SentensePosition.wordPosition

For example, **"0.1.2"** is the index of the character "測".

## Release History

* 0.1.1 First release
* 0.1.2 Construction complete
* 0.1.3 Able to restore Chinese characters
* 0.1.4 Add external node number and term frequency to internal nodes
