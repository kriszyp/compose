/*
 * This module extends compose.js to add ES5 property configuration capability  
 */
"use strict";
(function(define){
define(["./compose"], function(Compose){
	var defineProperty = Object.defineProperty;
	var getOwnPropertyNames = Object.getOwnPropertyNames;
	var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
	var resolvePrototype = Compose._resolvePrototype;
	// this does the work of combining mixins/prototypes
	Compose._setMixin(function(instance, args, i){
		console.log("configure");
		// use prototype inheritance for first arg
		var argsLength = args.length; 
		for(; i < argsLength; i++){
			var arg = args[i];
			if(typeof arg == "function"){
				// the arg is a function, use the prototype for the properties
				var own = true;
				arg = arg.prototype;
				do{
					forIn(resolvePrototype);
					arg = Object.getPrototypeOf(arg);
					own = false;
				}while(arg && arg != Object.prototype);
			}else{
				// it is an object, copy properties, looking for modifiers
				forIn(function(value, key, existing, own){
					if(!value.overrides){
						// add the overrides chain
						value.overrides = instance[key];
					}
					return value;
				});
			}
		}
		function forIn(resolve){
			var names = Object.getOwnPropertyNames(arg);
			for(var j = 0, l = names.length; j < l; j++){
				var key = names[j];
				var descriptor = getOwnPropertyDescriptor(arg, key);
				var instanceValue, value = descriptor.value;
				console.log("key",key);
				if(typeof value == "function" && key in instance && 
					value !== (instanceValue = instance[key])){
					descriptor.value = value = resolve(value, key, instanceValue, own);
					if(value == required){
						continue;
					}
					if(value && value.install){
				console.log("install",key);
						value.install.call(instance, key);
						continue;
					}
				}
				else if(typeof (value = descriptor.get) == "function" && key in instance && 
					value !== (instanceValue = getOwnPropertyDescriptor(instance, key).get)){
					descriptor.get = resolve(value, key, instanceValue, own);
				}
				else if(typeof (value = descriptor.set) == "function" && key in instance && 
					value !== (instanceValue = getOwnPropertyDescriptor(instance, key).get)){
					descriptor.set = resolve(value, key, instanceValue, own);
				}
				// apply the value from this arg's property
				defineProperty(instance, key, descriptor);
			}
		}		
		return instance;	
	});
	var Decorator = Compose.Decorator;
	// dontEnum Decorator
	Compose.dontEnum = function(value){
		return Decorator(function(key){
			defineProperty(this, key, {
				value: value,
				enumerable: false,
				writable: true,
				configurable: true
			});
		});
	};
	// readonly Decorator
	Compose.readonly = function(value){
		return Decorator(function(key){
			defineProperty(this, key, {
				value: value,
				enumerable: true,
				writable: false,
				configurable: true
			});
		});
	};
	return Compose;
});
})(typeof define != "undefined" ?
	define: // AMD/RequireJS format if available
	function(deps, factory){
		if(typeof module !="undefined"){
			module.exports = factory(require("./compose")); // CommonJS environment, like NodeJS
		}else{
			factory(Compose); // raw script, assign to Compose global
		}
	});