/*global cryptoLib*/
/*global Promise, File, URL, alert*/
(function () {
"use strict";

function encodeAnswer (answer) {
	var c = answer.charAt(0), l = answer.length;
	if ('0' <= c && c <= '9') {
		c = c.charCodeAt(0) - '0'.charCodeAt(0);
	} else if ('a' <= c && c <= 'z') {
		c = c.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
	} else if ('A' <= c && c <= 'Z') {
		c = c.charCodeAt(0) - 'A'.charCodeAt(0) + 36;
	} else {
		c = 'äöüÄÖÜ'.indexOf(c);
		if (c === -1) {
			throw new Error('Unerlaubtes Zeichen am Beginn von `' + answer + '`');
		}
		c += 62;
	}
	if (l > 30) {
		l = 30;
	}
	return c * 30 + l - 1;
}

function encodeHint (hint, answer, options) {
	/*jshint bitwise: false*/
	var filler = new Uint8Array(options.fillerLength),
		data = new Uint8Array(8),
		salt = new Uint8Array(options.saltLength),
		result = new Uint8Array(options.fillerLength + 8 + options.saltLength),
		i;
	if (!(/^\d{4}-(0[1-9]|1[0-2])$/).test(hint)) {
		throw new Error('Hinweis `' + hint + '` im falschen Format');
	}
	cryptoLib.random(filler);
	cryptoLib.random(salt);
	answer = encodeAnswer(answer);
	filler[0] = filler[0] & options.topFillerMax;
	filler[options.fillerLength - 1] = (filler[options.fillerLength - 1] & 0xf8) | Math.floor(answer / 256);
	data[0] = answer % 256;
	for (i = 0; i < hint.length; i++) {
		data[i + 1] = hint.charCodeAt(i);
	}
	result.set(filler);
	result.set(data, options.fillerLength);
	result.set(salt, options.fillerLength + 8);
	return result;
}

function hashHint (hint, answer, options) {
	var data = encodeHint(hint, answer, options);
	return cryptoLib.hash(data, options.hashType).then(function (hash) {
		var salt = '', i;
		function hex (n) {
			n = n.toString(16);
			if (n.length === 1) {
				n = '0' + n;
			}
			return n;
		}
		for (i = 0; i < options.saltLength; i++) {
			salt += hex(data[options.fillerLength + 8 + i]);
		}
		return [hash, salt];
	});
}

function encodeQuestions (questions, options) {
	try {
		questions = questions.map(function (question) {
			return hashHint(question[2], question[1], options).then(function (hint) {
				var data = {
					q: question[0]
				};
				if (/^\d{4}-\d{2}-\d{2}$/.test(question[1])) {
					data.type = 'date';
				}
				data.hint = hint;
				return data;
			});
		});
	} catch (e) {
		return Promise.reject(e);
	}
	return Promise.all(questions).then(function (questions) {
		return {
			options: options,
			questions: questions
		};
	});
}

function encryptFile (file, questions, options) {
	return new Promise(function (resolve) {
		var reader = new FileReader(), pw;
		pw = questions.map(function (question) {
			return question[1];
		}).join('\n');
		reader.onload = function () {
			cryptoLib.encrypt(reader.result, pw, options.encryptType).then(function (data) {
				resolve(new File([data], options.date + '.enc'));
			});
		};
		reader.readAsArrayBuffer(file);
	});
}

function bitsToOptions (bits) {
	bits += 3;
	return {
		fillerLength: Math.ceil(bits / 8),
		topFillerMax: [0xff, 0x01, 0x03, 0x07, 0x0f, 0x1f, 0x3f, 0x7f][bits % 8]
	};
}

function getOptions (ignoreDate) {
	var options = bitsToOptions(Number(document.getElementById('input-bits').value));
	options.saltLength = Number(document.getElementById('input-salt').value);
	options.hashType = document.getElementById('input-hash').value;
	options.encryptType = document.getElementById('input-encrypt').value;
	if (!ignoreDate) {
		options.date = document.getElementById('input-date').value;
		if (!(/^\d{4}-(?:0[1-9]|1[0-2])$/).test(options.date)) {
			throw new Error('Datum `' + options.date + '` im falschen Format');
		}
	}
	return options;
}

function getQuestions (date) {
	var lines = document.getElementById('input-questions').value.split('\n'), questions = [], q = [];
	lines.forEach(function (line) {
		if (line) {
			q.push(line);
			if (q.length === 3) {
				if (q[2] > date) {
					throw new Error('Frage zu `' + q[2] + '` ist zu spät');
				}
				questions.push(q);
				q = [];
			}
		}
	});
	if (q.length) {
		throw new Error('Fragen haben nicht die richtige Anzahl an Zeilen');
	}
	return questions;
}

function timeHashes (options) {
	var l = options.fillerLength + 8 + options.saltLength,
		data = new Uint8Array(l),
		count = 0,
		start = Date.now();

	function updateData () {
		var i;
		for (i = 0; i < l; i++) {
			if (data[i] < 255) {
				data[i]++;
				return;
			}
			data[i] = 0;
		}
	}
	function calcHash () {
		return cryptoLib.hash(data, options.hashType).then(function () {
			count++;
			if (Date.now() - start > 10 * 1000) {
				return count / 10;
			}
			updateData();
			return calcHash();
		});
	}

	return calcHash();
}

function run () {
	var options, questions;

	function createLink (file) {
		return '<a href="' + URL.createObjectURL(file) + '" download="' + file.name + '">' + file.name + '</a>';
	}

	try {
		options = getOptions();
		questions = getQuestions(options.date);
	} catch (e) {
		alert(e);
		return;
	}
	encodeQuestions(questions, options).then(function (result) {
		var file = new File([JSON.stringify(result)], options.date + '.json');
		document.getElementById('output-json').textContent = JSON.stringify(result, null, '  ');
		document.getElementById('file-json').innerHTML = createLink(file);
	}, function (e) {
		alert(e);
	});
	encryptFile(document.getElementById('input-file').files[0], questions, options).then(function (file) {
		document.getElementById('file-encrypted').innerHTML = createLink(file);
	}, function (e) {
		alert(e);
	});
}

document.getElementById('form').addEventListener('submit', function (e) {
	e.preventDefault();
	run();
});
document.getElementById('button-time').addEventListener('click', function () {
	var bits, options = getOptions(true), output = document.getElementById('output-time');
	bits = Number(document.getElementById('input-bits').value) + 11;
	output.textContent = 'Bitte warten …';
	timeHashes(options).then(function (c) {
		var t = Math.pow(2, bits) / c;
		if (t > 100) {
			t /= 60;
			t = Math.round(t * 10) / 10 + ' Mintuen';
		} else {
			t = Math.round(t * 10) / 10 + ' Sekunden';
		}
		output.textContent = c + ' Hashes/Sekunde; ' + t + '/Monat';
	});
});

})();