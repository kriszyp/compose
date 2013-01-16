var assert = require("assert"),
	Compose = require("../lib/compose");
require("../lib/configure");
exports.testCompose = require("./compose");
exports.testDontEnum = function() {
	var DontEnumWidget = Compose({
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
if (require.main === module)
    require("patr/runner").run(exports);
