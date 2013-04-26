# ComposeJS

ComposeJS is robust object composition built on native JavaScript mechanisms.
ComposeJS is lightweight (3K minified, 1K gzipped) JavaScript module based on the 
philosophy that JavaScript's 
powerful composition mechanisms, including prototype inheritance, closures, and object 
literals should be embraced, not contorted into an emulation of classes from other 
languages. It is designed to be secure, to-the-metal fast, simple, and easy to 
use. ComposeJS builds on some of the best concepts from mixins, (traits)[http://traitsjs.org], and 
deterministic multiple inheritance. ComposeJS assists in composing constructors and instances, providing 
shorthand and robustness for best practice JavaScript. In fact, in the documentation
equivalent JavaScript code is provided to show exactly what is happening. 

The core of ComposeJS is the Compose function. Compose()
takes objects or constructors as arguments and returns a new constructor. The arguments
are composed from left to right, later arguments taken precedence (overriding) former
arguments, and any functions be executed on construction from left to right. A second
key function is Compose.create() which behaves like Compose(), except that
it returns object/instances rather than constructors.

If you are using ComposeJS in a CommonJS environment, you can load it:

	var Compose = require("compose");

Or an AMD module loader (RequireJS, Dojo, etc), you can load it:

	define(["compose"], function(Compose){
		...
	});

If ComposeJS is loaded as a plain script, it will create Compose as a global variable.

Now to start using Compose, let's create a simple object constructor:

	Widget = Compose({
		render: function(node){
			node.innerHTML = "<div>hi</div>";
		}
	});
	var widget = new Widget();
	widget.render(node);

And the equivalent JavaScript:

	Widget = function(){
	};
	Widget.prototype = {
		render: function(node){
			node.innerHTML = "<div>hi</div>";
		}
	}
	var widget = new Widget();
	widget.render(node);

One the features provided by ComposeJS is that it creates constructors that will work
regardless of whether they are called with the new operator, making them less prone
to coding mistakes. One can also choose to omit the new operator to save bytes (for faster
download), although calling with the new operator is slightly faster at runtime (so
the faster overall would depend on how many times it is called).

## Extending existing constructor

To extend our Widget we can simply include the Widget in Compose arguments: 

	HelloWidget = Compose(Widget, {
		message: "Hello, World",
		render: function(){
			this.node.innerHTML = "<div>" + this.message + "</div>";
		}
	});
	var widget = new HelloWidget();
	widget.render(node);

And the equivalent JavaScript:

	HelloWidget = function(){
		this.message = "Hello, World";
	};
	HelloWidget.prototype = new Widget();
	HelloWidget.prototype.render: function(){
		this.node.innerHTML = "<div>" + this.message + "</div>";
	};
	var widget = new HelloWidget();
	widget.render(node); 


Now let's create the constructor with a function to be executed on instantiation. Any
functions in the arguments will be executed on construction, so our provided argument
can be used to prepare the object on instantiation:

	Widget = Compose(function(node){
		this.node = node;
	},{
		render: function(){
			this.node.innerHTML = "<div>hi</div>";
		},
		getNode: function(){
			return this.node;
		}
	});
	var widget = new Widget(node);
	widget.render();

And the equivalent JavaScript:

	Widget = function(node){
		this.node = node;
	};
	Widget.prototype = {
		render: function(){
			this.node.innerHTML = "<div>hi</div>";
		},
		getNode: function(){
			return this.node;
		}
	}
	var widget = new Widget(node);
	widget.render(); 

Compose can compose constructors from multiple base constructors, effectively
providing multiple inheritance. For example, we could create a new widget from Widget
and Templated base constructors:

	TemplatedWidget = Compose(Widget, Templated, {
	  // additional functionality
	});

Again, latter argument's methods override former argument's methods. In this case,
Templated's methods will override any Widget's method of the same name. However,
Compose is carefully designed to avoid any confusing conflict resolution in ambiguous cases.
Automatic overriding will only apply when later arguments have their own methods.
If a later argument constructor or object inherits a method, this will not automatically override
former base constructor's methods unless it has already overridden this method in another base
constructor's hierarchy. In such cases, the appropriate method must be designated in the final
object or else it will remain in a conflicted state. This essentially means that explicit ordering 
provides straightforward, easy to use, method overriding, without ambiguous magical conflict 
resolution (C3MRO).

We can specify required methods that must be overridden as well. For example, we can
define the Widget to require a generateHTML method:

	var required = Compose.required;
	Widget = Compose({
		generateHTML: required,
		...
	});

And now to extend the Widget constructor, we must provide a generateHTML method.
Failure to do so will result in an error being thrown when generateHTML is called.

## Apply to an existing object

Compose can also be applied to existing objects to add/mixin functionality to that object.
This is done by using the standard call() or apply() function methods to define |this| for the
call. When Compose is applied in this way, the target object will have the methods from
all the provide objects or constructors added to it. For example:

	var object = {a: 1};
	Compose.call(object, {b: 2});
	object -> {a: 1, b: 2}

We can use this form of Compose to add methods during construction. This is one style
of creating instances that have private and public methods. For example, we could extend
Widget with:

	var required = Compose.required;
	Widget = Compose(Widget, function(innerHTML){
		// this will mixin the provide methods into |this|
		Compose.call(this, {
			generateHTML: function(){
				return "<div>" + generateInner() + "</div>";
			}
		});
		// private function
		function generateInner(){
			return innerHTML;
		}
	});

Applying Compose can also be conveniently leveraged to make constructors that mixin properties
from an object argument. This is a common pattern for constructors and allows an
instance to be created with preset properties provided to the constructor. This also
also makes it easy to have independent optional named parameters with defaults.
We can implement this pattern by simple having Compose be a base constructor
for our composition. For example, we can create a widget that extends Compose
and therefore we can instantiate Widgets with an object argument that provides initial property settings:

	Widget = Compose(Compose, {
		render: function(){
			this.node.innerHTML = "<div>hi</div>";
		}
	});
	var widget = new Widget({node: byId("some-id")});
	widget.node -> byId("some-id")
	widget.render(); 

This is a powerful way to build constructors since constructors can be created that include
all the functionality that Compose provides, including decorators and multiple 
objects or constructors as arguments.

## Compose.create

Compose.create() is another function provided by the ComposeJS library. This function
is similar to Compose() and takes exactly the same type of arguments (any mixture 
of constructors or objects), but rather 
than creating a constructor, it directly creates an instance object. Calling the constructor
returned from Compose with no arguments and calling Compose.create act approximately 
the same action, i.e. Compose(...)() acts the same as Compose.create(...). The main
difference is that Compose.create is optimized for instance creation and avoids
unnecessary prototype creation involved in creating a constructor.

Compose.create is particularly useful in conjunction with the closure-style constructors.
A closure-style constructor (sometimes called the module pattern) can have private
variables and generally returns an object created using object literal syntax. 
For base constructors that don't extend anything else, This is well-supported by native JavaScript
there is no need to use ComposeJS (or another library) to create a simple base constructor.
But for extending base constructors, Compose.create is very useful. For example,
we could create a base widget using this pattern (again, we can just use native JavaScript):

	Widget = function(node){ // node is a private variable
		return {
			render: function(){
				node.innerHTML = this.message;
			},
			message: "Hello"
		};
	};

And now we could extend this widget, continuing to use the closure-style constructor,
with help from Compose.create. Here we will call base constructor, and use the returned
base instance to compose an extended instance. The "node" variable continues to stay
protected from direct access:

	BoldWidget = function(node){
		baseWidget = Widget(node);
		return Compose.create(baseWidget, {
			render: function(){
				baseWidget.render(); 
				node.style.fontWeight = "bold";
			}
		});
	};

##Constructor.extend
Constructors created with Compose also include a "static" extend method that can be
used for convenience in creating subclasses. The extend method behaves the same
as Compose with the target class being the first parameter:

	MyClass = Compose(...);
	SubClass = MyClass.extend({
		subMethod: function(){}
	});
	// same as:
	SubClass = Compose(MyClass,{
		subMethod: function(){}
	});

## Decorators
Decorators provides a customized way to add properties/methods to target objects.
Several decorators are provided with ComposeJS:

### Aspects (or Super-calls)

Compose provides an aspect-oriented decorator to add functionality to existing method 
instead of completely overriding or replacing the method. This provides super-call type 
functionality. The after() function allows one to add code that will be executed after
the base method:

	var after = Compose.after;
	WidgetWithTitle = Compose(Widget, {
		render: after(function(){
			// called after the original render() from Widget  
			this.node.insertBefore(header, this.node.firstChild);
		}
	});

The after() advice (provided function) can return a value that will be returned to the original caller. If
nothing is returned, the inherited method's return value will be returned.
 
The before() function allows one to add code that will be executed before
the base method:

	var before = Compose.before;
	BoldWidget = Compose(Widget, {
		render: before(function(){
			// called before the original render() from Widget  
			this.node.style.fontWeight = "bold";
		}
	});

The before() advice can return an array that will be used as the arguments for the
inherited function. If nothing is returned, the original calling arguments are passed to
the inherited function. If Compose.stop is returned, the inherited function will not be 
called.

The around function allows one to closure around an overridden method to combine
functionality. For example, we could override the render function in Widget, but still
call the base function:   

	var around = Compose.around;
	BoldWidgetWithTitle = Compose(Widget, {
		render: around(function(baseRender){
			// return the new render function
			return function(){
				this.node.style.fontWeight = "bold";
				baseRender.call(this);
				this.node.insertBefore(header, this.node.firstChild);
			};
		});
	});

### Composition Control: Method Aliasing and Exclusion
One of the key capabilities of traits-style composition is control of which method to
keep or exclude from the different components that are being combined. The from()
decorator provides simple control over which method to use. We can use from() with
the base constructor to indicate the appropriate method to keep. For example, if we
composed from Widget and Templated, we could use from() to select the save()
method from Widget and render() from Templated:

	var from = Compose.from;
	TemplatedWidget = Compose(Widget, Templated, {
		save: from(Widget),
		render: from(Templated)
	});

We can also alias methods, making them available under a new name. This is very useful
when we need to access multiple conflicting methods. We can provide a string argument
that indicates the method name to retrieve (it will be aliased to the property name that
it is being applied to). With the string argument, the constructor argument is optional
(defaults to whatever method would naturally be selected for the given name):

	var from = Compose.from;
	TemplatedWidget = Compose(Widget, Templated, {
		widgetRender: from(Widget, "render"),
		templateRender: from(Templated, "render"),
		saveTemplate: from("save"),
		render: function(){
			this.widgetRender();
			this.templateRender();
			// do other stuff
		},
		save: function(){
			this.saveTemplate();
			//...
		}
	});

#### Conflict Example
To help understand conflicts, here is the simplest case where Compose would give a conflict error:

	A = Compose({
		foo: function(){ console.log("A foo"); }
	});

	B = Compose({
		foo: function(){ console.log("B foo"); }
	});
	
	C = Compose(B, {});
	
	D = Compose(A, C);
	new D().foo()

Compose considers class D's foo() method to be a conflict because for C takes 
precedence over A, but C only inherits foo, it doesn't directly have foo. In other 
words, a breadth-first linearization of methods would give A's foo precedence,
but a depth-first linearization of methods would give B's foo precedence, and 
since this disagree, it is considered ambiguous. Note that these are all conflict free:

	D = Compose(C, A); // A's own foo() wins
	D = Compose(A, B); // B's own foo() wins
	D = Compose(A, C, {foo: Compose.from(A)}); // explicitly chose A's foo
	D = Compose(A, C, {foo: Compose.from(B)}); // explicitly chose B's foo

### Creating Decorators
Decorators are created by newing the Decorator constructor with a function argument
that is called with the property name. The function's |this| will be the target object, and
the function can add a property anyway it sees fit. For example, you could create a decorator
that would explicitly override another methods, and fail if an existing method as not there. 

	overrides = function(method){
		return new Compose.Decorator(function(key){
			var baseMethod = this[key];
			if(!baseMethod){
				throw new Error("No method " + key + " exists to override");
			}
			this[key] = method;
		});
	};
	
	Widget = Compose({
		render: function(){
			...
		}
	});
	SubWidget = Compose(Widget, {
		render: overrides(function(){
			...
		})
	});

In addition, the Decorator function accepts a second argument, which is the function
that would be executed if the decorated method is directly executed and does not override another method.

### Security
By default Compose will add a constructor property to your constructor's prototype to make
the constructor available from instances:

	Widget = Compose({...});
	var widget = new Widget();
	widget.constructor == Widget // true

However, in the context of object capability security, providing access to the constructor
from instances is considered a violation of principle of least access. If you would like to
disable this feature for the purposes of using Compose in secure environments, you can
set:

Compose.secure = true;

### Enumeration on Legacy Internet Explorer
Internet Explorer 8 and earlier have a known issue with enumerating properties that 
shadow dontEnum properties (toString, toValue, hasOwnProperty, etc. for objects), which
means that these properties will not be copied to your class on these versions of IE. There is a known
fix for this, but it does meet the high performance and space priorities of Compose.
However, if you need to override one of these methods, you can easily workaround this
issue by setting the method in the constructor instead of the provide object. For example:

	Widget = Compose(function(){
		this.toString = function(){
			// my custom toString method
		};
	},{
		// my other methods
	});
  