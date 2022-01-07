
var selectedScriptButton = undefined;
var selectedScriptType = undefined;

function setEditorLines(N) {
	var lines = "";
	for (var i =0; i<N; i++) {
		lines += i+"\n";	
	}
	var editor_lines = document.getElementById('editor_lines');
	editor_lines.value = lines;
}

function setupEditor() {
	setEditorLines(1000);

	document.getElementById('editor_area').addEventListener('keydown', function(e) {
		if (e.key == 'Tab') {
			e.preventDefault();
			var start = this.selectionStart;
			var end = this.selectionEnd;
			this.value = this.value.substring(0, start) + "\t" + this.value.substring(end);
			this.selectionStart = this.selectionEnd = start + 1;
		}
	});

	document.addEventListener('keydown', function(e) {
		if (e.ctrlKey && (e.which == 83)) {
			e.preventDefault();
			saveScript();
		}

		if (e.ctrlKey && (e.which == 69)) {
			e.preventDefault();
			executeScript();
		}
	});

	window.onbeforeunload = function() {
	    return "PolyVR scene is not stored.";
	}
}

function selectScript(button, sName) {
	// set editor_area content
	var editor_area = document.getElementById('editor_area');
	editor_area.value = "";

	sNamePtr = allocate(intArrayFromString(sName), 0);
	var sData = __ZN3OSG20PolyVR_getScriptCoreEPKc(sNamePtr);
	var core = Module.UTF8ToString(sData);
	editor_area.value = core;

	button.className = 'script selectedScript';
	if (selectedScriptButton != undefined) selectedScriptButton.className = 'script';
	selectedScriptButton = button;

	// update toolbar
	var toolbar = document.getElementById('toolbar');
	var children = toolbar.children;
	for (var i=0; i<children.length; i++) children[i].className = "toolButton";

	// update type
	var options = document.getElementById('options');
	options.children[0].className = 'stype';
	options.children[1].className = 'stype';
	options.children[2].className = 'stype';
	var stype = Module.UTF8ToString(__ZN3OSG20PolyVR_getScriptTypeEPKc(sNamePtr));
	if (stype == 'Python') options.children[0].className = 'stype selectedScript';
	if (stype == 'GLSL')   options.children[1].className = 'stype selectedScript';
	if (stype == 'HTML')   options.children[2].className = 'stype selectedScript';
	selectedScriptType = stype;

	// clear trigger
	triggers = document.getElementById('trigger');
	cols = triggers.children;
	for (var i=0; i<cols.length; i++) {
		var col = cols[i];
		var header = col.children[0];
		
		if (i == 0) {
			var addBtn = col.children[col.children.length-1];
			col.innerHTML = "";	
			col.appendChild(header);
			col.appendChild(addBtn);			
		} else {
			col.innerHTML = "";
			col.appendChild(header);
		}
	}
	
	// update trigger
	var Ntrigers = __ZN3OSG25PolyVR_getNScriptTriggersEPKc(sNamePtr);
	for (var i=0; i<Ntrigers; i++) {
		var tData = Module.UTF8ToString(__ZN3OSG26PolyVR_getScriptIthTriggerEPKci(sNamePtr, i));
		var params = tData.split('|');
		if (params.length != 5) continue;
		addParam(0, cols[0], params[0], 'combo');
		addParam(1, cols[1], params[1], 'value');
		addParam(2, cols[2], params[2], 'combo');
		addParam(3, cols[3], params[3], 'value');
		addParam(4, cols[4], params[4], 'combo');
		addParam(5, cols[5], 'X', 'xbox');
	}

	// clear arguments
	arguments = document.getElementById('arguments');
	cols = arguments.children;
	for (var i=0; i<cols.length; i++) {
		var col = cols[i];
		var header = col.children[0];
		
		if (i == 0) {
			var addBtn = col.children[col.children.length-1];
			col.innerHTML = "";	
			col.appendChild(header);
			col.appendChild(addBtn);			
		} else {
			col.innerHTML = "";
			col.appendChild(header);
		}
	}
	
	// update arguments
	var Nargs = __ZN3OSG26PolyVR_getNScriptArgumentsEPKc(sNamePtr);
	for (var i=0; i<Nargs; i++) {
		var aData = Module.UTF8ToString(__ZN3OSG27PolyVR_getScriptIthArgumentEPKci(sNamePtr, i));
		var params = aData.split('|');
		if (params.length != 2) continue;
		addParam(0, cols[0], params[0], 'value');
		addParam(1, cols[1], params[1], 'value');
		addParam(2, cols[2], 'X', 'xbox');
	}

	//console.log("N a t" + Ntrigers +' '+ Nargs);

	_free(sNamePtr);
}

