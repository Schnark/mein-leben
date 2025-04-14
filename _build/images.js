(function () {
"use strict";

function loadImg (urlOrFile, callback) {
	var reader, img;
	if (typeof urlOrFile !== 'string') {
		reader = new FileReader();
		reader.addEventListener('load', function () {
			loadImg(reader.result, callback);
		});
		reader.readAsDataURL(urlOrFile);
		return;
	}
	img = new Image();
	img.addEventListener('load', function () {
		callback(img, urlOrFile);
	});
	img.src = urlOrFile;
}

function createThumb (img, w, type) {
	var canvas = document.createElement('canvas'),
		ctx = canvas.getContext('2d'),
		s, width, height, thumb = {};
	width = Math.max(img.width, img.height / 2);
	if (width < w * 1.2) {
		return;
	}
	s = Math.min(1, w / width);
	width = Math.round(s * img.width);
	height = Math.round(s * img.height);
	canvas.width = width;
	canvas.height = height;
	ctx.drawImage(img, 0, 0, width, height);
	thumb.w = width;
	thumb.h = height;
	if (type === 'png') {
		thumb.url = canvas.toDataURL('image/png');
	} else {
		thumb.url = canvas.toDataURL('image/jpeg', 0.8);
	}
	return thumb;
}

function imageCode (path, pathThumb, w, h, legend, alt, large) {
	var img, link, code;

	img = '![' + alt + '](' + pathThumb + ')';
	if (w && h) {
		img += '{: width="' + w + '" height="' + h + '"}';
	}

	//https://github.com/benbalter/jekyll-relative-links/issues/74
	link = '[' + img + '<!--[-->](' + path + ')';

	if (large) {
		code = [
			'{:.image}',
			'> ' + link
		];
		if (legend) {
			code.push('>');
			code.push('> ' + legend);
		}
	} else {
		code = [
			'{:.gallery}',
			'* ' + link
		];
		if (legend) {
			code.push('');
			code.push('  ' + legend);
		}
	}
	return code.join('\n');
}

var file = document.getElementById('file'),
	url = document.getElementById('url'),
	path = document.getElementById('path'),
	legend = document.getElementById('legend'),
	alt = document.getElementById('alt'),
	large = document.getElementById('large'),
	output = document.getElementById('image'),
	images = document.getElementById('images'),
	currentImg, currentImgUrl;

function onImgChange () {
	var urlOrFile = url.value || file.files[0];
	currentImg = null;
	if (urlOrFile) {
		loadImg(urlOrFile, function (img, url) {
			currentImg = img;
			currentImgUrl = url;
			onChange();
		});
	}
}

function imgLink (url, path) {
	return '<blockquote class="image"><p>' +
		'<a href="' + url + '" target="_blank" download="' + path.replace(/^.*\//, '') + '">' +
		'<img src="' + url + '">' +
		'</a>' +
		'</p><p>' +
		'<code>' + path + '</code>' +
		'</p></blockquote>';
}

function onChange () {
	var prePath = '../files/',
		thumb, w, h, thumbPath,
		img = [];
	if (!currentImg) {
		return;
	}
	thumb = createThumb(currentImg, large.checked ? 1500 : 480, path.value.replace(/^.*\./, ''));
	if (thumb) {
		w = thumb.w;
		h = thumb.h;
		thumbPath = path.value.replace(/(\.[^.]+)$/, '-thumb$1');
	} else {
		w = currentImg.width;
		h = currentImg.height;
		thumbPath = path.value;
	}
	output.textContent = imageCode(
		prePath + path.value,
		prePath + thumbPath,
		w,
		h,
		legend.value,
		alt.value,
		large.checked
	);
	img.push('<p>Bild zum Herunterladen:</p>');
	if (thumb) {
		img = ['<p>Bilder zum Herunterladen:</p>'];
		img.push(imgLink(thumb.url, thumbPath));
	}
	img.push(imgLink(currentImgUrl, path.value));
	img = img.join(' ');
	images.innerHTML = img;
}

file.addEventListener('change', onImgChange);
url.addEventListener('change', onImgChange);
path.addEventListener('change', onChange);
legend.addEventListener('change', onChange);
alt.addEventListener('change', onChange);
large.addEventListener('change', onChange);
onImgChange();

})();