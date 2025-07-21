(function () {
"use strict";

var timesInput = document.getElementById('timetable-times'),
	timetableInput = document.getElementById('timetable-input'),
	timetableOutput = document.getElementById('timetable-code'),
	timeVariants = [
		[
			['7:50', '8:35'],
			['8:40', '9:25'],
			['9:30', '10:15'],
			['10:35', '11:20', true],
			['11:25', '12:10'],
			['12:15', '13:00'],
			['13:05', '13:50'],
			['13:55', '14:40'],
			['14:45', '15:30'],
			['15:35', '16:20'],
			['16:25', '17:10'],
			['17:15', '18:00']
		],
		[
			['7:45', '8:30'],
			['8:35', '9:20'],
			['9:35', '10:20', true],
			['10:30', '11:15'],
			['11:25', '12:10', true],
			['12:15', '13:00'],
			['13:05', '13:50'],
			['13:55', '14:40'],
			['14:45', '15:30'],
			['15:35', '16:20'],
			['16:25', '17:10'],
			['17:15', '18:00']
		],
		[
			['8', '9'],
			['9', '10'],
			['10', '11'],
			['11', '12'],
			['12', '13'],
			['13', '14'],
			['14', '15'],
			['15', '16'],
			['16', '17'],
			['17', '18']
		]
	],
	tableStart = '<table class="timetable">\n<tr><th></th><th>Mo</th><th>Di</th><th>Mi</th><th>Do</th><th>Fr</th></tr>\n';

function formatTime (time) {
	if (time.indexOf(':') === -1) {
		return time;
	}
	return '<span class="time">' + time.split(/(:)/).map(function (part) {
		return '<span>' + part + '</span>';
	}).join('') + '</span>';
}

function formatRowStart (times, cls) {
	if (!cls && times[2]) {
		cls = 'break-s';
	}
	return '<tr' + (cls ? ' class="' + cls + '"' : '') + '><th>' + formatTime(times[0]) + '–' + formatTime(times[1]) + '</th>';
}

function updateTimetableInput () {
	var times = timeVariants[timesInput.value],
		html;
	html = times.map(function (time, i) {
		var row = [formatRowStart(time)], j;
		for (j = 0; j < 5; j++) {
			row.push('<td><input id="tt-' + i + '-' + j + '"></td>');
		}
		row.push('</tr>');
		return row.join('');
	});
	html = tableStart + html.join('\n') + '</table>';
	timetableInput.innerHTML = html;
	updateTimetable();
}

function updateTimetable () {
	var times = timeVariants[timesInput.value],
		rows, i, html = [], largeBreak = false;

	function formatRow (time, data, cls) {
		return formatRowStart(time, cls) +
			data.map(function (entry) {
				return '<td>' + entry + '</td>';
			}).join('') + '</tr>';
	}

	rows = times.map(function (time, i) {
		var data = [], j;
		for (j = 0; j < 5; j++) {
			data.push(document.getElementById('tt-' + i + '-' + j).value);
		}
		return {
			time: time,
			data: data
		};
	});
	for (i = 0; i < rows.length; i++) {
		if (rows[i].data.join('') === '') {
			if (html.length) {
				largeBreak = true;
			}
		} else {
			html.push(formatRow(rows[i].time, rows[i].data, largeBreak ? 'break-l' : ''));
			largeBreak = false;
		}
	}
	timetableOutput.textContent = tableStart + html.join('\n') + '\n</table>';
}

timesInput.addEventListener('change', updateTimetableInput);
timetableInput.addEventListener('change', updateTimetable);
updateTimetableInput();

})();