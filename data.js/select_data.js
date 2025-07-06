		select: function (szSelection) {

			if (szSelection.match(/WHERE/)) {

				// first time ?
				// get query parts

				if (1) {

					// tokenize
					// ---------
					var szTokenA = szSelection.split('WHERE')[1].trim().split(' ');

					// test for quotes and join the included text parts
					for (var ii = 0; ii < szTokenA.length; ii++) {
						if ((szTokenA[ii][0] == '"') && (szTokenA[ii][szTokenA[ii].length - 1] != '"')) {
							do {
								szTokenA[ii] = szTokenA[ii] + " " + szTokenA[ii + 1];
								szTokenA.splice(ii + 1, 1);
							}
							while (szTokenA[ii][szTokenA[ii].length - 1] != '"');
						}
					}
					this.filterQueryA = [];
					var filterObj = {};

					var szCombineOp = "";

					// make the query object(s)
					// ------------------------
					do {
						var nToken = 0;

						if (szTokenA.length >= 3) {
							filterObj = {};
							filterObj.szSelectionField = szTokenA[0].replace(/("|)/g, "");
							filterObj.szSelectionOp = szTokenA[1];
							filterObj.szSelectionValue = szTokenA[2].replace(/("|)/g, "");
							nToken = 3;
						}
						if (filterObj.szSelectionOp == "BETWEEN") {
							if (szTokenA.length >= 5) {
								if (szTokenA[3] == "AND") {
									filterObj.szSelectionValue2 = szTokenA[4];
									nToken = 5;
								}
							}
						}

						if (nToken) {

							// get data table column index for query field
							for (var ii = 0; ii < this.fields.length; ii++) {
								if (this.fields[ii].id == filterObj.szSelectionField) {
									filterObj.nFilterFieldIndex = ii;
								}
								// GR 26.12.2019 filter value may be column name (defined by $column name$)
								if (("$" + this.fields[ii].id + "$") == filterObj.szSelectionValue) {
									filterObj.nFilterValueIndex = ii;
								}
							}
							// set query combine operator 
							filterObj.szCombineOp = szCombineOp;

							// add the query object
							this.filterQueryA.push(filterObj);
							szTokenA.splice(0, nToken);

						} else {
							_alert("data.js - selection error - incomplete query!\nquery: " + szSelection);
							break;
						}

						// only 'AND' combination (OR tdb)
						if (szTokenA.length && (szTokenA[0] == "AND")) {
							szCombineOp = "AND";
							szTokenA.splice(0, 1);
						} else
						if (szTokenA.length && (szTokenA[0] == "OR")) {
							szCombineOp = "OR";
							szTokenA.splice(0, 1);
						} else {
							break;
						}
					}
					while (szTokenA.length);

				}

				this.selection = new Data.Table;

				for (var i in this.filterQueryA) {
					if (typeof this.filterQueryA[i].nFilterFieldIndex === "undefined") {
						this.selection.fields = this.fields.slice();
						this.selection.table.fields = this.table.fields;
						_LOG("Selection: invalid query: " + szSelection);
						return this.selection;
					}
				}

				for (var j in this.records) {

					var allResult = null;

					for (var i in this.filterQueryA) {

						var result = true;
						// get the value to test
						this.__szValue = String(this.records[j][this.filterQueryA[i].nFilterFieldIndex]);
						this.__szSelectionOp = this.filterQueryA[i].szSelectionOp.toUpperCase();
						this.__szSelectionValue = this.filterQueryA[i].szSelectionValue;
						this.__szSelectionValue2 = this.filterQueryA[i].szSelectionValue2;
						this.__szCombineOp = this.filterQueryA[i].szCombineOp;

						// GR 26.12.2019 filter value may be column name
						if (this.filterQueryA[i].nFilterValueIndex != null) {
							this.__szSelectionValue = String(this.records[j][this.filterQueryA[i].nFilterValueIndex]);
						}

						// do the query 
						// ------------
						var nValue = __scanValue(this.__szValue);
						if (this.__szSelectionOp == "=") {
							if (this.__szSelectionValue == '*') {
								result = (this.__szValue.replace(/ /g, "") != "");
							} else {
								result = ((this.__szValue == this.__szSelectionValue) || (nValue == Number(this.__szSelectionValue)));
							}
						} else
						if (this.__szSelectionOp == "<>") {
							result = !((this.__szValue == this.__szSelectionValue) || (nValue == Number(this.__szSelectionValue)));
						} else
						if (this.__szSelectionOp == ">") {
							result = (nValue > Number(this.__szSelectionValue));
						} else
						if (this.__szSelectionOp == "<") {
							result = (nValue < Number(this.__szSelectionValue));
						} else
						if (this.__szSelectionOp == ">=") {
							result = (nValue >= Number(this.__szSelectionValue));
						} else
						if (this.__szSelectionOp == "<=") {
							result = (nValue <= Number(this.__szSelectionValue));
						} else
						if (this.__szSelectionOp == "LIKE") {
							if (this.__szSelectionValue == "*") {
								result = this.__szValue.length;
							} else {
								result = eval("this.__szValue.match(/" + this.__szSelectionValue.replace(/\//gi, '\\/') + "/i)");
							}
						} else
						if (this.__szSelectionOp == "NOT") {
							result = !eval("this.__szValue.match(/" + this.__szSelectionValue.replace(/\//gi, '\\/') + "/i)");
						} else
						if (this.__szSelectionOp == "IN") {
							result = eval("this.__szSelectionValue.match(/\\(" + this.__szValue + "\\,/)") ||
								eval("this.__szSelectionValue.match(/\\," + this.__szValue + "\\,/)") ||
								eval("this.__szSelectionValue.match(/\\," + this.__szValue + "\\)/)");
						} else
						if ((this.__szSelectionOp == "BETWEEN")) {
							result = ((nValue >= Number(this.__szSelectionValue)) &&
								(nValue <= Number(this.__szSelectionValue2)));
						} else {
							// default operator	
							result = eval("this.__szValue.match(/" + this.__szSelectionValue.replace(/\//gi, '\\/') + "/i)");
						}
						if (this.__szCombineOp == "AND") {
							allResult = (allResult && result);
						} else {
							allResult = (allResult || result);
						}
					}
					if (allResult) {
						this.selection.records.push(this.records[j]);
						this.selection.table.records++;
					}
				}
			}
			this.selection.fields = this.fields.slice();
			this.selection.table.fields = this.table.fields;
			return this.selection;
		},
