(function () {
"use strict";

var currentButton, currentTab;

function onButtonClick (e) {
	if (e.target === currentButton) {
		return;
	}
	currentButton.className = '';
	currentTab.hidden = true;

	currentButton = e.target;
	currentTab = document.getElementById(e.target.dataset.id + '-page');
	currentButton.className = 'active';
	currentTab.hidden = false;
}

function init () {
	var buttons = document.querySelectorAll('nav button'),
		i;
	currentButton = buttons[0];
	currentTab = document.getElementsByTagName('section')[0];
	for (i = 0; i < buttons.length; i++) {
		buttons[i].addEventListener('click', onButtonClick);
	}
}

init();

})();