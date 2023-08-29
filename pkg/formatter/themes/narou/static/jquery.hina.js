// jQuery用プラグイン集

/**
 * Polyfill
 * UTCでの1970年1月1日0時0分0秒から現在までの経過時間をミリ秒単位で取得
 *
 * @return number
 */
if(!Date.now){
	Date.now = function(){
		return new Date().getTime();
	};
}

/**
 * クッキーを制御
 *
 * @requires jQuery
 * @author 株式会社ヒナプロジェクト
 * @version 1.0.1
 */
(function($){
$.extend({cookie:function(key, value, settings){

	// 全てのクッキーをオブジェクトで取得
	var data = {};
	if(document.cookie){
		$.each(document.cookie.split('; '), function(i, v){
			var kvPair = v.split('=');
			data[decodeURIComponent(kvPair[0])] = decodeURIComponent(kvPair[1]);
		});
	}

	// キーの指定が無ければ全て取得
	if(typeof key == 'undefined'){return data;}

	// 値の指定が無ければ取得
	if(typeof value == 'undefined'){
		value = (key in data) ? data[key] : null;
		return value;
	}

	// パラメータを初期化
	var params = [];
	if(!settings){settings = {};}

	// 古い値を取得
	var oldValue = (key in data) ? data[key] : null;

	// キーと値を追加
	params.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));

	// パスが指定されている場合
	if('path' in settings){params.push('path=' + settings['path']);}

	// ドメインが指定されている場合
	if('domain' in settings){params.push('domain=' + settings['domain']);}

	// 無効な値が指定されていれば削除処理
	if((value === false) || (value === null) || ((typeof value == 'string') && !value.length)){
		settings['max-age'] = settings['expires'] = 0;
	}

	// 寿命が指定されている場合
	if('max-age' in settings){
		params.push('max-age=' + settings['max-age']);
		// 有効期限を寿命に沿った値に変更
		settings['expires'] = new Date(Date.now() + (settings['max-age'] * 1000)).toUTCString();
	}

	// 有効期限が指定されている場合
	if('expires' in settings){
		if(typeof settings['expires'] == 'number'){
			params.push('expires=' + new Date(settings['expires']).toUTCString());
		}else{
			params.push('expires=' + settings['expires']);
		}
	}

	// セキュア属性が指定されている場合
	if('secure' in settings){params.push('secure');}

	// バージョンが指定されている場合
	if('version' in settings){params.push('version=' + encodeURIComponent(settings['version']));}

	// コメントが指定されている場合
	if('comment' in settings){params.push('comment=' + encodeURIComponent(settings['comment']));}

	// クッキーを書き込み
	document.cookie = params.join('; ');

	// 古い値を返す
	return oldValue;

}});
})(jQuery);

/**
 * ウェブストレージを制御
 *
 * @requires jQuery
 * @author 株式会社ヒナプロジェクト
 * @version 1.0.1
 */
(function($){
$.extend({storage:function(key, value, settings){

	// パラメータを初期化
	if(!settings){settings = {};}
	if(!('type' in settings)){settings['type'] = 'local';}

	// ストレージの種類を取得
	var storage = (settings['type'] == 'session') ? sessionStorage : localStorage;

	// キーの指定が無ければ全てのデータをオブジェクトで取得
	if(typeof key == 'undefined'){
		var data = {}, index = 0;
		while((key = storage.key(index)) !== null){
			value = storage.getItem(key);
			try{
				var parseValue = JSON.parse(value);
				data[key] = parseValue;
			}catch(exception){
				data[key] = value;
			}
			++index;
		}
		return data;
	}

	// 値の指定が無ければ読み込み
	if(typeof value == 'undefined'){
		value = storage.getItem(key);
		if(value !== null){
			try{
				var parseValue = JSON.parse(value);
				value = parseValue;
			}catch(exception){
			}
		}
		return value;
	}

	// 古い値を取得
	var oldValue = storage.getItem(key);
	if(oldValue !== null){
		try{
			var parseValue = JSON.parse(oldValue);
			oldValue = parseValue;
		}catch(exception){
		}
	}

	// 無効な値が指定されていれば削除処理
	if((value === false) || (value === null) || !value.length){
		storage.removeItem(key);
		return oldValue;
	}

	// 値をJSON文字列にシリアライズ
	var jsonValue = JSON.stringify(value);

	// 値を保存
	storage.setItem(key, value);

	return oldValue;

}});
})(jQuery);

