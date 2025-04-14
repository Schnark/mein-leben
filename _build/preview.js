/*global kramed*/
(function () {
"use strict";

function mdToHtml (md) {
	var html;
	md = md.replace(/<!--\[-->/g, ''); //kramed breaks on these comments
	html = kramed(md);
	//quick-and-dirty fixes of kramdown features I use
	html = html.replace(
		/<img (.*?)>\{: width=&quot;(\d+)&quot; height=&quot;(\d+)&quot;\}/g,
		'<img width="$2" height="$3" $1>'
	);
	html = html.replace(
		/<p>\{:.(\w+)\}<\/p>\n<(\w+)/g,
		'<$2 class="$1"'
	);
	return html;
}

function fixHtml (html) {
	return html.replace(/"\.\.\/files\//g, '"../_drafts/files/');
}

var previewInput = document.getElementById('preview'),
	previewOutput = document.getElementById('preview-output');

function onChange () {
	var html = previewInput.value;
	if (html.indexOf('##') > -1) {
		html = mdToHtml(html);
	}
	previewOutput.innerHTML = fixHtml(html);
}

previewInput.addEventListener('change', onChange);
onChange();

})();