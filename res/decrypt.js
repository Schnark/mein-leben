/*global cryptoLib*/
/*global fetch, File, URL*/
(function () {
"use strict";

function decodeAnswer (b0, b1) {
	var a = (b0 % 8) * 256 + b1, c, l;
	c = Math.floor(a / 30);
	if (c <= 9) {
		c = String(c);
	} else if (c <= 35) {
		c = String.fromCharCode(c - 10 + 'a'.charCodeAt(0));
	} else if (c <= 61) {
		c = String.fromCharCode(c - 36 + 'A'.charCodeAt(0));
	} else {
		c = 'äöüÄÖÜ'.charAt(c - 62);
	}
	l = a % 30 + 1;
	return [c, l];
}

function decodeHint (hint, options) {
	var h = '', i;
	for (i = options.fillerLength + 1; i < options.fillerLength + 8; i++) {
		h += String.fromCharCode(hint[i]);
	}
	return {
		hint: h,
		answer: decodeAnswer(hint[options.fillerLength - 1], hint[options.fillerLength])
	};
}

function tryHint (hint, saltHex, hash, options) {
	var filler = new Uint8Array(options.fillerLength + 1),
		data = new Uint8Array(7),
		salt = new Uint8Array(options.saltLength),
		total = new Uint8Array(options.fillerLength + 8 + options.saltLength),
		i;
	for (i = 0; i < hint.length; i++) {
		data[i] = hint.charCodeAt(i);
	}
	for (i = 0; i < options.saltLength; i++) {
		salt[i] = parseInt(saltHex.slice(2 * i, 2 * i + 2), 16);
	}
	total.set(filler);
	total.set(data, options.fillerLength + 1);
	total.set(salt, options.fillerLength + 8);

	function tryCurrentHint () {
		return cryptoLib.hash(total, options.hashType).then(function (result) {
			return result === hash;
		});
	}

	function updateTotal () {
		var j = 0;
		while (j < options.fillerLength + 1) {
			if (filler[j] < (j === 0 ? options.topFillerMax : 255)) {
				filler[j]++;
				total.set(filler);
				return true;
			} else {
				filler[j] = 0;
				j++;
			}
		}
		return false;
	}

	function tryNextHint () {
		return tryCurrentHint().then(function (matched) {
			if (matched) {
				return total;
			}
			if (updateTotal()) {
				return tryNextHint();
			} else {
				return false;
			}
		});
	}

	return tryNextHint();
}

function tryAllHints (salt, hash, options) {
	var current = options.date, d;
	function tryNextHint () {
		return tryHint(current, salt, hash, options).then(function (result) {
			if (result) {
				return decodeHint(result, options);
			} else {
				d = new Date(current + '-10');
				d.setMonth(d.getMonth() - 1);
				current = d.toISOString().slice(0, 7);
				return tryNextHint();
			}
		});
	}
	return tryNextHint();
}

function formatMonth (date) {
	var months = [
		'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
		'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
	];
	date = date.split('-');
	return months[date[1] - 1] + ' ' + date[0];
}

function getIntroHtml (options) {
	return '<h3>Fragen</h3><p>Die verschlüsselten Inhalte und die Fragen dazu ' +
		'beziehen sich auf die Zeit bis ' + formatMonth(options.date) + '.</p>';
}

function buildFormHtml (questions) {
	return '<form id="form-questions">' + questions.map(function (question) {
		var input = '<input ' + (question.type ? 'type="' + question.type + '" ' : '') + '>',
			hint = '<small class="hint-0" data-hash="' + question.hint[0] + '" data-salt="' +
				question.hint[1] + '">Hinweis erzeugen</small>';
		return '<p><label>' + question.q + '<br>' + input + '</label><br>' + hint + '</p>';
	}).join('\n') + '<p><button>Daten entschlüsseln</button></p></form><p id="result"></p>';
}

function processHint (el, options) {
	el.className = 'hint-1';
	el.textContent = 'Hinweis wird erzeugt …';
	tryAllHints(el.dataset.salt, el.dataset.hash, options).then(function (data) {
		var hint = data.hint, c = data.answer[0], l = data.answer[1], link, html;
		link = '<a target="_blank" href="' + hint.replace('-', '/') + '/">';
		link += formatMonth(hint);
		link += '</a>';
		html = 'Die Antwort hat <strong>' + (l === 30 ? 'mindestens 30' : l) + ' Zeichen</strong> und ';
		html += 'beginnt mit <strong>' + c + '</strong>; ';
		html += 'bei ' + link + ' findet sich die Antwort oder zumindest ein Hinweis.';
		el.className = 'hint-2';
		el.innerHTML = html;
	});
}

function getUrl (date, type) {
	return 'files/encrypted/' + date + '.' + type;
}

function tryDecryptFile (options) {
	var inputs = document.querySelectorAll('#container input'), i, answers = [];
	for (i = 0; i < inputs.length; i++) {
		answers.push(inputs[i].value);
	}
	return fetch(getUrl(options.date, 'enc')).then(function (response) {
		return response.arrayBuffer();
	}).then(function (data) {
		return cryptoLib.decrypt(data, answers.join('\n'), options.encryptType);
	}).then(function (data) {
		return new File([data], options.date + '.zip');
	});
}

function initPage () {
	var container = document.getElementById('container'), date;

	function showError (e) {
		container.innerHTML = '<p class="error">' + e + '</p>';
	}

	function buildPage () {
		fetch(getUrl(date, 'json')).then(function (response) {
			return response.json();
		}).then(function (data) {
			var result;
			container.innerHTML = getIntroHtml(data.options) + buildFormHtml(data.questions);
			result = document.getElementById('result');
			container.addEventListener('click', function (e) {
				var el = e.target;
				if (el.className === 'hint-0') {
					processHint(el, data.options);
				}
			});
			document.getElementById('form-questions').addEventListener('submit', function (e) {
				e.preventDefault();
				tryDecryptFile(data.options).then(function (file) {
					result.innerHTML = '<a download="' + file.name + '" href="' +
						URL.createObjectURL(file) + '">Datei herunterladen</a>';
					result.getElementsByTagName('a')[0].click();
				}, function () {
					result.textContent = 'Mindestens eine Antwort ist nicht korrekt!';
				});
			});
		}, function () {
			showError('Es wurde kein korrektes Datum angegeben.');
		});
	}

	if (!window.fetch || !window.crypto || !window.crypto.subtle) {
		showError('Dein Browser ist leider so alt, dass er nicht die nötigen Javascript-APIs bereitstellt.');
		return;
	}
	date = /[?&]date=(local|\d{4}-(?:0[1-9]|1[0-2]))(?:&|$)/.exec(location.search);
	if (!date) {
		showError('Es wurde kein korrektes Datum angegeben.');
		return;
	}
	date = date[1];
	if (date === 'local') {
		container.innerHTML = [
			'<form id="form-local">',
			'<p><label>JSON-Konfiguration: <input id="input-json" type="file"></label></p>',
			'<p><label>Verschlüsselte Datei: <input id="input-enc" type="file"></label></p>',
			'<p><button>Dateien laden</button></p>',
			'</form>'
		].join('');
		document.getElementById('form-local').addEventListener('submit', function (e) {
			var files = {};
			e.preventDefault();
			files.json = URL.createObjectURL(document.getElementById('input-json').files[0]);
			files.enc = URL.createObjectURL(document.getElementById('input-enc').files[0]);
			getUrl = function (date, type) {
				return files[type];
			};
			buildPage();
		});
	} else {
		buildPage();
	}
}

initPage();
})();