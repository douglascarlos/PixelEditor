'use strict';
PixelEditor.init({
    input: document.getElementById('file-load'),
    operations: document.getElementById('operations'),
    original: document.getElementById('original'),
    result: document.getElementById('result'),
});

$(document).ready(init);

function init(){
    materializeSetup();
    $('#menu_translate').on('click', handleClickMenuTranslate);
    $('#menu_increase_decrease').on('click', handleClickMenuIncreaseAndDecrease);
};

function materializeSetup(){
	$('.materialboxed').materialbox();
    $(".button-collapse").sideNav({
	    menuWidth: 450,
	});
}

function handleClickMenuTranslate(){
	document.getElementById('translate_size').value = '0';
	document.getElementById('translate_direction').value = 'H';
}

function handleClickMenuIncreaseAndDecrease(){
	document.getElementById('increase_decrease_percentage').value = '0';
	document.getElementById('increase_decrease_type').value = 'I';
}