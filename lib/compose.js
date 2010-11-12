/*
 * Features:
* Super calls
* Multiple inheritance
* 
 */
"use strict";
(function(define){
define([], function(exports){
	function Create(){
	}
	var defineProperty = Object.defineProperty || function(object, key, descriptor){
		object[key] = descriptor.value;
	};
	function createInstance(args){
		var arg = args[0];
		Create.prototype = typeof arg == "function" ? arg.prototype : arg;
		var instance = new Create();
		var argsLength = args.length; 
		for(var i = 1; i < argsLength; i++){
			arg = args[i];
			if(typeof arg == "function"){
				arg = arg.prototype;
				for(var key in arg){
					var value = arg[key];
					if(typeof value == "function" && key in instance && value !== instance[key]){
						if(value == required){
							continue;
						} 
						else if(arg.hasOwnProperty(key)){
							if(!value.overrides){
								value.overrides = instance[key];
							}
						}else{
							// conflict, need explicit resolution
							var overriden = value, existing = instance[key];
							while((overriden = overriden.overrides) != existing){
								if(!overriden){ // couldn't find override 
									overriden = existing;
									while((overriden = overriden.overrides) != value){
										if(!overriden){
											existing = function(){
												throw new Error("Conflicted method, final composer must explicitly override with correct method.");
											}
											break;
										}
									}
									// use existing
									value = existing;
									break;
								}
							}
							
						}
					}
					instance[key] = value;				
				}
			}else{
				for(var key in arg){
					var value = arg[key];
					if(typeof value == "object" && value){
						if(value instanceof Modifier){
							value.install.call(instance, value, key);
						}
						else if(value.value || value.get || value.set){
							defineProperty(instance, key, value);
						}else{
							instance[key] = value;
						}
					}else{
						if(typeof value == "function" && key in instance){
							if(value == required){
								continue;
							} 
							if(!value.overrides){
								value.overrides = instance[key];
							}
						}
						instance[key] = value;
					}
				}
			}
		}
		return instance;	
	}
	function Modifier(install){
		this.install = install;
	}
	Compose.around = function(advice){
		return new Modifier(function(value, key){
			this[key] = advice.call(this, this[key], key);
		});
	};
	Compose.dontEnum = function(value){
		return new Modifier(function(value, key){
			defineProperty(this, key, {
				value: value,
				enumerable: false,
				writable: true,
				configurable: true
			});
		});
	};
	Compose.create = function(base){
		var instance = createInstance(arguments);
		var argsLength = arguments.length;
		for(var i = 0; i < argsLength; i++){
			var arg = arguments[i];
			if(typeof arg == "function"){
				instance = arg.call(instance) || instance;
			}
		}
		return instance;
	}
	function required(){
		throw new Error("This method is required and no implementation has been provided");
	};
	Compose.required = required;
	var unstatedThis = (function(){
		return this;
	})(); // this depends on strict mode
	function Compose(base){
		var args = arguments;
		var prototype = createInstance(arguments);
		var argsLength = args.length;
		function Constructor(){
			var instance;
			if(this == unstatedThis){
				// we allow for direct calls without a new operator, in this case we need to
				// create the instance ourself.
				Create.prototype = prototype;
				instance = new Create();
			}else{
				instance = this;
			}
			for(var i = 0; i < argsLength; i++){
				var arg = args[i];
				if(typeof arg == "function"){
					instance = arg.apply(instance, arguments) || instance;
				}
			}		
		}
		Constructor.prototype = prototype;
		return Constructor;
	};
	
	return Compose;
});
})(typeof define!="undefined" ?
	define: // AMD/RequireJS format if available
	function(deps, factory){
		var exports = factory(); // execute the factory
		if(typeof module !="undefined"){
			module.exports = exports; // CommonJS environment, like NodeJS
		}else{
			Compose = exports; // raw script, assign to Compose global
		}
	});