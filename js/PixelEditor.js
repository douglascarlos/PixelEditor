'use strict';

var PixelEditor = {

	// Métodos de interface

	init: function(args){
		console.log('init');
		this.loadedImage = false;
		this.html = {
			input: args.input,
			operations: args.operations,
			original: args.original,
			result: args.result
		};

		this.PIXEL_LENGTH = 4;
		this.WHITE_PIXEL = [255, 255, 255, 255];
		this.BLACK_PIXEL = [0, 0, 0, 255];
		
		this.RED_ADDITIONAL = 0.2125;
		this.GREEN_ADDITIONAL = 0.7154;
		this.BLUE_ADDITIONAL = 0.0721;

		// Properties for cache
		this._cacheObj = null;
		this._currentActionName = null;

		this._prepareInputs();
		this._buildContent();
	},

	_prepareInputs: function(){
		console.log('_prepareInputs');
		function buttonCall(){
			PixelEditor.execute(this.dataset.action);
		}

		var links = this.html.operations.getElementsByClassName('trigger');
		[].slice.call(links).forEach(function(btn){
			btn.addEventListener('click', buttonCall);
		}, this);

		this.html.input.addEventListener('change', this._uploadFile);
	},

	_buildContent: function(){
		console.log('_buildContent');
		var fragment = document.createDocumentFragment();

		this.html.preview = this._create('canvas');
		fragment.appendChild(this.html.preview);
		this.previewContext = this.html.preview.getContext('2d');

		this.html.original.appendChild(fragment);
	},

	_uploadFile: function(){
		console.log('_uploadFile');
		if(this.files && this.files.length){
			var file = this.files[0],
				img = new Image();

			img.onload = function(){
				PixelEditor.loadPreviewImage(this);
			};
			img.src = URL.createObjectURL(file);
		}
	},

	loadPreviewImage: function(image){
		console.log('loadedImage');
		var preview = this.html.preview;

		preview.width = image.width;
		preview.height = image.height;

		this.previewContext.drawImage(image, 0, 0);

		this.loadedImage = true;
		this.html.operations.classList.remove('hide');
		this.html.original.parentElement.parentElement.classList.remove('hide')
		this.html.result.innerHTML = '';
		this.html.result.parentElement.parentElement.classList.add('hide');

		this._cacheObj = {};
	},

	_replaceResultContent: function(element){
		console.log('_replaceResultContent');
		this.html.result.parentElement.parentElement.classList.add('hide')
		this.html.result.innerHTML = '';
		if(element){
			this.html.result.appendChild(element);
			this.html.result.parentElement.parentElement.classList.remove('hide');
		}
	},

	_create: function(str, content, parentNode){
		console.log('_create');
		var element = document.createElement(str);

		if(content)
			element.innerHTML = content;

		if(parentNode)
			parentNode.appendChild(element);

		return element;
	},

	_getHistogramComponent: function(arr){
		console.log('_getHistogramComponent');
		var fragment = document.createDocumentFragment(),
			root = this._create('div', null, fragment),
			max = Math.ceil(this._getHistogramMax(arr) * 1.15);

		root.classList.add('histogram');
		this._create('span', arr.length - 1, root).classList.add('histogram-max-x');
		this._create('span', '0', root).classList.add('histogram-min-x');
		this._create('span', max, root).classList.add('histogram-max-y');
		this._create('span', '0', root).classList.add('histogram-min-y');

		arr.forEach(function(value, index){
			var point = this._create('div', null, root),
				percentageX = index / arr.length * 100,
				percentageY = value / max * 100;

			point.classList.add('histogram-point');
			point.style.left = percentageX.toFixed(4) + '%';
			point.style.top = (100 - percentageY).toFixed(4) + '%';
		}, this);

		return fragment;
	},

	_createCanvasFromImageData: function(imgData){
		console.log('_createCanvasFromImageData');
		var fragment = document.createDocumentFragment(),
			canvas = this._create('canvas', null, fragment);

		canvas.width = imgData.width;
		canvas.height = imgData.height;
		canvas.getContext('2d').putImageData(imgData, 0, 0);

		return fragment;
	},

	_cacheFunctionReturn: function(callback){
		console.log('_cacheFunctionReturn');
		var str = this._currentActionName;
		if(!this._cacheObj[str])
			this._cacheObj[str] = callback.call(this);

		return this._cacheObj[str];
	},

	// Métodos da aplicação

	execute: function(str, value){

		var methods = {
			display_info: 'displayInfo',
			
			greater_150_avg: 'paintAvgGreater150',
			greater_150_median: 'paintMedianGreater150',
			greater_150_modes: 'paintModesGreater150',
			greater_avg_white: 'paintWhiteGreaterAvg',
			lesser_median_0_and_greater_avg_255: 'paintBlackLesserMedianAndPaintWhiteGreaterAvg',
			
			translate: 'translate',
			increase_decrease: 'increaseAndDecrease',
			mirror: 'mirror',
			rotate_180_clockwise: 'rotate180Clockwise',
			
			grayscale: 'grayscale',

			extract_noises: 'extractNoises',
			edge_detection: 'applyKirschMask',

			extract_characteristics: 'extractCharacteristics'
		};

		this._currentActionName = str;

		setTimeout(function(){
			PixelEditor[methods[str]](value);
		}, 0);
	},

	displayInfo: function(){
		var imgData = this.getPreviewImageData(),
			obj = this.getImageDataInfo(imgData),
			halfWidth = imgData.width / 2,
			leftPixels = [],
			rightPixels = [];

		this.forEachPixel(imgData, function(pixel, _, y){
			var colorValue = this.getAverageOf(pixel);
			(y < halfWidth ? leftPixels : rightPixels).push(colorValue);
		});

		// Exibir resultados na interface
		var result = this.html.result,
			fragment = document.createDocumentFragment(),
			list = this._create('ul');

		list.classList.add('featured-box');
		fragment.appendChild(list);

		var refLi = this._create('li', '<strong>Histograma da Imagem:</strong>', list);
		refLi.appendChild(this._getHistogramComponent(obj.histogram));

		var leftPixelsAvg = this._average(leftPixels);
		this._create('li', '<strong>Média das tonalidades de cinza da metade esquerda da imagem:</strong><br>' + leftPixelsAvg.toFixed(2), list);

		var rightPixelsMedian = this._median(rightPixels);
		this._create('li', '<strong>Mediana das tonalidades de cinza da metade direita da imagem:</strong><br>' + rightPixelsMedian.toFixed(2), list);

		var modes = this._getModesFromHistogram(obj.histogramBottomMainDiagonal),
		tmpStr = '<strong>Moda das tonalidades de cinza da parte abaixo da diagonal principal da imagem:</strong><br>' + modes.join(', ');
		tmpStr += ' (' + obj.histogramBottomMainDiagonal[modes[0]] + ' aparições)';
		this._create('li', tmpStr, list);

		var variance = this._variance(obj.allPixels);
		this._create('li', '<strong>Variância das tonalidades de cinza de toda a imagem:</strong><br>' + variance.toFixed(2), list);

		//result.innerHTML = '';
		//result.appendChild(fragment);
		this._replaceResultContent(fragment);
	},

	paintAvgGreater150: function(){
		var imgData = this.getPreviewImageData(),
			obj = this.getImageDataInfo(imgData),
			newImgData = this.previewContext.createImageData(imgData),
			halfWidth = imgData.width / 2,
			leftPixels = [],
			rightPixels = [];

		this.forEachPixel(imgData, function(pixel, _, y){
			var colorValue = this.getAverageOf(pixel);
			(y < halfWidth ? leftPixels : rightPixels).push(colorValue);
		});

		var avg = this._average(leftPixels);
		avg = avg.toFixed(0);
		var avgPixel = [avg, avg, avg, 255];


		this.forEachPixel(imgData, function(pixel, _, __, index){
			var colorValue = this.getAverageOf(pixel),
				newPixel = colorValue >= 150 ? avgPixel : pixel;

			this.setPixel(newImgData, index, newPixel);
		});

		var canvas = this._createCanvasFromImageData(newImgData);
		this._replaceResultContent(canvas);
	},

	paintMedianGreater150: function(){
		var imgData = this.getPreviewImageData(),
			obj = this.getImageDataInfo(imgData),
			newImgData = this.previewContext.createImageData(imgData),
			halfWidth = imgData.width / 2,
			leftPixels = [],
			rightPixels = [];

		this.forEachPixel(imgData, function(pixel, _, y){
			var colorValue = this.getAverageOf(pixel);
			(y < halfWidth ? leftPixels : rightPixels).push(colorValue);
		});

		var median = this._median(rightPixels);
		median = median.toFixed(0);
		var medianPixel = [median, median, median, 255];

		this.forEachPixel(imgData, function(pixel, _, __, index){
			var colorValue = this.getAverageOf(pixel),
				newPixel = colorValue >= 150 ? medianPixel : pixel;

			this.setPixel(newImgData, index, newPixel);
		});

		var canvas = this._createCanvasFromImageData(newImgData);
		this._replaceResultContent(canvas);
	},

	paintModesGreater150: function(){
		var imgData = this.getPreviewImageData(),
			obj = this.getImageDataInfo(imgData),
			newImgData = this.previewContext.createImageData(imgData),
			halfWidth = imgData.width / 2,
			leftPixels = [],
			rightPixels = [];

		this.forEachPixel(imgData, function(pixel, _, y){
			var colorValue = this.getAverageOf(pixel);
			(y < halfWidth ? leftPixels : rightPixels).push(colorValue);
		});

		var modes = this._getModesFromHistogram(obj.histogramBottomMainDiagonal);
		var mode = modes[0];
		var modePixel = [mode, mode, mode, 255];

		this.forEachPixel(imgData, function(pixel, _, __, index){
			var colorValue = this.getAverageOf(pixel),
				newPixel = colorValue >= 150 ? modePixel : pixel;

			this.setPixel(newImgData, index, newPixel);
		});

		var canvas = this._createCanvasFromImageData(newImgData);
		this._replaceResultContent(canvas);
	},

	paintWhiteGreaterAvg: function(){
		var imgData = this.getPreviewImageData(),
			obj = this.getImageDataInfo(imgData),
			avg = this._average(obj.allPixels),
			newImgData = this.previewContext.createImageData(imgData);

		this.forEachPixel(imgData, function(pixel, _, __, index){
			var colorValue = this.getAverageOf(pixel),
				newPixel = colorValue > avg ? this.WHITE_PIXEL : pixel;

			this.setPixel(newImgData, index, newPixel);
		});

		var canvas = this._createCanvasFromImageData(newImgData);
		this._replaceResultContent(canvas);
	},

	paintBlackLesserMedianAndPaintWhiteGreaterAvg: function(){
		var imgData = this.getPreviewImageData(),
			obj = this.getImageDataInfo(imgData),
			avg = this._average(obj.allPixels),
			median = this._median(obj.allPixels),
			newImgData = this.previewContext.createImageData(imgData);

		this.forEachPixel(imgData, function(pixel, _, __, index){
			var colorValue = this.getAverageOf(pixel);
			var	newPixel = pixel;
			if(colorValue < median){
				newPixel = this.BLACK_PIXEL;
			}else if(colorValue > avg){
				newPixel = this.WHITE_PIXEL;
			}

			this.setPixel(newImgData, index, newPixel);
		});

		var canvas = this._createCanvasFromImageData(newImgData);
		this._replaceResultContent(canvas);
	},

	translate: function(){
		var size = parseInt(document.getElementById('translate_size').value);
		var direction = document.getElementById('translate_direction').value;
		
		var sizeVertical = 0;
		var sizeHorizontal = 0;
		var isHorizontal = direction === "H";
		
		if(isHorizontal){
		 	sizeHorizontal = size;
		}else{
			sizeVertical = size;
		} 

		var	imgData = this.getPreviewImageData();
		var newImgData = this.previewContext.createImageData(imgData.width + sizeHorizontal, imgData.height + sizeVertical);

		this.forEachPixelRealocate(imgData, newImgData, function(x, y){
			return {
				x: x + sizeHorizontal,
				y: y + sizeVertical
			};
		});

		var canvas = this._createCanvasFromImageData(newImgData);
		this._replaceResultContent(canvas);

	},

	increaseAndDecrease: function(){
		var percentage = parseInt(document.getElementById('increase_decrease_percentage').value);
		var type = document.getElementById('increase_decrease_type').value;
		var isIncrease = type === 'I';
		
		if(isIncrease){
			percentage = 1 + (percentage / 100);
		}else{
			percentage = 1 - (percentage / 100);
		}

		var imgData = this.getPreviewImageData(),
			newImgData = this._resizedImageData(imgData, percentage),
			canvas = this._createCanvasFromImageData(newImgData);
		this._replaceResultContent(canvas);
	},

	_resizedImageData: function(imgData, num){
		var newImgData = this.previewContext.createImageData(imgData.width * num, imgData.height * num),
			countNum = Math.ceil(num),
			powCountNum = Math.pow(countNum, 2);

		this.forEachPixel(imgData, function(pixel, x, y){
			var localCountNum = countNum, len = powCountNum; // Replicate variables in this scope
			for(var x = Math.floor(num * x), y = Math.floor(num * y), counter = 0; counter < len; counter++)
				this.setPixelAt(newImgData, x + (counter % localCountNum), y + Math.floor(counter / localCountNum), pixel);
		});

		return newImgData;
	},

	forEachPixelRealocate: function(imgDataSrc, imgDataDst, callback){
		var data = imgDataSrc.data,
			width = imgDataSrc.width,
			height = imgDataSrc.height;

		for(var y = 0, offset = 0; y < height; y++){
			for(var x = 0; x < width; x++, offset += this.PIXEL_LENGTH){
				var obj = callback.call(this, x, y);
				if(obj)
					this.setPixelAt(imgDataDst, obj.x, obj.y, data.subarray(offset, offset + this.PIXEL_LENGTH));
			}
		}
	},

	mirror: function(){
		var imgData = this.getPreviewImageData(),
			newImgData = this.previewContext.createImageData(imgData),
			width = imgData.width - 1;

		this.forEachPixelRealocate(imgData, newImgData, function(x, y){
			return {
				x: width - x,
				y: y
			};
		});

		var canvas = this._createCanvasFromImageData(newImgData);
		this._replaceResultContent(canvas);
	},

	rotate180Clockwise: function(){
		var imgData = this.getPreviewImageData(),
			newImgData = this._rotatedImageData(imgData, 180),
			canvas = this._createCanvasFromImageData(newImgData);
		this._replaceResultContent(canvas);
	},

	_rotatedImageData: function(imgData, degree){	
		var radians = degree / 180 * Math.PI,
			sin = Math.sin(radians),
			cos = Math.cos(radians),
			newWidth = imgData.width * Math.abs(cos) + imgData.height * Math.abs(sin),
			newHeight = imgData.width * Math.abs(sin) + imgData.height * Math.abs(cos),
			newImgData = this.previewContext.createImageData(newWidth, newHeight),
			centerX = Math.floor(imgData.width / 2),
			centerY = Math.floor(imgData.height / 2),
			newCenterX = Math.floor(newImgData.width / 2),
			newCenterY = Math.floor(newImgData.height / 2);

		this.forEachPixelRealocate(imgData, newImgData, function(x, y){
			var diffX = x - centerX,
				diffY = y - centerY;

			x = newCenterX + diffX * cos - diffY * sin;
			y = newCenterY + diffX * sin + diffY * cos;

			if(!this.isLocatedInside(newImgData, x, y))
				return null;

			return {
				x: Math.round(x),
				y: Math.round(y)
			};
		});

		return newImgData;
	},

	isLocatedInside: function(imgData, x, y){
		for(var props = ['width', 'height'], values = [x, y], len = props.length; len--;){
			var half = Math.floor(imgData[props[len]] / 2);
			if(Math.abs(values[len] - half) > half)
				return false;
		}

		return true;
	},

	grayscale: function(){
		var imgData = this.getPreviewImageData(),
			newImgData = this._getGrayscaleImageData(imgData),
			canvas = this._createCanvasFromImageData(newImgData);
		this._replaceResultContent(canvas);
	},

	_getGrayscaleImageData: function(imgData){
		var newImgData = this.previewContext.createImageData(imgData);

		this.forEachPixel(imgData, function(pixel, _, __, index){
			var colorValue = this.getGrayscaleOf(pixel);
			for(var len = 3; len--;)
				pixel[len] = colorValue;
			this.setPixel(newImgData, index, pixel);
		});

		return newImgData;
	},

	getGrayscaleOf: function(pixel){
		return Math.round(
			pixel[0] * this.RED_ADDITIONAL + 
			pixel[1] * this.GREEN_ADDITIONAL + 
			pixel[2] * this.BLUE_ADDITIONAL
			);
	},

	extractNoises: function(){
		var imgData = this.getPreviewImageData();
		imgData = this._applyGaussianFilter(imgData);
		var canvas = this._createCanvasFromImageData(imgData);
		this._replaceResultContent(canvas);
	},

	applyKirschMask: function(){
		var threshold_value = parseInt(document.getElementById('edge_detection_thresholding').value);
		console.log('===='+threshold_value);
		var imgData = this._cacheFunctionReturn(function(){

			var imgData = this.getPreviewImageData(),
				kernel = [
					[5, -3, -3],
					[5, 0, -3],
					[5, -3, -3]
				],
				kernels = [],
				zeroFilledArr = [],
				kernelLen = kernel.length,
				kernelOrder = Math.pow(kernelLen, 2),
				middleIndex = Math.floor(kernelOrder / 2);

			// Gerando os kernels necessários para a convolução
			for(var len = 8; len--;){
				var kernelCopy = JSON.parse(JSON.stringify(kernel));

				for(var len1 = kernelOrder; len1--;){
					if(len1 == middleIndex)
						continue;

					var distanceToMiddle = middleIndex - len1,
						addValue = Math.abs(distanceToMiddle) > 2 ? 1 : kernelLen,
						factor = (addValue == 1 && distanceToMiddle > 0) || (addValue == kernelLen && len1 % kernelLen > kernelLen / 2) ? 1 : -1,
						newIndex = (len1 + addValue * factor) % kernelOrder;

					kernelCopy[Math.floor(newIndex / kernelLen)][newIndex % kernelLen] = kernel[Math.floor(len1 / kernelLen)][len1 % kernelLen];
				}

				kernel = kernelCopy;
				kernels.push(kernel);
				zeroFilledArr.push(0);
			}

			if(!this._isGrayscale(imgData))
				imgData = this._getGrayscaleImageData(imgData);
			imgData = this._applyMedianFilter(imgData);

			imgData = this._applyConvolution(imgData, kernelLen, function(matrix){
				var localKernels = kernels,
					all = zeroFilledArr.slice();

				for(var x = 0, len = matrix.length; x < len; x++){
					for(var y = 0; y < len; y++){
						var pixelValue = matrix[x][y][0];
						for(var z = localKernels.length; z--;)
							all[z] += pixelValue * localKernels[z][x][y];
					}
				}

				var value = Math.max.apply(Math, all);
				return [value, value, value, 255];
			});

			return imgData;

		});
		
		imgData = this._applyCustomThresholding(imgData, threshold_value);

		var canvas = this._createCanvasFromImageData(imgData);
		this._replaceResultContent(canvas);
	},

	extractCharacteristics: function(){
		var imgData = this.getPreviewImageData();
		if(!this._isGrayscale(imgData)){
			imgData = this._getGrayscaleImageData(imgData);
		}

		var objectData = this._getObjectData(imgData, 20);
		var list = this._getObjectDisplayComponent(objectData);

		this._replaceResultContent(list);
	},

	_getObjectData: function(imageData, colorInterval){
		var data = imageData.data,
			colorDistance = colorInterval / 2,
			returnData = {
				width: imageData.width,
				height: imageData.height,
				simpleMatrix: this._toSimpleMatrix(imageData), // Gera uma matriz de valores simples a partir do objeto ImageData

				// Gera a matriz de referências do mesmo tamanho da imagem,
				// preenchendo todos os seus pontos com referências nulas
				referenceMatrix: this._createMatrixWithSize(imageData.width, imageData.height),

				objects: []
			};

		for(var y = 0; y < returnData.height; y++){
			for(var x = 0; x < returnData.width; x++){
				// Se encontrar um ponto de referência nula,
				// inicia o algoritmo flood fill a partir deste, gerando um novo objeto
				if(returnData.referenceMatrix[y][x])
					continue;

				var object = {
					limits: {
						xAxis: [x, x],
						yAxis: [y, y]
					},
					color: returnData.simpleMatrix[y][x],
					pixelCount: 0
				};
				returnData.objects.push(object);

				// Para evitar recursão (que seria excessiva em imagens maiores), cria um array temporário abaixo e
				// o utiliza para armazenar todos os pixels encontrados a partir da cor do objeto.
				// Através de subsequentes iterações, todos os pixels da região são encontrados
				var currentPixels, foundPixels = [[x, y]];

				while(foundPixels.length){
					currentPixels = foundPixels;
					foundPixels = [];

					for(var len = currentPixels.length; len--;){
						var tmp = currentPixels[len];
						this._floodFillMatrix(returnData, object, tmp[0], tmp[1], foundPixels, colorDistance);
					}
				}
			}
		}

		// Ordena os objetos encontrados de maneira decrescente, de acordo com a quantidade de pixels
		returnData.objects.sort(function(a, b){
			return b.pixelCount - a.pixelCount;
		});

		for(var len = returnData.objects.length; len--;)
			this._prepareObject(returnData, returnData.objects[len], .2);

		return returnData;
	},

	_toSimpleMatrix: function(imageData){
		var matrix = [],
			data = imageData.data,
			width = imageData.width,
			height = imageData.height;

		for(var x = 0, offset = 0; x < height; x++){
			matrix[x] = new Uint8ClampedArray(width);
			for(var y = 0; y < width; y++, offset += this.PIXEL_LENGTH)
				matrix[x][y] = data[offset];
		}

		return matrix;
	},

	_floodFillMatrix: function(data, object, x, y, pixels, colorDiff){
		if(data.referenceMatrix[y][x])
			return;

		data.referenceMatrix[y][x] = object;
		object.pixelCount++;

		// Atualiza os limites da imagem
		if(x < object.limits.xAxis[0])
			object.limits.xAxis[0] = x;
		else if(x > object.limits.xAxis[1])
			object.limits.xAxis[1] = x;
		if(y < object.limits.yAxis[0])
			object.limits.yAxis[0] = y;
		else if(y > object.limits.yAxis[1])
			object.limits.yAxis[1] = y;

		for(var num = 4, half = num / 2, len = num; len--;){
			var factor = len >= half ? 1 : -1,
				modulus = len % 2,
				newX = x + modulus * factor,
				newY = y + (1 - modulus) * factor;

			if(
				newX < data.width &&
				newY < data.height &&
				Math.min(newX, newY) >= 0 &&
				Math.abs(data.simpleMatrix[newY][newX] - object.color) <= colorDiff
			)
				pixels.push([newX, newY]);
		}
	},

	_prepareObject: function(data, object, alpha){
		object.x = object.limits.xAxis[0];
		object.y = object.limits.yAxis[0];
		object.width = object.limits.xAxis[1] - object.limits.xAxis[0] + 1;
		object.height = object.limits.yAxis[1] - object.limits.yAxis[0] + 1;

		// Obtem uma coleção de coordenadas que contituem o perímetro da imagem
		object.perimeter = this._getPerimeterArray(data, object);

		// Prepara a imagem para ser exibida na interface
		var imageData = new ImageData(object.width, object.height),
			maxValue = 255;

		if(alpha == null)
			alpha = 1;
		alpha *= maxValue;

		for(var y = 0, offset = 0; y < object.height; y++){
			var yAxis = object.y + y;

			for(var x = 0; x < object.width; x++, offset += this.PIXEL_LENGTH){
				var xAxis = object.x + x,
					belongsToObj = data.referenceMatrix[yAxis][xAxis] == object,
					color = data.simpleMatrix[yAxis][xAxis];

				for(var len = 3; len--;)
					imageData.data[offset + len] = color;

				imageData.data[offset + 3] = belongsToObj ? maxValue : alpha;
			}
		}

		// Verifica se o objeto apresenta um retângulo ou círculo
		if(this._isRectangle(data, object))
			object._isRectangle = true;
		else if(this._isCircle(data, object))
			object._isCircle = true;

		object.imageData = imageData;
	},

	_getPerimeterArray: function(data, object){
		for(var x = 0; x < object.width; x++){
			var xAxis = x + object.x;

			if(data.referenceMatrix[object.y][xAxis] == object){

				var list = [],
					first = [xAxis, object.y],
					next = [first],
					visitMatrix = this._createMatrixWithSize(data.width, data.height);

				visitMatrix[first[1]][first[0]] = true;

				for(var count = 0; count < next.length; count++){
					var coord = next[count];
					if(this._belongsToPerimeter(data, object, coord, next, visitMatrix))
						list.push(coord);
				}

				return list;

			}
		}
	},

	_belongsToPerimeter: function(data, object, coord, next, visitMatrix){
		//visitMatrix[coord[1]][coord[0]] = true;
		var foundNeighbors = [];

		for(var num = 4, half = num / 2, len = num; len--;){
			var factor = len >= half ? 1 : -1,
				modulus = len % 2,
				newCoord = [coord[0] + modulus * factor, coord[1] + (1 - modulus) * factor];

			if(
				newCoord[0] < data.width &&
				newCoord[1] < data.height &&
				Math.min(newCoord[0], newCoord[1]) >= 0 &&
				data.referenceMatrix[newCoord[1]][newCoord[0]] == object
			)
				foundNeighbors.push(newCoord);
		}

		var len = foundNeighbors.length;
		for(;len--;){
			var newCoord = foundNeighbors[len];
			if(!visitMatrix[newCoord[1]][newCoord[0]]){
				next.push(newCoord);
				visitMatrix[newCoord[1]][newCoord[0]] = true;
			}
		}

		return foundNeighbors.length < num;
	},

	_getObjectDisplayComponent: function(data){
		var fragment = document.createDocumentFragment();
		var title = this._create('strong', 'Objetos identificados na imagem', fragment);
		title.classList.add('title-object-list');

		var list = this._create('ul', null, fragment);
		list.classList.add('object-list');

		for(var x = 0; x < data.objects.length; x++){
			var object = data.objects[x],
				li = this._create('li', null, list),
				image = this._getImageFromDataObject(data, object, .2);

			li.appendChild(image);

			var infoElement = this._create('ul', null, li);
			infoElement.classList.add('info');
			this._create('li', '<strong>Largura:</strong> ' + object.width + 'px', infoElement);
			this._create('li', '<strong>Altura:</strong> ' + object.height + 'px', infoElement);
			this._create('li', '<strong>Área:</strong> ' + object.pixelCount + 'px', infoElement);

			if(object._isRectangle){
				this._create('li', '<strong>O objeto é um retângulo!</strong>', infoElement);
				this._create('li', '<strong>Perímetro:</strong> ' + object.perimeter.length + 'px', infoElement);
			}
			else if(object._isCircle){
				var perimeter = object.perimeter.length,
					circularity = Math.pow(perimeter, 2) / (4 * Math.PI * object.pixelCount);

				this._create('li', '<strong>O objeto é um círculo!</strong>', infoElement);
				this._create('li', '<strong>Perímetro:</strong> ' + perimeter + 'px', infoElement);
				var tmp =
				this._create('li', '<strong>Circularidade:</strong> ' + circularity.toFixed(2), infoElement);
			}
		}

		return fragment;
	},

	_getImageFromDataObject: function(data, object){
		// Gera elemento de imagem a partir do objeto ImageData
		var image = new Image(object.width, object.height),
			canvas = this._create('canvas');

		canvas.width = object.imageData.width;
		canvas.height = object.imageData.height;
		canvas.getContext('2d').putImageData(object.imageData, 0, 0);
		image.src = canvas.toDataURL();

		return image;
	},

	_applyCustomThresholding: function(imageData, threshold){
		var newImgData = this.previewContext.createImageData(imageData);

		this.forEachPixel(imageData, function(pixel, _, __, index){
			var newPixel = this[pixel[0] >= threshold ? 'WHITE_PIXEL' : 'BLACK_PIXEL'];
			this.setPixel(newImgData, index, newPixel);
		});

		return newImgData;
	},

	_applyMedianFilter: function(imgData){
		return this._applyConvolution(imgData, 3, function(matrix){
			var arr = [];
			for(var x = 0, len = matrix.length; x < len; x++){
				for(var y = 0; y < len; y++)
					arr[x * len + y] = matrix[x][y][0];
			}

			var median = this._median(arr);
			return [median, median, median, 255];
		});
	},

	_applyGaussianFilter: function(imgData){
		imgData = this._getGrayscaleImageData(imgData);
		return this._applyConvolution(imgData, 3, function(matrix){
			var multiple = 1/16;
			var kernel = [ 	
							[1, 2, 1],
							[2, 4, 2],
							[1, 2, 1] 
						];
			var newValue = 0;
			for(var x = 0, len = matrix.length; x < len; x++){
				
				for(var y = 0; y < len; y++){
					var pixelValue = matrix[x][y][0];
					var kernelValue = kernel[x][y];
					newValue += pixelValue * kernelValue;
				}
			}
			newValue = newValue * multiple;
			return [newValue, newValue, newValue, 255];
		});
	},

	_applyConvolution: function(imgData, order, callback){
		var newImgData = this.previewContext.createImageData(imgData),

			data = imgData.data,
			newData = new Uint8ClampedArray(data),
			width = imgData.width,
			height = imgData.height,
			halfOrder = Math.floor(order / 2),

			maxWidth = width - halfOrder,
			maxHeight = height - halfOrder;

		for(var y = 0, offset = 0, pixel; y < height; y++){
			for(var x = 0; x < width; x++, offset += this.PIXEL_LENGTH){

				// Se o pixel não estiver nas bordas, realiza a convolução
				if(x >= halfOrder && y >= halfOrder && x < maxWidth && y < maxHeight){
					var matrix = [];

					for(var x1 = 0; x1 < order; x1++){
						matrix[x1] = [];

						for(var y1 = 0; y1 < order; y1++){
							var currentOffset = ((y + y1 - halfOrder) * width + (x + x1 - halfOrder)) * this.PIXEL_LENGTH;
							matrix[x1][y1] = data.subarray(currentOffset, currentOffset + this.PIXEL_LENGTH);
						}
					}

					pixel = callback.call(this, matrix);
					for(var len = pixel.length; len--;)
						newData[offset + len] = pixel[len];
				}
			}
		}

		this.setPixel(newImgData, 0, newData);
		return newImgData;
	},


	// Métodos de interação com objetos ImageData

	getPreviewImageData: function(){
		console.log('getPreviewImageData');
		if(!this.loadedImage)
			throw "No image was uploaded!";

		var prev = this.html.preview;
		return this.previewContext.getImageData(0, 0, prev.width, prev.height);
	},

	getImageDataInfo: function(imgData){
		console.log('getImageDataInfo');
		var obj = {
			histogram: new Array(256),
			histogramBottomMainDiagonal: new Array(256),
			allPixels: []
		};

		for(var len = 256; len--;){
			obj.histogram[len] = 0;
			obj.histogramBottomMainDiagonal[len] = 0;
		}

		// Itera sobre todos os pixels, realizando as verificações necessárias
		this.forEachPixel(imgData, function(pixel, x, y){
			var colorValue = this.getAverageOf(pixel);
			obj.histogram[colorValue]++;
			obj.allPixels.push(colorValue);
			if(x >= y) obj.histogramBottomMainDiagonal[colorValue]++;
		});

		return obj;
	},

	forEachPixel: function(imageData, callback){
		console.log('forEachPixel');
		var data = imageData.data,
			width = imageData.width,
			height = imageData.height;

		for(var offset = 0, y = 0; y < height; y++){
			for(var x = 0; x < width; x++, offset += this.PIXEL_LENGTH)
				callback.call(this, data.subarray(offset, offset + this.PIXEL_LENGTH), x, y, offset);
		}
	},

	getAverageOf: function(pixel){
		return Math.round((pixel[0] + pixel[1] + pixel[2]) / 3);
	},

	setPixel: function(imgData, offset, pixel){
		// Replaces the pixel at the right index of the ImageData object
		for(var data = imgData.data, len = pixel.length; len--;)
			data[offset + len] = pixel[len];
	},

	setPixelAt: function(imgData, x, y, pixel){
		this.setPixel(imgData, pixel.length * (y * imgData.width + x), pixel);
	},

	_isGrayscale: function(imageData){
		for(var data = imageData.data, len = data.length, offset = 0; offset < len; offset += this.PIXEL_LENGTH){
			if(data[offset] != data[offset + 1] || data[offset] != data[offset + 2])
				return false;
		}

		return true;
	},

	_createMatrixWithSize: function(width, height){
		console.log('_createMatrixWithSize');
		var matrix = new Array(height);
		for(var x = 0; x < height; x++)
			matrix[x] = new Array(width);
		return matrix;
	},
	
	_isRectangle: function(data, object){
		return object.width > object.height && object.width * object.height == object.pixelCount;
	},

	_isCircle: function(data, object){
		//if(object.width != object.height)
			//return false;

		var center = [Math.floor(object.width) / 2 + object.x, Math.floor(object.height) / 2 + object.y],
			distances = [],
			radius = object.width / 2;

		for(var x = 0; x < object.perimeter.length; x++){
			var coord = object.perimeter[x],
				distance = Math.sqrt(Math.pow(coord[0] - center[0], 2) + Math.pow(coord[1] - center[1], 2));

			if(Math.abs(distance - radius) > 2)
				return false;
		}

		return true;
	},

	// Métodos com operações matemáticas

	_average: function(arr){
		function adder(a, b){
			return a + b;
		};
		return arr.length ? arr.reduce(adder) / arr.length : 0;
	},

	_median: function(arr){
		arr = arr.slice().sort();
		var half = Math.floor(arr.length / 2);
		return arr.length % 2 ? arr[half] : (arr[half] + arr[half - 1]) / 2;
	},

	_variance: function(arr){
		function varianceAdder(a, b){
			return a + Math.pow(b - avg, 2);
		}
		var avg = this._average(arr);
		return arr.length > 1 ? arr.reduce(varianceAdder) / (arr.length - 1): 0;
	},

	_getHistogramMax: function(arr){
		console.log('_getHistogramMax');
		return Math.max.apply(Math, arr);
	},

	_getModesFromHistogram: function(arr){
		console.log('_getModesFromHistogram');
		var max = this._getHistogramMax(arr),
			indexes = arr.reduce(function(arr, value, index){
				if(value == max)
					arr.push(index);

				return arr;
			}, []);

		return indexes;
	},

};