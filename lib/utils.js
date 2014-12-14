

module.exports = {
	checkPrefix: function(sis1, sis2, x) {
		var result = true;;
		for(var i = 0; i < x; i++) {
			if(sis1[i] != sis2[i]) {
				result = false;
				break;
			}
		}
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
		return i;
	},

	toBinary: function(s) {
		var output = "";
		for(var i = 0; i < s.length; i++) {
			output += s[i].charCodeAt(0).toString(2);
		}
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

	getMean: function(arr, key) {
		var total = 0;
		for(var i = 0; i < arr.length; i++) {
			total += arr[i][key];
		}
		return total / arr.length;
	},

	getStdev: function(arr, key) {
		var mean = this.getMean(arr, key);
		var variance = 0;
		for(var i = 0; i < arr.length; i++) {
			variance += Math.pow((arr[i][key] - mean), 2);
		}
		return Math.sqrt(variance / arr.length);
	},

	getNormalized: function(arr, key) {
		var mean = this.getMean(arr, key);
		var stdev = this.getStdev(arr, key);

		var result = [];

		for(var i = 0; i < arr.length; i++) {
			result[i] = {};
			for(var other in arr[i]) {
				result[i][other] = arr[i][other];
			}
			var point = arr[i][key] - mean;
			if(point != 0) {
				point /= stdev;				
			}
			result[i][key] = point;
		}
		return result;
	},

	classify: function(SLPs) {
		var buckets = [];
		for(var i = 0; i < SLPs.length; i++) {
			var SLP = SLPs[i];
			var len = SLP.sistring.length;
			if(!buckets[len]) {
				buckets[len] = [];
			}
			buckets[len].push(SLP);			
		}
		var results = [];
		for(var i = 0; i < buckets.length; i++) {
			if(buckets[i]) {
				results[i] = this.getNormalized(buckets[i], "frequency");
			}
		}
		return results;
	},

	getMergedAndSorted: function(SLPs) {
		var buckets = this.classify(SLPs);
		var result = [];
		for(var i = 0; i < buckets.length; i++) {
			if(buckets[i]) {
				result = result.concat(buckets[i]);
			}
		}
		result.sort(function(item1, item2) {
			return Math.abs(item2.frequency) - Math.abs(item1.frequency);
		})
		//console.log(result);
		return result;
	},

}