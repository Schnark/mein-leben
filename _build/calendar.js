(function () {
"use strict";

function getEaster (y) {
//https://de.wikipedia.org/wiki/Gaußsche_Osterformel#Eine_ergänzte_Osterformel
	var k = Math.floor(y / 100),
		m = 15 + Math.floor((3 * k + 3) / 4) - Math.floor((8 * k + 13) / 25),
		s = 2 - Math.floor((3 * k + 3) / 4),
		a = y % 19,
		d = (19 * a + m) % 30,
		r = Math.floor((d + Math.floor(a / 11)) / 29),
		og = 21 + d - r,
		sz = 7 - (y + Math.floor(y / 4) + s) % 7,
		oe = 7 - (og - sz) % 7;
	return new Date(y, 2, og + oe);
}

function getClass (date) {
	var fixed = {
		'1-1': 1,
		'6-1': 1,
		'1-5': 1,
		'3-10': 1,
		'1-11': 1,
		'24-12': 2,
		'25-12': 1,
		'26-12': 1,
		'31-12': 2
	},
	easter = {
		'-48': 2,
		'-2': 1,
		'1': 1,
		'39': 1,
		'50': 1,
		'60': 1
	}, cls;
	if (date.getDay() === 0) {
		return 1;
	}
	if (date.getFullYear() < 1990) {
		fixed['17-6'] = 1; //1990 war es ohnehin ein Sonntag
		fixed['3-10'] = 0;
	}
	if (date.getFullYear() === 2017) {
		fixed['31-10'] = 1;
	}
	cls = fixed[date.getDate() + '-' + (date.getMonth() + 1)];
	if (cls) {
		return cls;
	}
	if (
		date.getFullYear() < 1995 &&
		date.getMonth() === 10 && date.getDate() >= 16 && date.getDate() < 23 && date.getDay() === 3
	) {
		return 1;
	}
	cls = easter[Math.round((date - getEaster(date.getFullYear())) / (1000 * 60 * 60 * 24))];
	if (cls) {
		return cls;
	}
	if (date.getDay() === 6) {
		return 2;
	}
}

function createMonth (m, y) {
	var rows = [],
		currentRow = [],
		date = new Date(y, m, 1),
		i, cls;

	function addTD (html) {
		currentRow.push(html);
		if (currentRow.length === 7) {
			rows.push('<tr>' + currentRow.join('') + '</tr>');
			currentRow = [];
		}
	}

	for (i = 0; i < (date.getDay() + 6) % 7; i++) {
		addTD('<td></td>');
	}

	while (date.getMonth() === m) {
		cls = getClass(date);
		if (cls) {
			cls = ' class="h' + cls + '"';
		} else {
			cls = '';
		}
		addTD('<td' + cls + '>' + date.getDate() + '</td>');
		date.setDate(date.getDate() + 1);
	}

	while (currentRow.length !== 0) {
		addTD('<td></td>');
	}
	rows = rows.join('\n');
	return [
		'<table class="month">',
		'<tr><th>Mo</th><th>Di</th><th>Mi</th><th>Do</th><th>Fr</th><th class="h2">Sa</th><th class="h1">So</th></tr>',
		rows,
		'</table>'
	].join('\n');
}

function getSources (m, y) {
	var sources = [
		['Stadtbücherei', '1993-02', '2021-08'],
		['Schulhefte', '1993-08', '2006-06'],
		['Wikipedia', '2008-02', ''],
		['E-Mails (Backup)', '2008-10', '2011-07'],
		['Phabricator', '2010-05', ''],
		['E-Mails', '2011-08', ''],
		['GitHub', '2016-03', '']
	],
	date = String(y) + '-' + ((m < 9) ? '0' : '') + String(m + 1);
	return sources.filter(function (entry) {
		return entry[1] <= date && (!entry[2] || date <= entry[2]);
	}).map(function (entry) {
		return entry[0];
	});
}

var monthInput = document.getElementById('month'),
	yearInput = document.getElementById('year'),
	codeOutput = document.getElementById('month-code'),
	codePreview = document.getElementById('month-preview'),
	sourcesOutput = document.getElementById('sources');

function onChange () {
	var month = Number(monthInput.value),
		year = Number(yearInput.value),
		months = [
			'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
			'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
		],
		html, sources;
	if (isNaN(year) || year < 1900 || year >= 3000) {
		return;
	}
	html = createMonth(month, year);
	codePreview.innerHTML = html;
	html = '## ' + months[month] + ' ' + year + '\n\n' + html;
	codeOutput.textContent = html;
	sources = getSources(month, year);
	if (sources.length) {
		html = '<p>Weitere Quellen:</p><ul><li>' + sources.join('</li><li>') + '</li></ul>';
	} else {
		html = '';
	}
	sourcesOutput.innerHTML = html;
}

monthInput.addEventListener('change', onChange);
yearInput.addEventListener('change', onChange);
onChange();

})();