/**
 * スマートフォンかどうか判別
 *
 * @requires jQuery
 * @author 株式会社ヒナプロジェクト
 * @version 1.0.1
 */
(function($){
$.extend({isSmartPhone:function(){

	if(navigator.userAgent.match(/i(Phone|Pod)/)){
		// iPhoneまたはiPodの場合
		return true;
	}else if(navigator.userAgent.match(/Android/) && navigator.userAgent.match(/Mobile/)){
		// Androidかつモバイルの場合
		return true;
	}else if(navigator.userAgent.match(/Windows Phone/)){
		// Windows Phoneの場合
		return true;
	}else if(navigator.userAgent.match(/BlackBerry/)){
		// BlackBerryの場合
		return true;
	}

	return false;

}});
})(jQuery);

/**
 * タブレットかどうか判別
 *
 * @requires jQuery
 * @author 株式会社ヒナプロジェクト
 * @version 1.0.1
 */
(function($){
$.extend({isTablet:function(){

	var result = false;

	if(navigator.userAgent.match(/iPad/)){
		// iPadの場合
		return true;
	}else if(navigator.userAgent.match(/Android/) && !navigator.userAgent.match(/Mobile/)){
		// Androidかつモバイルではない場合
		return true;
	}

	return false;

}});
})(jQuery);

/**
 * Android端末かどうか判別
 *
 * @requires jQuery
 * @author 株式会社ヒナプロジェクト
 * @version 1.0.1
 */
(function($){
$.extend({isAndroid:function(){

	return navigator.userAgent.match(/Android/) ? true : false;

}});
})(jQuery);

/**
 * Apple端末かどうか判別
 *
 * @requires jQuery
 * @author 株式会社ヒナプロジェクト
 * @version 1.0.1
 */
(function($){
$.extend({isApple:function(){

	return navigator.userAgent.match(/i(Phone|Pod|Pad)/) ? true : false;

}});
})(jQuery);

/**
 * タッチ可能端末かどうか判別
 *
 * @requires jQuery
 * @author 株式会社ヒナプロジェクト
 * @version 1.0.0
 */
(function($){
$.extend({isTouch:function(){

	return ('TouchEvent' in window) ? true : false;

}});
})(jQuery);

/**
 * IEブラウザかどうか判別
 *
 * @requires jQuery
 * @author 株式会社ヒナプロジェクト
 * @version 1.0.0
 */
(function($){
$.extend({isIE:function(){

	return navigator.userAgent.match(/(MSIE|Trident)/) ? true : false;

}});
})(jQuery);

/**
 * Edgeブラウザかどうか判別
 *
 * @requires jQuery
 * @author 株式会社ヒナプロジェクト
 * @version 1.0.1
 */
(function($){
$.extend({isEdge:function(){

	return navigator.userAgent.match(/Edge/) ? true : false;

}});
})(jQuery);

/**
 * Chromeブラウザかどうか判別
 *
 * @requires jQuery
 * @author 株式会社ヒナプロジェクト
 * @version 1.0.0
 */
(function($){
$.extend({isChrome:function(){

	return navigator.userAgent.match(/(Chrome|CriOS)/) ? true : false;

}});
})(jQuery);

/**
 * Chromiumブラウザかどうか判別
 *
 * @requires jQuery
 * @author 株式会社ヒナプロジェクト
 * @version 1.0.0
 */
