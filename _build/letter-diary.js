(function () {
"use strict";

function addBlockquote (text, cls) {
	var code = [];
	code = text.split('\n').map(function (line) {
		return line ? '> ' + line : '>';
	});
	code.unshift('{:.' + cls + '}');
	return code.join('\n');
}

function convertLetter (text) {
	var lines, i = 0;
	lines = text.split('\n');
	if (/\d.*\d\d/.test(lines[0])) {
		lines[0] = '<p class="date">' + lines[0] + '</p>';
		i = 1;
	}
	for (; i < lines.length - 1; i++) {
		if (lines[i] && lines[i + 1]) {
			lines[i] += '<br>';
		}
	}
	text = lines.join('\n');
	return addBlockquote(text, 'letter');
}

function convertDiary (latex) {
	latex = latex
		.replace(/\\,/g, ' ')
		.replace(/"=/g, '-')
		.replace(/\\seite\{\d+\}%\n/g, '')
		.replace(/\\fussnote\{.*?\}/g, '')
		.replace(/\\leerzeile(?:\[\d\])?/g, '')
		.replace(/\\(?:fehler|ergaenzt)\{(.*?)\}/g, '$1')
		.replace(/\\\\/g, '\n')
		.replace(/\\datumx?\{(.*?)\}/g, '<p class="date">$1</p>\n')
		.replace(/\\uhr\{(\d+)\}\{(\d+)\}%\n/g, '<span class="time float"><span>$1</span><span>:</span><span>$2</span></span> ')
		.replace(/\\uhrtext\{(\d+)\}\{(\d+)\}/g, '<span class="time"><span>$1</span><span>:</span><span>$2</span></span>')
		.replace(/%\n([^ ]*)/g, '$1\n')
		//Reisetagebücher
		.replace(/\\eintrag\{(.*?)\}/g, '**$1**');
	return addBlockquote(latex, 'diary');
}

var letterInput = document.getElementById('letter'),
	letterOutput = document.getElementById('letter-code'),
	diaryInput = document.getElementById('diary'),
	diaryOutput = document.getElementById('diary-code');

function onLetterChange () {
	var letter = letterInput.value;
	letterOutput.textContent = convertLetter(letter);
}

function onDiaryChange () {
	var diary = diaryInput.value;
	diaryOutput.textContent = convertDiary(diary);
}

letterInput.addEventListener('change', onLetterChange);
onLetterChange();
diaryInput.addEventListener('change', onDiaryChange);
onDiaryChange();

})();