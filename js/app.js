'use strict';
PixelEditor.init({
    input: document.getElementById('file-load'),
    operations: document.getElementById('operations'),
    original: document.getElementById('original'),
    result: document.getElementById('result')
});

$(document).ready(init);
var shouldShow = true;

function init(){
    materializeSetup();
    enableEdgeDetection();
};

function materializeSetup(){
    $('select').material_select();
	$('.materialboxed').materialbox();
    $('.button-collapse').sideNav({
	    menuWidth: 450,
	});
}

function enableEdgeDetection(){
    $('#enable_edge_detection').click(function(){
        if(shouldShow){
            $('#li_edge_detection').removeClass('hide');
            shouldShow = false;
        }else{
            $('#li_edge_detection').addClass('hide');
            shouldShow = true;
        }
    });
}