exports = module.exports = position;

var VIEWPORT = { _id: 'VIEWPORT', nodeType: 1 },
    $ = require('jquery'),
    isPinFixed = false,
    ua = (window.navigator.userAgent || '').toLowerCase(),
    isIE6 = ua.indexOf('msie 6') !== -1;

//将目标元素相对于基准元素进行定位
//这是Position的基础方法，接收两个参数，分别描述了目标元素和基准元素的定位点
position.pin = function (pinObject, baseObject) {

	//将两个参数转换成标准定位对象 {element: a, x:0, y:0}
	pinObject = normalize(pinObject);
	baseObject = normalize(baseObject);

	//设定目标元素的position为绝对定位
	//若元素的初始position不为absolute, 会影响元素的display、宽高等属性
	var pinElement = $(pinObject.element);
	if (pinElement.css('position') !== 'fixed' || isIE6) {
		pinElement.css('position', 'absolute');
		isPinFixed = false;
	} else {
		//定位fixed元素的标志位，下面有特殊处理
		isPinFixed = true;
	}

	//将位置属性归一化为数值
	//注：必须放在上面这句`css('position', 'absolute')`之后
	//否则获取的宽度有可能不对
	posConverter(pinObject);
	posConverter(baseObject);

	var parentOffset = getParentOffset(pinElement);
	var baseOffset = baseObject.offset();

	//计算模板元素的位置
	var top = baseOffset.top + baseObject.y -
	          pinObject.y - parentOffset.top;
	var left = baseOffset.left + baseObject.x -
	          pinObject.x - parentOffset.left;
	//定位目标元素
	pinElement.css({left: left, top: top});
};

//将目标元素相对于基准元素进行居中定位
//接受两个参数，分别为目标元素和定位的基准元素，都是DOM节点类型

position.center = function(pinElement, baseElement) {
	position.pin({
		element: pinElement,
		x: '50%',
		y: '50%'
	}, {
		element: baseElement,
		x: '50%',
		y: '50%'
	});
};

//这是当前可视区域的伪DOm节点
//需要相对于当前可视区域定位时，可传入此参数作为element参数

position.VIEWPORT = VIEWPORT;

//Helpers
//-----

//将参数包装成标准的定位对象，形似{element: a, x:0, y:0}
function normalize(posObject) {
	posObject = toElement(posObject) || {};

	if (posObject.nodeType) {
		posObject = {element: posObject};
	}

	var element = toElement(posObject.element) || VIEWPORT;
	if (element.nodeType !== 1) {
		throw new Error('posObject.element is invalid');
	}

	var result = {
		element: element,
		x: posObject.x || 0,
		y: posObject.y || 0
	};

	//config的深度克隆会替换掉position.VIEWPORT，导致直接比较为false
	var isVIEWPORT = (element === VIEWPORT || element._id === 'VIEWPORT');

	//归一化offset
	result.offset = function () {
		//若定位fixed元素，则父元素的offset没有意义
		if (isPinFixed) {
			return {
				left: 0,
				top: 0
			};
		} else if (isVIEWPORT) {
			return {
				left: $(document).scrollLeft(),
				top: $(document).scrollTop()
			};
		} else {
			return getOffset($(element)[0]);
		}
	};

	//归一化size，含padding和border
	result.size = function () {
		var el = isVIEWPORT ? $(window) : $(element);
		return {
			width: el.outerWidth(),
			height: el.outerHeight()
		};
	};

	return result;
}

//对x，y两个参数为left|center|right|%|px时的处理，全部处理为纯数字
function posConverter(pinObject) {
	pinObject.x = xyConverter(pinObject.x, pinObject, 'width');
	pinObject.y = xyConverter(pinObject.y, pinObject, 'height');
}

//处理x,y值，都转化为数字
function xyConverter(x, pinObject, type) {
	x = x + '';
	//处理px
	x = x.replace(/px/gi, '');

	//处理alias
	if (/\D/.test(x)) {
		x = x.replace(/(?:top|left)/gi, '0%')
		     .replace(/center/gi, '50%')
		     .replace(/(?:bottom|right)/gi, '100%');
	}

	//将百分比转为像素值
	if (x.indexOf('%') !== -1) {
		//支持小数
		x = x.replace(/(\d+(?:\.\d+)?)%/gi, function(m, d) {
			return pinObject.size()[type] * 
		});
	}
}