(function($){
$.extend({isChromium:function(){

	return navigator.userAgent.match(/Chromium/) ? true : false;

}});
})(jQuery);

/**
 * Firefoxブラウザかどうか判別
 *
 * @requires jQuery
 * @author 株式会社ヒナプロジェクト
 * @version 1.0.0
 */
(function($){
$.extend({isFirefox:function(){

	return navigator.userAgent.match(/(Firefox|FxiOS)/) ? true : false;

}});
})(jQuery);

/**
 * Safariブラウザかどうか判別
 *
 * @requires jQuery
 * @author 株式会社ヒナプロジェクト
 * @version 1.0.1
 */
(function($){
$.extend({isSafari:function(){

	return (!$.isChrome() && navigator.userAgent.match(/Safari/)) ? true : false;

}});
})(jQuery);

/**
 * Operaブラウザかどうか判別
 *
 * @requires jQuery
 * @author 株式会社ヒナプロジェクト
 * @version 1.0.0
 */
(function($){
$.extend({isOpera:function(){

	return navigator.userAgent.match(/Opera/) ? true : false;

}});
})(jQuery);

/**
 * プライベートブラウズかどうか判別
 *
 * @requires jQuery
 * @author 株式会社ヒナプロジェクト
 * @version 1.0.1
 */
(function($){
$.extend({isPrivateBrowse:function(){

	if(!window.localStorage){return false;}

	var key = 'isPrivateBrowse-' + Math.random();
	if($.isSafari()){
		try{
			localStorage.setItem(key, true);
			localStorage.removeItem(key);
		}catch(e){
			if(e.code && (e.code == 22)) return true;
		}
	}

	return false;

}});
})(jQuery);

/**
 * 特殊文字をHTMLエンティティに変換
 *
 * @requires jQuery
 * @author 株式会社ヒナプロジェクト
 * @version 1.0.0
 */