function updateScriptsList() {
	var scripts = document.getElementById('scripts');
	scripts.innerHTML = "";

	var Nscripts = __ZN3OSG18PolyVR_getNScriptsEv();
	if (Nscripts == 0) {
		setTimeout(updateScriptsList, 3000);
		return;
	}

	for (var i=0; i<Nscripts; i++) {
		var sName = Module.UTF8ToString(__ZN3OSG23PolyVR_getIthScriptNameEi(i));
		var b = document.createElement('button');
		b.innerHTML = sName;
		b.className = 'script';
		b.onclick = function(name) { return function() { selectScript(this, name); }; }(sName);
		scripts.appendChild(b);
	}		
}

function newScript() {

}

function saveScript() {
	var saveDots = document.getElementById('saveDots');
	saveDots.className = 'saving';
	setTimeout(function(){ 
		var saveDots = document.getElementById('saveDots');
		saveDots.className = 'idle'; 
		}, 500);

	var editor_area = document.getElementById('editor_area');
	var sName = selectedScriptButton.textContent;
	var sCore = editor_area.value;
	if (selectedScriptType == 'Python') {
		var n = sCore.search("\n");
		if (n != -1) sCore = sCore.substring(n+1);
	}
	sNamePtr = allocate(intArrayFromString(sName), 0);
	corePtr = allocate(intArrayFromString(sCore), 0);
	__ZN3OSG20PolyVR_setScriptCoreEPKcS1_(sNamePtr, corePtr);
	_free(sNamePtr);
	_free(corePtr);
}

function executeScript() {
	saveScript();
	var sName = selectedScriptButton.textContent;
	sNamePtr = allocate(intArrayFromString(sName), 0);
	__ZN3OSG20PolyVR_triggerScriptEPKcPS1_i(sNamePtr, [], 0);
	_free(sNamePtr);
}

function setScriptType(sType) {
	var sName = selectedScriptButton.textContent;
	sNamePtr = allocate(intArrayFromString(sName), 0);
	sTypePtr = allocate(intArrayFromString(sType), 0);
	__ZN3OSG20PolyVR_setScriptTypeEPKcS1_(sNamePtr, sTypePtr);
	_free(sNamePtr);
	_free(sTypePtr);
	selectScript(selectedScriptButton, sName);
}

function addOption(cbox, opt) {
	o = document.createElement('option');
	o.innerHTML = opt;
	o.value = opt;
	cbox.appendChild(o);
}

function addTriggerOptions(cbox) {
	addOption(cbox, 'none');
	addOption(cbox, 'on_scene_load');
	addOption(cbox, 'on_scene_close');
	addOption(cbox, 'on_scene_import');
	addOption(cbox, 'on_timeout');
	addOption(cbox, 'on_device');
	addOption(cbox, 'on_socket');
}

function addDeviceOptions(cbox) {
	addOption(cbox, 'none');
	addOption(cbox, 'mouse');
	addOption(cbox, 'keyboard');
}

function addStateOptions(cbox) {
	addOption(cbox, 'none');
	addOption(cbox, 'Pressed');
	addOption(cbox, 'Released');
	addOption(cbox, 'Drag');
	addOption(cbox, 'Drop');
	addOption(cbox, 'To Edge');
	addOption(cbox, 'From Edge');
}

function getIthSibling(e) {
	var p = e.parentElement;
	var i = -1;
	for (var j=1; j<p.children.length; j++) if (p.children[j] == e) i = j;
	return i;
}

function removeRow() {
	var i = getIthSibling(this) - 1; // -1 because of header row
	var d = this.parentElement.parentElement.id;
	var sName = selectedScriptButton.textContent;
	sNamePtr = allocate(intArrayFromString(sName), 0);
	if (d == 'trigger') __ZN3OSG26PolyVR_remScriptIthTriggerEPKci(sNamePtr, i);
	if (d == 'arguments') __ZN3OSG27PolyVR_remScriptIthArgumentEPKci(sNamePtr, i);
	_free(sNamePtr);
	selectScript(selectedScriptButton, sName);
}

function addParam(i, col, param, type) {
	var rows = col.children;
	var val = undefined;
	if (type == 'value') {
		val = document.createElement('div');
		val.innerHTML = param;
		val.contentEditable = true;
		val.oninput = changeParam;
	}
	if (type == 'combo') {
		val = document.createElement('select');
		if (i == 0) addTriggerOptions(val);
		if (i == 2) addDeviceOptions(val);
		if (i == 4) addStateOptions(val);
		val.value = param;
		val.onchange = changeCombo;
	}
	if (type == 'xbox') {
		val = document.createElement('button');
		val.innerHTML = param;
		val.onclick = removeRow;
	}
	val.className = 'paramEntry';
	if (i == 0) col.insertBefore(val, rows[rows.length-1]);
	else col.appendChild(val);
}

