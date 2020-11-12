"use strict";


const max_digits = 8;
const _device_expression = document.getElementById("expression");
const _device_operand = document.getElementById("operand");


const screen = {
	//arrow functions have been used to define this object's internal methods
	set: {
		expression: (value) => { _device_expression.innerText = value; },
		operand: (value) => { _device_operand.innerText = value; },
	},
	clear: {
		expression: () => { _device_expression.innerText = ""; },
		operand: () => { _device_operand.innerText = ""; },
		all: () => { 
			_device_expression.innerText = "";
			_device_operand.innerText = "";
		},
	},
	get: {
		expression: () => { return _device_expression.innerText; },
		operand: () => { return _device_operand.innerText; },
	},
};


const calculation = {	
	// FILO array
	_expression: [],

	// Store string in array
	push: function (exp) {
		this._expression.push(exp);
	},

	// Remove last value in array
	pop: function () { 
		this._expression.pop();
	},

	// Return last value in array
	last: function () { 
		var value = "";
		var array_length = this._expression.length;								// Store length of array for efficiency
		if (array_length >= 1) {												// Prevent "index out of range"
			value = this._expression[array_length-1];							// Arrays start at 0
		}
		return value;
	},

	// Clears array
	clear: function () { 
		this._expression = [];
	},

	// Outputs contents of array to console
	debug: function () { 
		console.log("_expression contents: " + this._expression);
	},

	// Return joined array entries separated by space
	expression: function() { 													// Note from Scott: this is a horribly named function :P
		return this._expression.join(" ");										// I kept doing "this.expression" rather than "this._expression"
	}
};

// Create expression from values
function append_value(original, append, glue, spacer=false) {
	var array = [original, glue, append];										// Used array so code is neater
	if (original == "" && append == "") {
		return "";
	}
	else if (original == "") {													// Only return 'append'
		return array[2];
	}
	else if (append == "") {													// Only return 'original'
		return array[0];
	}
	else {																		// Return all 3
		if (glue == '') {
			array.splice(1, 1);													// Remove "glue" from the array if it's empty - removes the double space in that scenario
		}
		return spacer ? array.join(" ") : array.join("");						// Ternary conditional boolean to add spaces or not
	}
}

// Return whether number has acceptable leading zeros or not
function valid_leadingzeros(value) { 
	if (value.includes('.')) {													// If it contains a decimal, ignore *TRAILING* zeros by							
		value = value.substr(0, value.indexOf('.'));							// only considering numbers pre-decimal							
	}
	return parseFloat(value).toString() === value;								// Convert string to number, cast back to string then check if there's a difference between
}																				// the original value and the casted value e.g removed leading zeros / less chars (if yes, non-valid)

// Check if expression contains 1+ decimal points
function valid_decimals(value) {
	if (typeof(value) == "boolean") {
		return false;															/* Passing a boolean returns "true" for some weird reason; preventing that here */
	}
	
	var split_array = value.split('.');
	if (split_array.length > 2) {												// If the array has more than 2 entries, it's an invalid decimal
		return false;
	}
	else {
		return true;
	}

	// Removed - does not produce expected (true) for "valid_decimals('ABC')"
	//return !isNaN(value);														// Check if value (converted to number) is Not A Number. If it contains two decimals - it's NaN and returns false
}

// Remove non-numeric characters
function trim_invalid_numerics(value) {
	if (typeof(value) != "string") {
		return "";																// If it's not a string, return an empty one (prevents errors from .replace on non-strings)
	}
	return value.replace(/[^.0-9\-]/g,'');										// Use RegEx (gross) to remove non-numeric chars (excluding minus or decimal)
}																				// Note: Doesn't guarantee the number is valid e.g. "!10-" becomes "10-" and is invalid | #NotMyJob

// Handle control buttons
function control_pressed(control) {
	switch(control) {
		case "c":
			if (!(screen.get.operand().includes('='))) {						/* If operand isn't showing answer [...] */
				screen.clear.operand();											// (C) Clear just operand
			}																	/* == Note: Clearing answer operand allows digits to be entered and throws error */ 
			break;																/* because digit_pressed() can't check for the '=' sign and prevent inputs before the next operator */
		case "ac":
			screen.clear.all();													// (AC) Clear all 
			calculation.clear();
			break;
		case "=":
			if (screen.get.operand()) {											/* If operand isn't empty and [...] */
				if (!(screen.get.operand().includes('='))) {					/* If operand isn't showing answer [...] */
					calculation.push(screen.get.operand());						// Add current operand to expression
					screen.set.expression(calculation.expression());			// Set expression text on screen

					var sum = evaluate(calculation.expression());				// Evaluate expression
					screen.set.operand('= ' + sum);								// Set operand text to answer|error|empty (plus an equals sign)
				}
			}
			break;																/* Break if we are already showing an answer to prevent errors with spam clicking '=' */
	}
}

