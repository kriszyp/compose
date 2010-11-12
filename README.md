# ComposeJS

ComposeJS is object composition in harmony with JavaScript, without the magic.
ComposeJS is lightweight JavaScript module based on the philosophy that JavaScript's 
powerful composition mechanisms, including prototype inheritance, closures, and object 
literals should be embraced, not contorted into an emulation of classes from other 
languages. It is designed to be very lightweight, to-the-metal fast, simple, and easy to 
use. ComposeJS assists in composing constructors and instances, providing 
shorthand and robustness for best practice JavaScript. In fact, in the documentation
equivalent JavaScript code is provided to show exactly what is happening. 

The core of ComposeJS is two functions, Compose() and compose(). Compose()
takes objects or constructors as arguments and returns a new constructor. The arguments
are composed from left to right, later arguments taken precedence (overriding) former
arguments, and any functions be executed on construction from left to right. The 
lowercase compose() function behaves like Compose(), except that
it returns object/instances rather than constructors.

To create a simple object constructor:
<pre>
	Widget = Compose({
		render: function(node){
			node.innerHTML = "<div>hi</div>";
		}
	});
	var widget = new Widget();
	widget.render(node);
</pre>
And the equivalent JavaScript:
<pre>
	Widget = function(){
	};
	Widget.prototype = {
		render: function(node){
			node.innerHTML = "<div>hi</div>";
		}
	}
	var widget = new Widget();
	widget.render(node);
</pre> 

Now let's create the constructor with a function to be executed on instantiation. Any
functions in the arguments will be executed on construction, so our provided argument
can be used to prepare the object on instantiation:
<pre>
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
</pre> 
And the equivalent JavaScript:
<pre>
	Widget = function(){
		this.node = node;
	};
	Widget.prototype = {
		render: function(node){
			this.node.innerHTML = "<div>hi</div>";
		},
		getNode: function(){
			return this.node;
		}
	}
	var widget = new Widget(node);
	widget.render();
</pre> 

To extend our Widget we can simply include the Widget in Compose arguments: 
<pre>
	Widget = Compose(Widget, {
		message: "Hello, World",
		render: function(){
			this.node.innerHTML = "<div>" + this.message + "</div>";
		}
	});
	var widget = new Widget(node);
	widget.render();
	assert.equal(node.innerHTML, "<div>hi</div>");
</pre> 
And the equivalent JavaScript:
<pre>
	Widget = function(){
	};
	Widget.prototype = {
		render: function(){
			this.node.innerHTML = "<div>hi</div>";
		}
	}
	var widget = new Widget(node);
	widget.render();
</pre> 

ComposeJS 




The concept of Traits (and TraitsJS) is a key inspiration in ComposeJS and guides 
ComposeJS's conflict handling. 

ComposeJS is designed for JavaScript developers that embrace the 
language, not for those that wish they were programming in Java, Ruby, or Python.

ComposeJS takes inspir
   