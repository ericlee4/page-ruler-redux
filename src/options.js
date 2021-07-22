(function() {
	/*
	 * Locale
	 */
	var elements = document.getElementsByTagName('*');
	for (var i= 0, ilen=elements.length; i<ilen; i++) {
		var element = elements[i];
		if (element.dataset && element.dataset.message) {
			element.innerText = chrome.i18n.getMessage(element.dataset.message);
		}
	}

	/*
	 * Fields
	 */

	// change

	/*
	 * Update tab
	 */
	var updateTabField = document.getElementById('hide_update_tab');

	// populate
	chrome.storage.sync.get('hide_update_tab', function(items) {
		updateTabField.checked = !!items.hide_update_tab;
	});

	// change
	updateTabField.addEventListener('change', function(e) {

		// do not show
		if (this.checked) {

			console.log('disabling update tab');

			// save setting
			chrome.storage.sync.set({
				'hide_update_tab': true
			});

		}
		else {

			console.log('enabling update tab');

			// save setting
			chrome.storage.sync.set({
				'hide_update_tab': false
			});

		}

	});

})();
