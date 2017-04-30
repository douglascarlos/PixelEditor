'use strict';
PixelEditor.init({
    input: document.getElementById('file-load'),
    operations: document.getElementById('operations'),
    original: document.getElementById('original'),
    result: document.getElementById('result')
});

$(document).ready(init);

function init(){
    materializeSetup();
};

function materializeSetup(){
    $('select').material_select();
	$('.materialboxed').materialbox();
    $(".button-collapse").sideNav({
	    menuWidth: 450,
	});
}