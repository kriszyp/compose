var assert = require("assert"),
	Compose = require("../lib/compose"),
	required = Compose.required,
	around = Compose.around,
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
exports.testDontEnum = function() {
	var DontEnumWidget = Compose(MessageWidget, {
		message: "Hello, World",
		dontEnum: Compose.dontEnum(3)
	});
	var widget = new DontEnumWidget({});
	assert.equal(widget.dontEnum, 3);
	if(Object.defineProperty){
		for(var i in widget){
			assert.notEqual(i, "dontEnum");
		}
	}
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
	widget = ComposingWidget({
		bar: "foo"
	});
	assert.equal(widget.bar, "foo");
	assert.equal(widget.foo, "bar");
};

if (require.main === module)
    require("patr/runner").run(exports);
