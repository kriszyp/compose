/*
 * ComposeJS, object composition for JavaScript, featuring
* JavaScript-style prototype inheritance and composition, multiple inheritance, 
* mixin and traits-inspired conflict resolution and composition  
 */
"use strict";
(function(define){
define([], function(){
	// function for creating instances from a prototype
	function Create(){
	}
	var delegate = Object.create ?
		function(proto){
			return Object.create(typeof proto == "function" ? proto.prototype : proto);
		} :
		function(proto){
			Create.prototype = typeof proto == "function" ? proto.prototype : proto;
			var instance = new Create();
			Create.prototype = null;
			return instance;
		};
	// this does the work of combining mixins/prototypes
	function mixin(instance, args, i){
		// use prototype inheritance for first arg
		var value, argsLength = args.length; 
		for(; i < argsLength; i++){
			var arg = args[i];
			if(typeof arg == "function"){
				// the arg is a function, use the prototype for the properties
				arg = arg.prototype;
				for(var key in arg){
					value = arg[key];
					if(typeof value == "function" && key in instance && value !== instance[key]){
						value = resolvePrototype(value, key, instance[key], arg.hasOwnProperty(key), instance);
					}
					if(value && value.install){
						// apply modifier
						value.install.call(instance, key);
					}else{
						instance[key] = value;
					} 
				}
			}else{
				// it is an object, copy properties, looking for modifiers
				for(var key in arg){
					var value = arg[key];
					if(typeof value == "function"){
						if(value.install){
							// apply modifier
							value.install.call(instance, key);
							continue;
						}
						if(key in instance){
							if(value == required){
								// required requirement met
								continue;
							} 
							if(!value.overrides){
								// add the overrides chain
								value.overrides = instance[key];
							}
						}
					}
					// add it to the instance
					instance[key] = value;
				}
			}
		}
		return instance;	
	}
	// allow for override (by es5 module)
	Compose._setMixin = function(newMixin){
		mixin = newMixin;
	};
	function resolvePrototype(value, key, existing, own, instance){
		if(value == required){
			// it is a required value, and we have satisfied it
			return existing;
		} 
		else if(own){
			// if it is own property, it is considered an explicit override 
			if(!value.overrides){
				// record the override hierarchy
				value.overrides = instance[key];
			}
		}else{
			// still possible conflict, see if either value is in the other value's override chain
			var overriden = value;
			while((overriden = overriden.overrides) != existing){
				if(!overriden){
					// couldn't find existing in the provided value's override chain 
					overriden = existing;
					while((overriden = overriden.overrides) != value){
						if(!overriden){
							// couldn't find value in the provided existing's override chain
							// we have a real conflict now
							existing = function(){
								throw new Error("Conflicted method, final composer must explicitly override with correct method.");
							}
							break;
						}
					}
					// use existing, since it overrides value
					value = existing;
					break;
				}
			}
			
		}
		return value;
	}
	Compose._resolvePrototype = resolvePrototype;

	// Decorator branding
	function Decorator(install){
		function Decorator(){
			throw new Error("Decorator not applied");
		}
		Decorator.install = install;
		return Decorator;
	}
	Compose.Decorator = Decorator;
	// aspect applier 
	function aspect(handler){
		return function(advice){
			return Decorator(function(key){
				var baseMethod = this[key];
				if(baseMethod && !(baseMethod.install)){
					// applying to a plain method
					this[key] = handler(this, baseMethod, advice);
				}else{
					this[key] = Compose.around(function(topMethod){
						baseMethod && baseMethod.install.call(this, key);
						return handler(this, this[key], advice);
					});
				}
			});
		};
	};
	// around advice, useful for calling super methods too
	Compose.around = aspect(function(target, base, advice){
		return advice.call(target, base);
	});
	Compose.before = aspect(function(target, base, advice){
		return function(){
			var results = advice.apply(this, arguments);
			if(results !== stop){
				return base.apply(this, results || arguments);
			}
		};
	});
	var stop = Compose.stop = {};
	var undefined;
	Compose.after = aspect(function(target, base, advice){
		return function(){
			var results = base.apply(this, arguments);
			var adviceResults = advice.apply(this, arguments);
			return adviceResults === undefined ? results : adviceResults;
		};
	});
	
	// rename Decorator for calling super methods
	Compose.from = function(trait, fromKey){
		if(fromKey){
			return (typeof trait == "function" ? trait.prototype : trait)[fromKey];
		}
		return Decorator(function(key){
			if(!(this[key] = (typeof trait == "string" ? this[trait] : 
				(typeof trait == "function" ? trait.prototype : trait)[fromKey || key]))){
				throw new Error("Source method " + fromKey + " was not available to be renamed to " + key);
			}
		});
	};
	
	// Composes an instance
	Compose.create = function(base){
		// create the instance
		var instance = mixin(delegate(base), arguments, 1);
		var argsLength = arguments.length;
		// for go through the arguments and call the constructors (with no args)
		for(var i = 0; i < argsLength; i++){
			var arg = arguments[i];
			if(typeof arg == "function"){
				instance = arg.call(instance) || instance;
			}
		}
		return instance;
	}
	// The required function, just throws an error if not overriden
	function required(){
		throw new Error("This method is required and no implementation has been provided");
	};
	Compose.required = required;
	// get the value of |this| for direct function calls for this mode (strict in ES5)
	var undefinedThis = (function(){
		return this; // this depends on strict mode
	})();
	
	var currentConstructors;
	function extend(){
		var args = [this];
		args.push.apply(args, arguments);
		return Compose.apply(undefinedThis, args);
	}
	// Compose a constructor
	function Compose(base){
		var args = arguments;
		if(this != undefinedThis){
			return mixin(this, arguments, 0); // if it is being applied, mixin into |this| 
		}
		var prototype = (args.length < 2 && typeof args[0] != "function") ? 
			args[0] : // if there is just a single argument object, just use that as the prototype 
			mixin(delegate(base), arguments, 1); // normally create a delegate to start with			
		function Constructor(){
			var instance;
			if(this === undefinedThis){
				// we allow for direct calls without a new operator, in this case we need to
				// create the instance ourself.
				Create.prototype = prototype;
				instance = new Create();
			}else{
				instance = this;
			}
			// call all the constructors with the given arguments
			for(var i = 0; i < constructorsLength; i++){
				var constructor = constructors[i];
				var result = constructor.apply(instance, arguments);
				if(typeof result == "object"){
					if(result instanceof Constructor){
						instance = result;
					}else{
						for(var key in result){
							if(result.hasOwnProperty(key)){
								instance[key] = result[key];
							}
						}
					}
				}
			}
			return instance;
		}
		Constructor._register = function(){
			register(constructors);
		};
		currentConstructors = [];
		register(arguments);
		var constructors = currentConstructors, 
			constructorsLength = constructors.length; 
		Constructor.extend = extend;
		Constructor.prototype = prototype;
		return Constructor;
	};
	function register(args){
		outer: 
		for(var i = 0; i < args.length; i++){
			var arg = args[i];
			if(typeof arg == "function"){
				if(arg._register){
					arg._register();
				}else{
					for(var j = 0; j < currentConstructors.length; j++){
						if(arg == currentConstructors[j]){
							continue outer;
						}
					}
					currentConstructors.push(arg);
				}
			}
		}
	}
	// returning the export of the module
	return Compose;
});
})(typeof define != "undefined" ?
	define: // AMD/RequireJS format if available
	function(deps, factory){
		if(typeof module !="undefined"){
			module.exports = factory(); // CommonJS environment, like NodeJS
		//	require("./configure");
		}else{
			Compose = factory(); // raw script, assign to Compose global
		}
	});