// Handle digit buttons
function digit_pressed(digit) {													/* === Additional Features Added === */

	var old_values = screen.get.operand();
	var new_values = old_values + digit;

	// Prevent digits being added to answer 
	if (old_values.includes('=')) {												/* Check to see if the operand is currently displaying an answer by looking for an '=' sign */
		return;																	/* If it is, do *NOT* allow additional digit entry */
	}
	if (!(valid_decimals(new_values))) {										/* If adding this digit creates invalid decimals, return */
		return;
	}																		
	if (!(valid_leadingzeros(new_values))) {									/* If adding this digit creates invalid leading zeros, return */
		return;
	}	
	if (old_values.length < max_digits) {										// Ensure total length is less than max_digits
		screen.set.operand(new_values);											// and add new digit to it
	}
}

// Handle operand buttons
function operator_pressed(operator) {											/* === Additional Features Added === */

	var operand_values = screen.get.operand();									// Get current digits in operand

	if (!operand_values) {														/* If there are no digits entered in the operand, do not allow first digit to be operator */
		if (operator != '-') {													/* (Excluding minus sign for negative numbers) */
			return;
		}
	}

	// Allows additional operators into expression after answer 
	if (operand_values.includes('=')) {											/* Check to see if the operand is currently displaying an answer by looking for an '=' sign */
		screen.clear.operand();													/* If it is, clear the operand text, do *NOT* push operand_values and continue */
		operand_values = "";
	}
	else {																		// If it isn't, push the operand_values and continue
		calculation.push(operand_values);										// Push operand
	}

	calculation.push(operator);													// Push operator sign
	screen.set.expression(calculation.expression());							// Set expression to calculation.expression();
	screen.clear.operand();														// Clear operand text
}

// Evaluate expression
function evaluate(expression) {													/* === Additional Features Added === */
	var sum = "";
	if (expression != "") {														// If empty, return default (empty) 'sum' 
		try {																
			sum = String(eval(expression));										// Try evaluate expression; assign it to 'sum'
			sum = Number(sum);													// Convert back to a number for the sake of the mark scheme
		} 
		catch (e) {															
			sum = "ERROR";														// Error with expression, assign "ERROR" to 'sum'
			console.log("[AdaCalc] " + e + " for: " + expression);				/* Output to console the expression + error type */
		}
	}
	return sum;
}


//search for all HTML objects that are using the class name 'button'
var buttons = document.getElementsByClassName('button');
for(let i = 0; i < buttons.length; i++) { //loop through each 'button' instance
	buttons[i].addEventListener('click', function() { //attach a 'click' event listener
    	switch(this.dataset.action) { //invoke a specific function based on the type of button 'clicked'
			//pass the ID to the selected function
			case("digit"): digit_pressed(this.id); break; 
			case("operator"): operator_pressed(this.id); break;
			case("control"): control_pressed(this.id); break;
		}
	})
}

//once the oload event has fired, execute any requested functions
window.onload = () => {
	screen.clear.all();															// Clear all text on page load

	// /* ======= Stop text overflowing and disrupting CSS/HTML ======= */
	
	// // Operand container modification
	// _device_operand.style.maxWidth 		= "270px";								// max-width: 270px; 
	// _device_operand.style.whiteSpace 	= "nowrap";								// white-space: nowrap;
	// _device_operand.style.overflow 		= "scroll";								// overflow: scroll;
	// _device_operand.style.overflowY 	= "hidden";								// overflow-y: hidden;

	// // Expression container modification
	// _device_expression.style.fontSize 	= "10px";								// font-size: 10px
	// _device_expression.style.maxWidth 	= "270px";								// max-width: 270px; 
	// _device_expression.style.whiteSpace = "normal";								// white-space: normal;
	// _device_expression.style.overflow 	= "scroll";								// overflow: scroll;
	// _device_expression.style.overflowX 	= "hidden";								// overflow-x: hidden;
};


/* ==== Remaining Bugs ==== 
- ????
*/

/* ==== Fixed Bugs ====
- Allowed additional inputs after pressing '=' without breaking calculation object
- Prevent clicking '=' on an answer and avoid throwing 'ERROR'
- Prevent (C) clearing answer after '=' so more characters can't be entered before an operand, throwing error
- Added some data type validation to valid_decimals and trim_invalid_numerics
- Ensured valid_leadingzeros doesn't check *trailing* zeros
- Stopped entering of operators (Except minus) before any other digits have been added
- Prevent repeated, consecutive division/multiplication operators (stops 'ERROR')
- Screen text overflow prevented by wrapping and adding scrollbars
- Prevented pressing '=' immediately after entering an operator to prevent 'ERROR' (Unexpected end of input)
*/