pat-tree
========

PAT tree construction for Chinese document, now in development.
Provide functionality to add documents and construct PAT tree in memory, store it to database,
extract keywords, and split documents.

example of result:

	有時 喜歡   有時候 不喜歡
	為什麼 會 這樣   … ？
	20 點 求 解 哈哈


# WARNING

This project is now in development and used for academic purpose,
**DO NOT** use this module in production until the **WARNING** statement is removed.
//TODO: improve document splitting algorithm


# Installation

```bash
npm install pat-tree --save
```

# Usage


### Instanitiate

```javascript
var PATtree = require("pat-tree");
var tree = new PATtree();
```

### Add document

```javascript
tree.addDocument(input);
```

### Extract Significant Lexical Patterns

```javascript
var SLPs = tree.extractSLP(TFThreshold, SEThreshold); 
// SLPs: array of strings, which are signifiant lexical patterns.
```

If the frequency of a pattern exceeds `TFThreshold`, 
and the SE value exceeds `SEThreshold`, it would appear in the result array.

`TFTreshold` should be integer, `SEThreshold` should be float between 0 and 1.

### Text segmentation

```javascript
var result = tree.segmentDoc(doc, SLPs); 
```

`doc` is the document to be segmented, data type: string.

`SLPs` is array of SLP that extracted by `tree.extractSLP()`, or array of keywords retrieved any other way, data type: array of strings.

`result` is the result of document segmentation, data type: string.

### Convert to JSON

```javascript
var json = tree.toJSON(); 
```
The result json has following three keys:
	`header`: JSON object,
	`documents`: array,
	`tree`: array

You could store them to database and use `tree.reborn()` to generate the tree again.
In NoSQL database, you can store the three items to seperate collections,
`header` collection would contain exactly one document, and `documents` and `tree` would contain lots of documents.

For Example, if using MongoDB native driver:
```javascript
	var json = tree.toJSON();

	// One header object would be stored to database
	db.collection("header").insert(json.header, function(err, result) {
		if(err) throw err;
	});

	// All documents would be stored to database
	db.collection("documents").insert(json.documents, function(err, result) {
		if(err) throw err;
	});	

	// All nodes of the tree would be stored to database
	db.collection("tree").insert(json.tree, function(err, result) {
		if(err) throw err;				
	});	
```


### Reborn

```javascript
tree.reborn(json);
```
If you use `tree.toJSON()` to generate JSON object and store the three items to different collections, 
you can construct them to the original JSON object and use `tree.reborn(json)` to reborn the tree.

For example, if using MongoDB native driver:
```javascript
	db.collection("header").find().toArray(function(err, headers) {
		db.collection("documents").find().toArray(function(err, documents) {
			db.collection("tree").find().toArray(function(err, tree) {
				var json = {};
				json.header = headers[0];
				json.documents = documents;
				json.tree = tree;

				var patTree = new PATTree();
				patTree.reborn(json);
			})
		})
	})	
```

Then you can use all functions of this module to `patTree`, for example, 
you can add one more document with `patTree.addDocument(doc)` and extract SLPs,
and then store the tree back to database. Notice that, if you need the SLPs, 
you should store them to database manually.

**CATUION**

These three collectinos `header`, `documents`, `tree` 
represent the status of the tree, if you want to reborn from these collections,
All of them are required for reborn to success. Also, if you rebron a tree by `patTree.reborn(json)`, 
add some more documents by `patTree.addDocument(doc)`, 
then before you store the result json of `var json = tree.toJSON()` back to the database, you **MUST** drop
three existing collections in the database, then store the result `json` to database again.


# Additional functions

### Print tree content

```javascript
tree.printTreeContent(printExternalNodes, printDocuments);
```

Print the content of the tree on console.
If `printExternalNodes` is set to true, print out all external nodes for each internal node.
If `printDocuments` is set to true, print out the whole collection of the tree.

### Traversal

```javascript
tree.traverse(preCallback, inCallback, postCallback);
```

For convenience, there are functions for each order of traversal

```javascript
tree.preOrderTraverse(callback);
tree.inOrderTraverse(callback);
tree.postOrderTraverse(callback);
```

For example

```javascript
tree.preOrderTraverse(function(node) {
	console.log("node id: " + node.id);
})
```

# Data type

### Node

Every nodes has some common informaitons, an node has the following structure:

```javascript
	node = {
		id: 3,        // the id of this node, data type: integer, auto generated.
		parent: 1,    // the parent id of this node, data type: integer
		left: leftChildNode,      // data type: Node 
		right: rightChildNode,    // data type: Node
	}
```

Other attributes in nodes are different for internal nodes and external nodes,
Internal nodes has following structure:
	
### Internal nodes

```javascript
	internalNode = {
		// ... 

		type: "internal", 
        // indicates this is an internal node
		position: 13,
        // the branch position of external nodes, data type: integer
		prefix: "00101", 
        // the sharing prefix of external nodes, data type: string of 0s and 1s
		externalNodeNum: 87, 
        // number of external nodes contained in subtree of this node, 
        // data type: integer
		totalFrequency: 89, 
        // number of the total frequency of the external nodes in the collection,
        // data type: integer
		sistringRepres: node 
        // one of the external node in the subree of this internal node,
        // data type: Node
	}
```

### External nodes

External nodes has following structure:

```javascript
	externalNode = {
		// ...

		type: "external", 
        // indicates this is an external node,
		sistring: "00101100110101", 
        // binary representation of the character, data type: string
		indexes: ["0.1,3", "1.2.5"] 
        // the positions where the sistring appears in the collection,
        // data type: array
	}
```

# Collection

The whole collection consists of documents, which consists of sentenses, which consists of words.
An example could be this:

```javascript
	[ [ '嗨你好',
    	'這是測試文件' ],
  	  [ '你好',
    	'這是另外一個測試文件' ] ]
```

An index is in following structure:

	DocumentPosition.SentensePosition.wordPosition

For example, `"0.1.2"` is the index of the character `"測"`.

# Release History

* 0.2.4 Fix bug in reborn()
* 0.2.3 Add functions toJSON() and reborn()
* 0.2.2 Change function name of splitDoc to segmentDoc
* 0.2.1 Mofify README file
* 0.2.0 Add text segmentation functionality
* 0.1.8 Alter algorithm, improve simplicity
* 0.1.7 Improve performance
* 0.1.6 Improve performance
* 0.1.5 Add functionality of SLP extraction
* 0.1.4 Add external node number and term frequency to internal nodes
* 0.1.3 Able to restore Chinese characters
* 0.1.2 Construction complete
* 0.1.1 First release
