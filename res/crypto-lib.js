/*global cryptoLib: true*/
/*global crypto, TextEncoder, Promise*/
cryptoLib =
(function () {
"use strict";

function getBytes (pw, salt, bytes) {
	return crypto.subtle.importKey(
		'raw',
		new TextEncoder('utf-8').encode(pw),
		{name: 'PBKDF2'},
		false,
		['deriveBits']
	).then(function (pwbytes) {
		return crypto.subtle.deriveBits(
			{
				name: 'PBKDF2',
				salt: salt,
				iterations: 10000,
				hash: 'SHA-256'
			},
			pwbytes, bytes * 8
		);
	});
}

function getKeys (pw, salt, encrypt) {
	return getBytes(pw, salt, 80).then(function (bytes) {
		return crypto.subtle.importKey(
			'raw',
			bytes.slice(0, 32),
			{name: 'AES-CBC', length: 256},
			false,
			[encrypt ? 'encrypt' : 'decrypt']
		).then(function (key0) {
			return crypto.subtle.importKey(
				'raw',
				bytes.slice(32, 64),
				{name: 'HMAC', hash: 'SHA-256', length: 256},
				false,
				[encrypt ? 'sign' : 'verify']
			).then(function (key1) {
				return [key0, key1, bytes.slice(64)];
			});
		});
	});
}

function encrypt (keys, data) {
	return crypto.subtle.encrypt(
		{name: 'AES-CBC', iv: keys[2]},
		keys[0],
		data
	);
}

function decrypt (keys, data) {
	return crypto.subtle.decrypt(
		{name: 'AES-CBC', iv: keys[2]},
		keys[0],
		data
	);
}

function createHmac (data, key) {
	return crypto.subtle.sign('HMAC', key, data);
}

function checkHmac (data, key, hmac) {
	return crypto.subtle.verify('HMAC', key, hmac, data);
}

return {
	random: function (array) {
		crypto.getRandomValues(array);
	},
	hash: function (data, type) {
		function hex (buffer) {
			var result = [], view = new DataView(buffer), i, v, padding = '00000000';
			for (i = 0; i < view.byteLength; i += 4) {
				v = view.getUint32(i).toString(16);
				result.push((padding + v).slice(-padding.length));
			}
			return result.join('');
		}
		return crypto.subtle.digest(type, data).then(hex);
	},
	encrypt: function (data, pw, type) {
		if (type !== 'PBKDF2/SHA-256/10000+AEC-CBC-256+HMAC/SHA-256') {
			return Promise.reject('Unknown type');
		}
		var salt = crypto.getRandomValues(new Uint8Array(8));
		return getKeys(pw, salt, true).then(function (keys) {
			return encrypt(keys, data).then(function (encrypted) {
				return createHmac(encrypted, keys[1]).then(function (hmac) {
					var result = new Uint8Array(40 + encrypted.byteLength);
					result.set(salt);
					result.set(new Uint8Array(hmac), 8);
					result.set(new Uint8Array(encrypted), 40);
					return result;
				});
			});
		});
	},
	decrypt: function (data, pw, type) {
		if (type !== 'PBKDF2/SHA-256/10000+AEC-CBC-256+HMAC/SHA-256') {
			return Promise.reject('Unknown type');
		}
		var salt = data.slice(0, 8), hmac = data.slice(8, 40), encrypted = data.slice(40);
		return getKeys(pw, salt, false).then(function (keys) {
			return checkHmac(encrypted, keys[1], hmac).then(function (correct) {
				if (!correct) {
					return Promise.reject('Wrong password');
				}
				return decrypt(keys, encrypted);
			});
		});
	}
};

})();