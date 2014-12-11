module.exports = {
	checkPrefix: function(sis1, sis2, x) {
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

	findBranchPosition: function(sis1, sis2) {
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

	toBinary: function(s) {
		var output = "";
		for(var i = 0; i < s.length; i++) {
			output += s[i].charCodeAt(0).toString(2);
		}
		//console.log(output);
		return output;
	},	

	toString: function(b) {
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

	splitDocument: function(doc) {
		var regex = /[，。,.\s]+/;
		var sentenses = doc.split(regex);
		return sentenses;
	},	
}