function addTrigger() {
	var sName = selectedScriptButton.textContent;
	sNamePtr = allocate(intArrayFromString(sName), 0);
	__ZN3OSG23PolyVR_addScriptTriggerEPKc(sNamePtr);
	_free(sNamePtr);
	selectScript(selectedScriptButton, sName);
}

function addArgument() {
	var sName = selectedScriptButton.textContent;
	sNamePtr = allocate(intArrayFromString(sName), 0);
	__ZN3OSG24PolyVR_addScriptArgumentEPKc(sNamePtr);
	_free(sNamePtr);
	selectScript(selectedScriptButton, sName);
}

function setTriggerType(i, type) {
	var sName = selectedScriptButton.textContent;
	sNamePtr = allocate(intArrayFromString(sName), 0);
	sTypePtr = allocate(intArrayFromString(type), 0);
	__ZN3OSG30PolyVR_setScriptIthTriggerTypeEPKciS1_(sNamePtr, i, sTypePtr);
	_free(sNamePtr);
	_free(sTypePtr);
	selectScript(selectedScriptButton, sName);
}

function setTriggerParam(i, param) {
	var sName = selectedScriptButton.textContent;
	sNamePtr = allocate(intArrayFromString(sName), 0);
	sParamPtr = allocate(intArrayFromString(param), 0);
	__ZN3OSG31PolyVR_setScriptIthTriggerParamEPKciS1_(sNamePtr, i, sParamPtr);
	_free(sNamePtr);
	_free(sParamPtr);
	selectScript(selectedScriptButton, sName);
}

function setTriggerDevice(i, dev) {
	var sName = selectedScriptButton.textContent;
	sNamePtr = allocate(intArrayFromString(sName), 0);
	sDevPtr = allocate(intArrayFromString(dev), 0);
	__ZN3OSG32PolyVR_setScriptIthTriggerDeviceEPKciS1_(sNamePtr, i, sDevPtr);
	_free(sNamePtr);
	_free(sDevPtr);
	selectScript(selectedScriptButton, sName);
}

function setTriggerKey(i, key) {
	var sName = selectedScriptButton.textContent;
	sNamePtr = allocate(intArrayFromString(sName), 0);
	__ZN3OSG29PolyVR_setScriptIthTriggerKeyEPKcii(sNamePtr, i, key);
	_free(sNamePtr);
	selectScript(selectedScriptButton, sName);
}

function setTriggerState(i, state) {
	var sName = selectedScriptButton.textContent;
	sNamePtr = allocate(intArrayFromString(sName), 0);
	sStatePtr = allocate(intArrayFromString(state), 0);
	__ZN3OSG31PolyVR_setScriptIthTriggerStateEPKciS1_(sNamePtr, i, sStatePtr);
	_free(sNamePtr);
	_free(sStatePtr);
	selectScript(selectedScriptButton, sName);
}

function setArgumentVar(i, vari) {
	var sName = selectedScriptButton.textContent;
	sNamePtr = allocate(intArrayFromString(sName), 0);
	sVariPtr = allocate(intArrayFromString(vari), 0);
	__ZN3OSG30PolyVR_setScriptIthArgumentVarEPKciS1_(sNamePtr, i, sVariPtr);
	_free(sNamePtr);
	_free(sVariPtr);
	selectScript(selectedScriptButton, sName);
}

function setArgumentVal(i, val) {
	var sName = selectedScriptButton.textContent;
	sNamePtr = allocate(intArrayFromString(sName), 0);
	sValPtr = allocate(intArrayFromString(val), 0);
	__ZN3OSG30PolyVR_setScriptIthArgumentValEPKciS1_(sNamePtr, i, sValPtr);
	_free(sNamePtr);
	_free(sValPtr);
	selectScript(selectedScriptButton, sName);
}

function changeCombo() {
	var i = getIthSibling(this) - 1; // -1 because of header row
	var v = this.value;
	var h = this.parentElement.children[0].textContent;
	if (h == 'Trigger') setTriggerType(i, v);
	if (h == 'Device') setTriggerDevice(i, v);
	if (h == 'State') setTriggerState(i, v);
}

function changeParam() {
	var i = getIthSibling(this) - 1; // -1 because of header row
	var v = this.textContent;
	var h = this.parentElement.children[0].textContent;
	if (h == 'Parameter') setTriggerParam(i, v);
	if (h == 'Key') setTriggerKey(i, parseInt(v));
	if (h == 'Argument') setArgumentVar(i, v);
	if (h == 'Value') setArgumentVal(i, v);
}

function onScrollEditor() {
	var lines = document.getElementById("editor_lines");
	var area  = document.getElementById("editor_area");
	lines.scrollTop = area.scrollTop;
}
