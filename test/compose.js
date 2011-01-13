var assert = require("assert"),
	Compose = require("../lib/compose"),
	required = Compose.required,
	around = Compose.around,
	from = Compose.from,
	create = Compose.create,
	Widget, MessageWidget, SpanishWidget;

exports.testCompose = function() {
	Widget = Compose({
		render: function(node){
			node.innerHTML = "<div>hi</div>";
		}
	});
	var node = {};
	var widget = new Widget();
	widget.render(node);
	assert.equal(node.innerHTML, "<div>hi</div>");
};
exports.testComposeWithConstruct = function() {
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
	var node = {};
	var widget = new Widget(node);
	widget.render();
	assert.equal(node.innerHTML, "<div>hi</div>");
};
exports.testInheritance= function() {
	MessageWidget = Compose(Widget, {
		message: "Hello, World",
		render: function(){
			this.node.innerHTML = "<div>" + this.message + "</div>";
		}
	});
	var node = {};
	var widget = new MessageWidget(node);
	widget.render();
	assert.equal(node.innerHTML, "<div>Hello, World</div>");
};
exports.testInheritance2 = function() {
	SpanishWidget = Compose(MessageWidget, {
		message: "Hola",
	});
	var node = {};
	var widget = new SpanishWidget(node);
	widget.render();
	assert.equal(node.innerHTML, "<div>Hola</div>");
};
exports.testMultipleInheritance = function() {
	var Renderer = Compose(Widget, {
		render: function(){
			this.node.innerHTML = "test"
		}
	});
	var RendererSpanishWidget = Compose(Renderer, SpanishWidget);
	var SpanishWidgetRenderer = Compose(SpanishWidget, Renderer);
	var EmptyWidget = Compose(Widget,{});
	var MessageWidget2 = Compose(MessageWidget, EmptyWidget);
	var node = {};
	var widget = new RendererSpanishWidget(node);
	assert["throws"](function(){
		widget.render(); // should throw conflicted error
	});
	var widget = new SpanishWidgetRenderer(node);
	widget.render();
	assert.equal(node.innerHTML, "test");
	assert.equal(widget.getNode(), node);
	var widget = new MessageWidget2(node);
	widget.render();
	assert.equal(node.innerHTML, "<div>Hello, World</div>");
};
exports.testAround = function() {
	var WithTitleWidget = Compose(MessageWidget, {
		message: "Hello, World",
		render: around(function(baseRender){
			return function(){
				baseRender.apply(this);
				node.innerHTML = "<hi>Title</h1>" + node.innerHTML; 
			}
		})
	});
	var node = {};
	var widget = new WithTitleWidget(node);
	widget.render();
	assert.equal(node.innerHTML, "<hi>Title</h1><div>Hello, World</div>");
};
exports.testRequired = function() {
	var logged;
	var Logger = Compose({
		logAndRender: function(){
			logged = true;
			this.render();
		},
		render: required
	});
	var LoggerMessageWidget = Compose(Logger, MessageWidget);
	var node = {};
	var widget = new LoggerMessageWidget(node);
	widget.logAndRender();
	assert.equal(node.innerHTML, "<div>Hello, World</div>");
	assert.equal(logged, true);
	var MessageWidgetLogger = Compose(MessageWidget, Logger);
	var node = {};
	var widget = new MessageWidgetLogger(node);
	widget.logAndRender();
	assert.equal(node.innerHTML, "<div>Hello, World</div>");
	assert.equal(logged, true);
	var widget = new Logger(node);
	assert["throws"](function(){
		widget.render();
	});
};
exports.testCreate = function() {
	var widget = Compose.create({
		render: function(node){
			node.innerHTML = "<div>hi</div>";
		}
	});
	var node = {};
	widget.render(node);
	assert.equal(node.innerHTML, "<div>hi</div>");
};
exports.testInheritanceCreate= function() {
	var widget = Compose.create(Widget, {
		message: "Hello, World",
		render: function(){
			this.node.innerHTML = "<div>" + this.message + "</div>";
		}
	}, {foo: "bar"});
	widget.node = {};
	widget.render();
	assert.equal(widget.node.innerHTML, "<div>Hello, World</div>");
	assert.equal(widget.foo, "bar");
};
exports.testNestedCompose = function() {
	var ComposingWidget = Compose(Compose, {
		foo: "bar"
	});
	var widget = ComposingWidget({
		bar: "foo"
	});
	assert.equal(widget.foo, "bar");
	assert.equal(widget.bar, "foo");
};
exports.testFromAlias = function() {
	var AliasedWidget = Compose(Widget, MessageWidget, {
		baseRender: from(Widget, "render"),
		messageRender: from("render"),
		render: function(){
			this.baseRender();
			var base = this.node.innerHTML;
			this.messageRender();
			var message = this.node.innerHTML;
			this.node.innerHTML = base + message;
		}
	});
	var node = {};
	var widget = new AliasedWidget(node);
	widget.render(node);
	assert.equal(node.innerHTML, "<div>hi</div><div>Hello, World</div>");
};
exports.testFromExclude = function() {
	var ExcludeWidget = Compose(Widget, MessageWidget, {
		render: from(Widget)
	});
	var node = {};
	var widget = new ExcludeWidget(node);
	widget.render();
	assert.equal(node.innerHTML, "<div>hi</div>");
};
exports.testComplexHierarchy = function(){
	var order = [];
	var Widget = Compose(
        function(args){
            this.id = args.id;
        },
        {
            render: function(){
                order.push(1);
            }
        }
    );

    var SubMixin1 = Compose(
        {
            render: Compose.after(function(){
                order.push(2);
            })
        }
    );
    var SubMixin2 = Compose(
        function(args){
        },
        {
            render: Compose.after(function(){
                order.push(3);
            })
        }
    );
    var Mixin = Compose(SubMixin1, SubMixin2,
        {
            render: Compose.after(function(){
                order.push(4);
            })
        }
    );

    var Mixin2 = Compose(
        {
            render: around(function(baseRender){
                return function(){
                    baseRender.apply(this, arguments);
                	order.push(5);
                };
            })
        }
    );

    var Button = Compose(Widget, Mixin, Mixin2,
        function(args){
        },
        {
            render: Compose.around(function(baseRender){
                return function(){
                    baseRender.apply(this, arguments);
                    order.push(6);
                };
            })
        }
    );
    var myButton = new Button({id: "myId"});

    myButton.render();
    assert.deepEqual(order, [1,2,3,4,5,6]);
}
/*exports.testAdvice = function() {
	var order = [];
	var obj = {
		foo: function(value){
			order.push(value);
			return 6;
		},
		on: Compose.after
	};
	Compose.around(obj, "foo", function(base){
		return function(){
			order.push(2);
			try{
				return base.apply(this, arguments);
			}finally{
				order.push(4);
			}
		}
	});
	obj.on("foo", function(){
		order.push(5);
	});
	Compose.before(obj, "foo", function(value){
		order.push(value);
		return [3];
	});
	order.push(obj.foo(1));
	assert.deepEqual(order, [1,2,3,4,5,6]);
};*/

if (require.main === module)
    require("patr/runner").run(exports);