(function($){
$.extend({htmlspecialchars:function(string, options){

	if((typeof string == 'undefined') || (string === null)){return string;}
	if(typeof string != 'string'){string = new String(string);}

	// デフォルト引数を取得
	var settings = $.extend({compat:true, quotes:false, noquotes:false}, options);

	// 変換
	string = string.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	if(settings.compat){
		string = string.replace(/\"/g, '&quot;');
	}else if(settings.quotes){
		string = string.replace(/\'/g, '&apos;').replace(/\"/g, '&quot;');
	}else if(settings.noquotes){
	}

	return string;

}});
})(jQuery);

/**
 * 文字列に含まれる全角文字の連想配列を取得
 *
 * @requires jQuery
 * @author 株式会社ヒナプロジェクト
 * @version 1.0.0
 */
(function($){
$.extend({findFullWidthCharacter:function(string){

	var result = {}, charCode;

	for(var i = 0; i < string.length; ++i){
		charCode = string.charCodeAt(i);
		if(!isNaN(charCode) && (charCode > 255)){result[i] = string.charAt(i);}
	}

	return Object.keys(result).length ? result : null;

}});
})(jQuery);

/**
 * 文字列に含まれる半角文字の連想配列を取得
 *
 * @requires jQuery
 * @author 株式会社ヒナプロジェクト
 * @version 1.0.0
 */
(function($){
$.extend({findHalfWidthCharacter:function(string){

	var result = {}, charCode;

	for(var i = 0; i < string.length; ++i){
		charCode = string.charCodeAt(i);
		if(!isNaN(charCode) && (charCode <= 255)){result[i] = string.charAt(i);}
	}

	return Object.keys(result).length ? result : null;

}});
})(jQuery);

/**
 * 文字列に含まれるサロゲートペアの配列を取得
 *
 * @requires jQuery
 * @author 株式会社ヒナプロジェクト
 * @version 1.0.0
 */
(function($){
$.extend({findSurrogatePair:function(string){

	return string.match(/([\uD800-\uDBFF][\uDC00-\uDFFF])/g);

}});
})(jQuery);

/**
 * 対象要素をプログレスバー画像に変更
 *
 * @requires jQuery
 * @author 株式会社ヒナプロジェクト
 * @version 1.0.1
 */
(function($){
$.fn.extend({progressImage:function(options){

	// デフォルト引数を取得
	var settings = $.extend({src:'data:image/gif;base64,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', alt:'送信中', title:'送信中', id:null, customClass:null}, options);

	// 画像を作成
	var $img = $('<img/>').attr({src:settings.src, alt:settings.alt, title:settings.title});

	// idの指定があれば追加
	if(settings.id){$img.attr('id', settings.id);}

	// customClassの指定があれば追加
	if(settings.customClass){$img.addClass($.isArray(settings.customClass) ? settings.customClass.join(' ') : settings.customClass);}

	// 画像に置換
	this.replaceWith($img);

	return this;

}});
})(jQuery);

/**
 * ローディング画像をモーダル表示
 *
 * @requires jQuery
 * @author 株式会社ヒナプロジェクト
 * @version 1.0.1
 */
(function($){
$.extend({loading:function(options){

	// デフォルト引数を取得
	var settings = $.extend({method:'show', customClass:null, parentElement:null}, options);

	if(settings.method == 'show'){
		// モーダル要素を作成して表示
		if(!$('.jquery-hina-loading').length){
			var $loading = $('<div/>').addClass('jquery-hina-loading');
			if(settings.customClass){$loading.addClass(settings.customClass);}

			// 親要素を使用する場合
			if (settings.parentElement) {
				// body 要素の最後に要素を追加
				$(settings.parentElement).appendTo('body');

				// bodyの子要素の最後にライブラリ用のクラスを追加
				$('body').children().last().addClass('jquery-hina-loading');

				// bodyの子要素の最後にローディングモーダルを追加
				$('body').children().last().append($loading);

			// デフォルト
			}else{
				$loading.appendTo('body')
			}

		}
	}else if(settings.method == 'hide'){
		// モーダル要素を削除
		$('.jquery-hina-loading').remove();
	}

	return this;

}});
})(jQuery);

/**
 * トーストを表示
 *
 * @requires jQuery
 * @author 株式会社ヒナプロジェクト
 * @version 1.0.1
 */
(function($){
$.extend({toast:function(text, title, options){

	// デフォルト引数を取得
	if(typeof text == 'undefined'){text = null;}
	if(typeof title == 'undefined'){title = null;}
	var settings = $.extend({nl2br:true, html:false, position:'center-middle', customClass:null, attr:{}, css:{}, duration:'fast', displayTime:2000, closeByTap:false, showCloseButton:false, closeButtonText:'×'}, options);

	// 属性を初期化
	if(!settings.attr){settings.attr = {};}
	if(!settings.attr.box){settings.attr.box = {};}
	if(!settings.attr.closeButton){settings.attr.closeButton = {};}
	if(!settings.attr.title){settings.attr.title = {};}
	if(!settings.attr.text){settings.attr.text = {};}

	// CSSを初期化
	if(!settings.css){settings.css = {};}
	if(!settings.css.box){settings.css.box = {};}
	if(!settings.css.closeButton){settings.css.closeButton = {};}
	if(!settings.css.title){settings.css.title = {};}
	if(!settings.css.text){settings.css.text = {};}

	// ブロック要素を作成
	var $toast = $('<div/>').addClass('jquery-hina-toast-box');
	if(settings.customClass){$toast.addClass(settings.customClass);}
	if(settings.attr.box){$toast.attr(settings.attr.box);}
	if(settings.css.box){$toast.css(settings.css.box);}

	// 閉じるボタンの表示指定があれば追加
	if(settings.showCloseButton){
		var $bar = $('<p/>').addClass('jquery-hina-toast-bar');
		var $closeButton = $('<a/>').addClass('jquery-hina-toast-close-button').attr('href', 'javascript:void(0);').text(settings.closeButtonText);
		if(settings.attr.closeButton){$closeButton.attr(settings.attr.closeButton);}
		if(settings.css.closeButton){$closeButton.css(settings.css.closeButton);}
		$closeButton.click(function(event){
			$toast.animate({opacity:'hide'}, settings.duration, function(){
				$(this).remove();
			});
		});
		$closeButton.appendTo($bar);
		$bar.appendTo($toast);
	}

	// タイトルの指定があれば追加
	if(title){
		var $title = $('<p/>').addClass('jquery-hina-toast-title').text(title);
		if(settings.attr.title){$title.attr(settings.attr.title);}
		if(settings.css.title){$title.css(settings.css.title);}
		$title.appendTo($toast);
	}

	// 内容の指定があれば追加
	if(text){
		var $text = $('<p/>').addClass('jquery-hina-toast-text');
		if(settings.attr.text){$text.attr(settings.attr.text);}
		if(settings.css.text){$text.css(settings.css.text);}
		if(!settings.html){text = $('<p/>').text(text).html();}
		if(settings.nl2br){text = text.replace(/[\r\n]/g, '<br />');}
		$text.html(text).appendTo($toast);
	}

	// タップ動作で閉じる指定があればイベント処理を追加
	if(settings.closeByTap){
		$toast.click(function(event){
			$(this).animate({opacity:'hide'}, settings.duration, function(){
				$(this).remove();
			});
		});
	}

	// DOMを挿入
	$toast.appendTo('body');

	// 位置の指定がある場合
	if(settings.position){
		if($.isPlainObject(settings.position)){
			$toast.css(settings.position);
		}else{
			var positionList = settings.position.toLowerCase().split('-');
			if(positionList.length == 2){
				var position = {};

				if(positionList[0] == 'left'){
					position.left = 0;
				}else if(positionList[0] == 'center'){
					position.left = ($(window).width() / 2) - ($toast.width() / 2);
				}else if(positionList[0] == 'right'){
					position.right = 0;
				}

				if(positionList[1] == 'top'){
					position.top = 0;
				}else if(positionList[1] == 'middle'){
					position.top = ($(window).height() / 2) - ($toast.height() / 2);
				}else if(positionList[1] == 'bottom'){
					position.bottom = 0;
				}

				$toast.css(position);
			}
		}
	}

	// 表示
	$toast.animate({opacity:'show'}, settings.duration, function(){
		// 表示時間の指定がある場合はフェードアウト開始用のタイマーを作成
		if(settings.displayTime && (settings.displayTime > 0)){
			setTimeout(function(){
				$toast.animate({opacity:'hide'}, settings.duration, function(){
					$(this).remove();
				});
			}, settings.displayTime);
		}
	});

	return this;

}});
})(jQuery);

/**
 * 対象要素を起点にトーストを表示
 *
 * @requires jQuery
 * @author 株式会社ヒナプロジェクト
 * @version 1.0.0
 */
(function($){
$.fn.extend({toast:function(text, title, options){

	// デフォルト引数を取得
	if(typeof text == 'undefined'){text = null;}
	if(typeof title == 'undefined'){title = null;}
	var settings = $.extend({nl2br:true, html:false, position:'center-bottom', customClass:null, attr:{}, css:{}, duration:'fast', displayTime:2000, showCloseButton:false, closeByTouch:false}, options);

	// 属性を初期化
	if(!settings.attr){settings.attr = {};}
	if(!settings.attr.box){settings.attr.box = {};}
	if(!settings.attr.closeButton){settings.attr.closeButton = {};}
	if(!settings.attr.title){settings.attr.title = {};}
	if(!settings.attr.text){settings.attr.text = {};}

	// CSSを初期化
	if(!settings.css){settings.css = {};}
	if(!settings.css.box){settings.css.box = {};}
	if(!settings.css.closeButton){settings.css.closeButton = {};}
	if(!settings.css.title){settings.css.title = {};}
	if(!settings.css.text){settings.css.text = {};}

	// 要素毎にトーストを表示
	this.each(function(){
		// ブロック要素を作成
		var $toast = $('<div/>').addClass('jquery-hina-toast-box').css('position', 'absolute');
		if(settings.customClass){$toast.addClass(settings.customClass);}
		if(settings.attr.box){$toast.attr(settings.attr.box);}
		if(settings.css.box){$toast.css(settings.css.box);}

		// 閉じるボタンの表示指定があれば追加
		if(settings.showCloseButton){
			var $bar = $('<p/>').addClass('jquery-hina-toast-bar');
			var $closeButton = $('<a/>').addClass('jquery-hina-toast-close-button').attr('href', 'javascript:void(0);').text(settings.closeButtonText);
			if(settings.attr.closeButton){$closeButton.attr(settings.attr.closeButton);}
			if(settings.css.closeButton){$closeButton.css(settings.css.closeButton);}
			$closeButton.click(function(event){
				$toast.animate({opacity:'hide'}, settings.duration, function(){
					$(this).remove();
				});
			});
			$closeButton.appendTo($bar);
			$bar.appendTo($toast);
		}

		// タイトルの指定があれば追加
		if(title){
			var $title = $('<p/>').addClass('jquery-hina-toast-title').text(title);
			if(settings.attr.title){$title.attr(settings.attr.title);}
			if(settings.css.title){$title.css(settings.css.title);}
			$title.appendTo($toast);
		}

		// 内容の指定があれば追加
		if(text){
			var $text = $('<p/>').addClass('jquery-hina-toast-text');
			if(settings.attr.text){$text.attr(settings.attr.text);}
			if(settings.css.text){$text.css(settings.css.text);}
			if(!settings.html){text = $('<p/>').text(text).html();}
			if(settings.nl2br){text = text.replace(/[\r\n]/g, '<br />');}
			$text.html(text).appendTo($toast);
		}

		// タップ動作で閉じる指定があればイベント処理を追加
		if(settings.closeByTap){
			$toast.click(function(event){
				$(this).animate({opacity:'hide'}, settings.duration, function(){
					$(this).remove();
				});
			});
		}

		// DOMを挿入
		$toast.appendTo('body');

		// 位置の指定がある場合
		if(settings.position){
			if($.isPlainObject(settings.position)){
				$toast.css(settings.position);
			}else{
				var positionList = settings.position.toLowerCase().split('-');
				if(positionList.length == 2){
					var position = {}, offset = $(this).offset();

					if(positionList[0] == 'left'){
						position.left = offset.left - $toast.outerWidth();
					}else if(positionList[0] == 'center'){
						position.left = offset.left + ($(this).outerWidth() / 2) - ($toast.outerWidth() / 2);
					}else if(positionList[0] == 'right'){
						position.left = offset.left + $(this).outerWidth();
					}

					if(positionList[1] == 'top'){
						position.top = offset.top - $toast.outerHeight();
					}else if(positionList[1] == 'middle'){
						position.top = offset.top + ($(this).outerHeight() / 2) - ($toast.outerHeight() / 2);
					}else if(positionList[1] == 'bottom'){
						position.top = offset.top + $(this).outerHeight();
					}

					$toast.css(position);
				}
			}
		}

		// 表示
		$toast.animate({opacity:'show'}, settings.duration, function(){
			// 表示時間の指定がある場合はフェードアウト開始用のタイマーを作成
			if(settings.displayTime && (settings.displayTime > 0)){
				setTimeout(function(){
					$toast.animate({opacity:'hide'}, settings.duration, function(){
						$(this).remove();
					});
				}, settings.displayTime);
			}
		});
	});

	return this;

}});
})(jQuery);

/**
 * 対象要素のdisabled属性を変更
 *
 * @requires jQuery
 * @author 株式会社ヒナプロジェクト
 * @version 1.0.1
 */
(function($){
$.fn.extend({disabled:function(delay, flag){

	// delayの指定が無ければディレイを5000ミリ秒に指定
	if(typeof delay == 'undefined'){delay = 5000;}

	// flagの指定が無ければtrueを代入
	if(typeof flag == 'undefined'){flag = true;}

	// disabled属性を変更
	this.prop('disabled', flag);

	// ディレイの指定があれば指定時間経過後にdisabled属性を戻す
	if(delay){
		setTimeout(function($object){
			$object.prop('disabled', !flag);
		}, delay, this);
	}

	return this;

}});
})(jQuery);

/**
 * jQuery UIを使った単純なモーダルアラートダイアログを表示
 *
 * @requires jQuery
 * @requires jQuery UI
 * @author 株式会社ヒナプロジェクト
 * @version 1.0.1
 */
(function($){
$.extend({alert:function(message, title, settings){

	if(typeof title == 'undefined'){title = null;}
	settings = $.extend({
		button: 'OK',
		html: false
	}, settings || {});
	var $dialog = $('<div/>');
	var params = {title:title, closeText:'閉じる', modal:true, resizable:false, buttons:{}};
	params.buttons[settings.button] = function(){$(this).dialog('close').remove();};
	var $message = $('<p/>').addClass('hina-ui-alert');
	settings.html ? $message.html(message) : $message.text(message);
	$message.appendTo($dialog);
	$dialog.dialog(params);

}});
})(jQuery);

/**
 * 全ての要素の動的プロパティを静的属性に反映
 *
 * @requires jQuery
 * @author 株式会社ヒナプロジェクト
 * @version 1.0.0
 */
(function($){
$.extend({prop2attr:function(){

	// 入力要素の内容を属性に反映
	$('input[type="text"],input[type="hidden"],input[type="password"]').each(function(){
		$(this).attr('value', $(this).val());
	});

	// テキストエリアの内容を要素に反映
	$('textarea').each(function(){
		$(this).text($(this).val());
	});

	// オプション要素の選択を属性に反映
	$('option').each(function(){
		$(this).is(':selected') ? $(this).attr('selected', 'selected') : $(this).removeAttr('selected');
	});

	// ラジオボタン・チェックボックスの選択状態を属性に反映
	$('input[type="radio"],input[type="checkbox"]').each(function(){
		$(this).is(':checked') ? $(this).attr('checked', 'checked') : $(this).removeAttr('checked');
	});

	return this;

}});
})(jQuery);


// 高さを自動調整
(function($){
	$.fn.autoHeight = function(defaultHeight, flag){

		if(this.length == 0) return this;

		if(typeof flag == 'undefined') flag = true;
		defaultHeight = parseInt(defaultHeight, 10);

		if(flag){
			var parent = this;

			if(isNaN(defaultHeight) || (defaultHeight <= 0)){
				defaultHeight = this.height();
			}else{
				this.height(defaultHeight);
			}
			this.css('overflow-y', 'hidden');

			function setHeight(){
				var oldScrollTop = $(window).scrollTop();
				parent.height(0);
				var height = parseInt(parent.prop('scrollHeight'), 10);
				if(height < defaultHeight) height = defaultHeight;
				parent.height(height);
				var newScrollTop = $(window).scrollTop();
				if(newScrollTop != oldScrollTop) $(window).scrollTop(oldScrollTop);
			}

			function resetHeight(){
				parent.height(defaultHeight);
			}

			this
				.focus(setHeight)
				.keyup(setHeight)
		}else{
			this
				.unbind('focus')
				.unbind('keyup')
				.css('overflow-y', 'auto');
			if(!isNaN(defaultHeight) && (defaultHeight > 0)) this.height(defaultHeight);
		}

		return this;

	}
})(jQuery);
