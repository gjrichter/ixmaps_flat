	if (this.szFilter.match(/WHERE/)) {

		// first time ?
		// get query parts
		if (!this.objTheme.filterQueryA) {

			// tokenize
			// ---------
			var szTokenA = this.szFilter.split('WHERE ')[1].split(' ');

			// test for quotes and join the included text parts
			for (var ii = 0; ii < szTokenA.length; ii++) {
				if (szTokenA[ii].length) {
					if ((szTokenA[ii][0] == '"') && (szTokenA[ii][szTokenA[ii].length - 1] != '"')) {
						do {
							szTokenA[ii] = szTokenA[ii] + " " + szTokenA[ii + 1];
							szTokenA.splice(ii + 1, 1);
						}
						while (szTokenA[ii][szTokenA[ii].length - 1] != '"');
					}
					if ((szTokenA[ii][0] == '(') && (szTokenA[ii][szTokenA[ii].length - 1] != ')')) {
						do {
							szTokenA[ii] = szTokenA[ii] + " " + szTokenA[ii + 1];
							szTokenA.splice(ii + 1, 1);
						}
						while (szTokenA[ii][szTokenA[ii].length - 1] != ')');
					}
				} else {
					szTokenA.splice(ii, 1);
					ii--;
				}
			}
			this.objTheme.filterQueryA = [];
			var filterObj = {};

			// make the query object(s)
			// ------------------------
			do {
				var nToken = 0;
				if (szTokenA.length >= 3) {
					filterObj = {};
					filterObj.szFilterField = szTokenA[0].replace(/("|)/g, "");
					filterObj.szFilterOp = szTokenA[1];
					filterObj.szFilterValue = szTokenA[2].replace(/("|)/g, "");
					nToken = 3;
				}
				if (filterObj.szFilterOp == "BETWEEN") {
					if (szTokenA.length >= 5) {
						if (szTokenA[3] == "AND") {
							filterObj.szFilterValue2 = szTokenA[4].replace(/("|)/g, "");
							nToken = 5;
						}
					}
				}

				if (nToken) {

					// get data table column index for query field
					for (var ii = 0; ii < this.objTheme.dbFields.length; ii++) {
						if (this.objTheme.dbFields[ii].id == filterObj.szFilterField) {
							filterObj.nFilterFieldIndex = ii;
						}
						if (("$"+this.objTheme.dbFields[ii].id+"$") == (filterObj.szFilterValue)) {
							filterObj.nFilterValueIndex = ii;
						}
					}

					// add the query object
					this.objTheme.filterQueryA.push(filterObj);
					szTokenA.splice(0, nToken);

				} else {
					alert("ixmaps - filter error - incomplete query!\nquery: " + this.szFilter);
					break;
				}

				// only 'AND' combination (OR tdb)
				if (szTokenA.length && (szTokenA[0] == "AND")) {
					szTokenA.splice(0, 1);
				} else {
					break;
				}
			}
			while (szTokenA.length);
		}

		// start filtering
		for (var i in this.objTheme.filterQueryA) {

			// get the value to test
			this.__szValue = String(this.objTheme.dbRecords[j][this.objTheme.filterQueryA[i].nFilterFieldIndex]);
			this.__szFilterOp = this.objTheme.filterQueryA[i].szFilterOp.toUpperCase();
			this.__szFilterValue = this.objTheme.filterQueryA[i].szFilterValue;
			this.__szFilterValue2 = this.objTheme.filterQueryA[i].szFilterValue2;

			// GR 26.12.2019 filter value may be column name
			if (this.objTheme.filterQueryA[i].nFilterValueIndex != null) {
				this.__szFilterValue = String(this.objTheme.dbRecords[j][this.objTheme.filterQueryA[i].nFilterValueIndex]);
			}

			// do the query 
			// ------------
			var result = true;
			//var nValue = parseFloat(this.__szValue);
			// gr 23.11.2017
			var nValue = __scanValue(this.__szValue);
			if (this.__szFilterOp == "=") {
				result = ((this.__szValue == this.__szFilterValue) || (nValue == Number(this.__szFilterValue)));
			} else
			if (this.__szFilterOp == "!=") {
				result = !((this.__szValue == this.__szFilterValue) || (nValue == Number(this.__szFilterValue)));
			} else
			if (this.__szFilterOp == "<>") {
				result = !((this.__szValue == this.__szFilterValue) || (nValue == Number(this.__szFilterValue)));
			} else
			if (this.__szFilterOp == ">") {
				result = (nValue > Number(this.__szFilterValue));
			} else
			if (this.__szFilterOp == "<") {
				result = (nValue < Number(this.__szFilterValue));
			} else
			if (this.__szFilterOp == ">=") {
				result = (nValue >= Number(this.__szFilterValue));
			} else
			if (this.__szFilterOp == "<=") {
				result = (nValue <= Number(this.__szFilterValue));
			} else
			if (this.__szFilterOp == "LIKE") {
				if (this.__szFilterValue == "*"){
					result = this.__szValue.length; 
				}else{
					result = eval("this.__szValue.match(/" + this.__szFilterValue.replace(/\//gi, '\\/') + "/i)");
				}
			} else
			if (this.__szFilterOp == "NOT") {
				result = eval("!this.__szValue.match(/" + this.__szFilterValue.replace(/\//gi, '\\/') + "/i)");
			} else
			if (this.__szFilterOp == "IN") {
				result = eval("this.__szFilterValue.match(/\\(" + this.__szValue.replace(/\//gi, '\\/') + "\\)/)") ||
					eval("this.__szFilterValue.match(/\\(" + this.__szValue.replace(/\//gi, '\\/') + "\\,/)") ||
					eval("this.__szFilterValue.match(/\\," + this.__szValue.replace(/\//gi, '\\/') + "\\,/)") ||
					eval("this.__szFilterValue.match(/\\," + this.__szValue.replace(/\//gi, '\\/') + "\\)/)");
			} else
			if ((this.__szFilterOp == "BETWEEN")) {
				result = ((nValue >= Number(this.__szFilterValue)) &&
					(nValue <= Number(this.__szFilterValue2)));
			} else {
				// default operator	
				result = eval("this.__szValue.match(/" + this.__szFilterValue.replace(/\//gi, '\\/') + "/i)");
			}
			// exec query result
			if (!result) {
				return false;
			}
		}
	} else {
