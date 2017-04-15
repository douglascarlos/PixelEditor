'use strict';
PixelEditor.init({
    input: document.getElementById('file-load'),
    operations: document.getElementById('operations'),
    original: document.getElementById('original'),
    result: document.getElementById('result'),
});

$(".button-collapse").sideNav({
    menuWidth: 450,
});

$(document).ready(function(){
    $('.materialboxed').materialbox();
});

