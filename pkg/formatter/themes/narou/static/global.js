// PC用共通JS

// グローバル変数を初期化
window.hinaGlobal = window.hinaGlobal || {};

// jQueryが利用できない場合はコンソールにエラーを出力
if(!window.jQuery){
	console.error('jQueryが利用できません。');
}

// DOM初期化完了時
$(function(){

	// 次の要素のトグル処理
	$(document).on('click', '.js-toggle-next-tab' , function() {
		$(this).next().toggle();
	});

	// アイコン画像のキャッシュ対策
	var da_image = new Image();
	da_image.src = 'https://static.' + domain + '/view/images/narou.ico';

	// プログレスバー画像のURLを指定
	var uploadingImageUrl = 'https://static.' + domain + '/view/images/common/library/uploading.gif';

	// ページ内にフォームの送信ボタンがある場合はプログレスバー画像のキャッシュ対策
	if($(':submit').val()){
		var img01 = new Image();
 		img01.src = uploadingImageUrl;
	}

	// ページ表示時にプログレスバー(CSSスタイル)を送信ボタンに戻す
	// ※Firefox, Safariにおけるブラウザバック時にページがリロードされず、submitがロックされたままになる問題に対する対策
	if ($('.js-progress-button').length){ // `js-progress-button`が存在するとき
		window.onpageshow = function(event) {
			$('.js-progress-button').removeClass("is-active");
			$('.js-progress-button > .js-progress-button__button').prop('disabled', false);
		};
	}

	// フォーム送信時の共通動作
	$(document).on('submit', 'form', function(event){
		var $$ = $(this), data = $(this).data(), error, selector;

		// ロック対象のボタンのパターンを指定
		var lockPattern = 'input[type="submit"],input[type="button"],input[type="reset"],button';

		// 送信項目に環境依存文字(サロゲートペア)が含まれていないか検査
		var searchPattern = 'input[type="text"],textarea';
		$$.find(searchPattern).each(function(){
			var surrogatePairList = findSurrogatePair($(this).val());
			if(surrogatePairList){
				var c = surrogatePairList[0];
				error = '以下の文字は、環境依存文字のため使用できません。\n';
				error += c + '(U+' + c.codePointAt(0).toString(16).toUpperCase() + ')';
			}
		});

		// エラーが発生した場合
		if(error){
			// デフォルトのイベント処理と伝播処理を無効化
			event.preventDefault();
			event.stopPropagation();
			$$.data('stop-propagation', true);

			if(data.sendByAjaxErrorDialog){
				// セレクタによる指定がある場合
				selector = data.sendByAjaxErrorDialog;
			}else if(data.sendByAjaxErrorDialogId){
				// IDによる指定がある場合
				selector = hinaGlobal.toIdSelector(data.sendByAjaxErrorDialogId);
			}else if(data.sendByAjaxErrorDialogClass){
				// クラス名による指定がある場合
				selector = hinaGlobal.toClassSelector(data.sendByAjaxErrorDialogClass);
			}
			if(selector){
				// エラー表示用ダイアログの指定があればそこに表示
				error = error.replace(/(\r\n|\r|\n)/g, '<br />');
				$(selector).each(function(){
					// エラー表示用の子要素を検証
					var childData = $(this).data(), childSelector;
					if(childData.sendByAjaxErrorText){
						childSelector = childData.sendByAjaxErrorText;
					}else if(childData.sendByAjaxErrorTextId){
						childSelector = hinaGlobal.toIdSelector(childData.sendByAjaxErrorTextId);
					}else if(childData.sendByAjaxErrorTextClass){
						childSelector = hinaGlobal.toClassSelector(childData.sendByAjaxErrorTextClass);
					}
					if(childSelector){
						// エラー表示用の子要素の指定があれば当該要素に表示
						$(childSelector, this).each(function(){
							$(this).html(error);
						});
						$(this).animate({height:'show'});
					}else{
						// 指定がなければダイアログ自身に表示
						$(this).html(error).animate({height:'show'});
					}
				});

				// 最初のエラー表示用ダイアログまで自動的にスクロール
				var firstTarget = $(selector).get(0);
				if(firstTarget){
					$('body,html').animate({scrollTop:$(firstTarget).offset().top});
				}
			}else{
				// ビルトイン関数でエラーを表示
				alert(error);
			}

			return false;
		}

		// 送信ボタンをプログレスバー(CSSスタイル)に変更する処理
		$$.find('.js-progress-button').each(function(){
			$(this).addClass('is-active');
			$(this).find('.js-progress-button__button').each(function(){
				// ボタンを無効化
				$(this).prop('disabled', true);

				// プログレスバー画像に変更する処理と競合しないようにデータ属性の nolock に true を指定
				$(this).data('nolock', true);
			});
		});
		// 5秒後プログレスバー(CSSスタイル)を送信ボタンに復元する
		setTimeout(function() {
			$('.js-progress-button').removeClass("is-active");
			$('.js-progress-button > .js-progress-button__button').prop('disabled', false);
		}, 5000);

		// 送信ボタンをプログレスバー画像に変更する処理
		$$.find(lockPattern).each(function(){
			if(this.form && ($(this.form).attr('target') == '_blank')){
				// 別ウィンドウで開く場合はスキップ
				return true;
			}else if($(this).attr('name')){
				// name属性がある場合はスキップ
				return true;
			}else if($(this).data('nolock')){
				// 明示的に変更を禁止している場合はスキップ
				return true;
			}

			// 送信ボタンをプログレスバーに変更
			var $uploadingImage = $('<img/>').attr({src:uploadingImageUrl, alt:'データ送信中'});
			$(this).replaceWith($uploadingImage);
		});
	});

	// Ajaxによる非同期フォームを処理する場合
	$(document).on('submit', '.js-send-by-ajax', function(event){
		var $$ = $(this), data = $(this).data();

		// デフォルトのイベント処理を無効化
		event.preventDefault();

		// 伝播が中止されている場合は何もしない
		if(data.stopPropagation){
			$$.removeData('stop-propagation');
			return false;
		}

		// 通信処理の設定
		var settings = {cache:false, processData:false, contentType:false};
		settings.headers = {'X-Force-Content-Type':'json'};
//		settings.xhrFields = {withCredentials:true};	// クロスドメインで処理が必要になれば解除
		settings.url = $$.attr('action');
		settings.type = $$.attr('method') ? $$.attr('method').toUpperCase() : 'GET';
		settings.data = (settings.type == 'POST') ? new FormData(this) : $$.serialize();

		// 通信開始前に呼び出されるコールバック関数
		settings.beforeSend = function(jqXHR){
			// 通信開始前のトリガを実行
			$$.trigger('hina:submit:beforesend', [jqXHR]);
		};

		// 通信成功時に呼び出されるコールバック関数
		settings.success = function(result, textStatus, jqXHR){
			var error, selector;

			if(result.error && result.error.message){
				// 受信データにエラー情報が含まれている場合

				// プログレスバー(CSSスタイル)に変更された送信ボタンを復元
				$$.find('.js-progress-button').each(function(){
					$(this).removeClass('is-active');
					$(this).find('.js-progress-button__button').each(function(){
						// ボタンを有効化
						$(this).prop('disabled', false);
					});
				});

				// 通信失敗時のトリガを実行
				$$.trigger('hina:submit:error', [result, textStatus, jqXHR]);

				// 処理失敗時のダイアログを表示
				if(data.sendByAjaxErrorDialog){
					// セレクタによる指定がある場合
					selector = data.sendByAjaxErrorDialog;
				}else if(data.sendByAjaxErrorDialogId){
					// IDによる指定がある場合
					selector = hinaGlobal.toIdSelector(data.sendByAjaxErrorDialogId);
				}else if(data.sendByAjaxErrorDialogClass){
					// クラス名による指定がある場合
					selector = hinaGlobal.toClassSelector(data.sendByAjaxErrorDialogClass);
				}
				if(selector){
					// エラー表示用ダイアログの指定があればそこに表示
					error = result.error.message.replace(/(\r\n|\r|\n)/g, '<br />');
					$(selector).each(function(){
						// エラー表示用の子要素を検証
						var childData = $(this).data(), childSelector;
						if(childData.sendByAjaxErrorText){
							childSelector = childData.sendByAjaxErrorText;
						}else if(childData.sendByAjaxErrorTextId){
							childSelector = hinaGlobal.toIdSelector(childData.sendByAjaxErrorTextId);
						}else if(childData.sendByAjaxErrorTextClass){
							childSelector = hinaGlobal.toClassSelector(childData.sendByAjaxErrorTextClass);
						}
						if(childSelector){
							// エラー表示用の子要素の指定があれば当該要素に表示
							$(childSelector, this).each(function(){
								$(this).html(error);
							});
							$(this).animate({height:'show'});
						}else{
							// 指定がなければダイアログ自身に表示
							$(this).html(error).animate({height:'show'});
						}
					});

					// 最初のエラー表示用ダイアログまで自動的にスクロール
					var firstTarget = $(selector).get(0);
					if(firstTarget){
						$('body,html').animate({scrollTop:$(firstTarget).offset().top});
					}
				}else{
					// ビルトイン関数でエラーを表示
					alert(result.error.message);
				}
			}else{
				// 受信データにエラー情報が含まれていない場合

				// 通信成功時のトリガを実行
				$$.trigger('hina:submit:success', [result, textStatus, jqXHR]);

				if(result.url){
					// 受信データにURLの指定がある場合はリダイレクト
					location.assign(result.url);
				}else if(result.reload){
					// リロードの指定がある場合は強制リロード
					location.reload(true);
				}
			}
		};

		// 通信失敗時に呼び出されるコールバック関数
		settings.error = function(jqXHR, textStatus, errorThrown){
			var error, selector;

			// プログレスバー(CSSスタイル)に変更された送信ボタンを復元
			$$.find('.js-progress-button').each(function(){
				$(this).removeClass('is-active');
				$(this).find('.js-progress-button__button').each(function(){
					// ボタンを有効化
					$(this).prop('disabled', false);
				});
			});

			// 通信失敗時のトリガを実行
			$$.trigger('hina:submit:error', [jqXHR, textStatus, errorThrown]);

			// 処理失敗時のメッセージを指定
			error = '通信エラーが発生しました。\n' + textStatus;

			// 処理失敗時のダイアログを表示
			if(data.sendByAjaxErrorDialog){
				// セレクタによる指定がある場合
				selector = data.sendByAjaxErrorDialog;
			}else if(data.sendByAjaxErrorDialogId){
				// IDによる指定がある場合
				selector = hinaGlobal.toIdSelector(data.sendByAjaxErrorDialogId);
			}else if(data.sendByAjaxErrorDialogClass){
				// クラス名による指定がある場合
				selector = hinaGlobal.toClassSelector(data.sendByAjaxErrorDialogClass);
			}
			if(selector){
				// エラー表示用ダイアログの指定があればそこに表示
				error = error.replace(/(\r\n|\r|\n)/g, '<br />');
				$(selector).each(function(){
					// エラー表示用の子要素を検証
					var childData = $(this).data(), childSelector;
					if(childData.sendByAjaxErrorText){
						childSelector = childData.sendByAjaxErrorText;
					}else if(childData.sendByAjaxErrorTextId){
						childSelector = hinaGlobal.toIdSelector(childData.sendByAjaxErrorTextId);
					}else if(childData.sendByAjaxErrorTextClass){
						childSelector = hinaGlobal.toClassSelector(childData.sendByAjaxErrorTextClass);
					}
					if(childSelector){
						// エラー表示用の子要素の指定があれば当該要素に表示
						$(childSelector, this).each(function(){
							$(this).html(error);
						});
						$(this).animate({height:'show'});
					}else{
						// 指定がなければダイアログ自身に表示
						$(this).html(error).animate({height:'show'});
					}
				});

				// 最初のエラー表示用ダイアログまで自動的にスクロール
				var firstTarget = $(selector).get(0);
				if(firstTarget){
					$('body,html').animate({scrollTop:$(firstTarget).offset().top});
				}
			}else{
				// ビルトイン関数でエラーを表示
				alert(error);
			}
		};

		// 通信完了時に必ず呼び出されるコールバック関数
		settings.complete = function(){
			// 通信完了時のトリガを実行
			$$.trigger('hina:submit:complete');
		};

		// 通信処理
		$.ajax(settings);
	});

	// ログアウトボタンの共通動作
	$('.js-logout').click(function(event){
		// デフォルトのイベント処理を無効化
		event.preventDefault();

		var $form = $('<form/>').attr({action:$(this).attr('href'), method:'post'});
		$('<input/>').attr({type:'hidden', name:'token'}).val($(this).data('token')).appendTo($form);
		$form.appendTo('body').submit().remove();
	});

	// トグル表示のトリガを実行した時
	$(document).on('click', '.js-toggle', function(event){
		var $$ = $(this), data = $$.data(), selector, $target;

		// スライド式トグルの設定を取得
		var options = data.toggleOptions || {};
		options.complete = function(){
			// トグル動作完了時にトリガの文字列を変更
			if($(this).is(':visible') && data.toggleHideTriggerText){
				$$.text(data.toggleHideTriggerText);
			}else if($(this).is(':hidden') && data.toggleShowTriggerText){
				$$.text(data.toggleShowTriggerText);
			}

			// トグル動作完了時のトリガを実行
			if($(this).is(':visible')){
				$$.addClass('is-active');
				$$.trigger('hina:toggle:opened');
			}else{
				$$.removeClass('is-active');
				$$.trigger('hina:toggle:closed');
			}
			$$.trigger('hina:toggle:always');
		};

		// ターゲットの指定が無い場合はデフォルトで次の要素を指定
		if(!data.toggleTarget && !data.toggleTargetId && !data.toggleTargetClass){
			data.toggleTarget = 'next';
		}

		// ターゲットをトグル表示
		if(data.toggleTarget){
			if(data.toggleTarget.toLowerCase() == 'next'){
				$target = $(this).next();
			}else if(data.toggleTarget.toLowerCase() == 'previous'){
				$target = $(this).prev();
			}else if(data.toggleTarget.toLowerCase() == 'parent'){
				$target = $(this).parent();
			}else{
				$target = $(data.toggleTarget);
			}
		}else if(data.toggleTargetId){
			selector = data.toggleTargetId.split(/[\s,]/).map(function(value){return '#' + value;}).join(',');
			$target = $(selector);
		}else if(data.toggleTargetClass){
			selector = data.toggleTargetClass.split(/[\s,]/).map(function(value){return '.' + value;}).join(',');
			$target = $(selector);
		}else{
			console.error('トグル表示の対象要素の指定がありません。');
			return;
		}

		if(!data.toggleType || (data.toggleType.toLowerCase() == 'slide')){
			$target.slideToggle(options);
		}else{
			$target.toggle();

			// トグル動作完了時の文字列指定があれば変更
			if($target.is(':visible') && data.toggleHideTriggerText){
				$$.text(data.toggleHideTriggerText);
			}else if($target.is(':hidden') && data.toggleShowTriggerText){
				$$.text(data.toggleShowTriggerText);
			}

			// トグル動作完了時のトリガを実行
			if($target.is(':visible')){
				$$.addClass('is-active');
				$$.trigger('hina:toggle:opened');
			}else{
				$$.removeClass('is-active');
				$$.trigger('hina:toggle:closed');
			}
			$$.trigger('hina:toggle:always');
		}
	});

	$('.js-wopen').click(function(event){
		const data = $(this).data();
		const url = data.url;
		const target = data.target || '_blank';
		const windowFeatures = data.windowFeatures || 'toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=420,height=465';
		const wo = window.open(url, target, windowFeatures);
		wo.focus();
	});
});

// 広告追従処理
$(window).on('load',function(){
	var $ad = $('.js-sidead-scroll');
	if ($ad.length){ // `js-sidead-scroll`が存在するとき
		var data = $ad.data();
		// 広告とフッタの間に設けるマージン(px)
		if ( typeof data.margin !== 'undefined' ) {
			var margin = data.margin;	// `data-margin`が設定されている場合
		}else{
			var margin = 40;			// `data-margin`が設定されていない場合
		}
		// フッター要素の指定
		if ( typeof data.footer !== 'undefined' ) {
			var $footer = $(data.footer);	// `data-footer`が設定されている場合
		}else{
			var $footer = $('.l-footer');	// `data-footer`が設定されていない場合
		}
		var top = $ad.offset().top;
		var bottom = $footer.offset().top - margin;

		$(window).on('load scroll resize', function(event) {
			var scroll = $(this).scrollTop();
			var height = $ad.height();
			var css = {};
			if (bottom - height <= top){
				// 広告を追従する必要がない場合（コンテンツ部分の高さがサイドより短い）
				css.position = 'relative';
				css.top = '';
			}else if ((scroll + height) > bottom) {
				// フッタ付近までスクロールした場合
				css.position = 'absolute';
				css.top = bottom - height;
			}else if (scroll > top) {
				// スクロールが中盤の場合
				css.position = 'fixed';
				css.top = 20;
			}else{
				// 広告位置までスクロールしていない場合
				css.position = 'relative';
				css.top = '';
			}
			$ad.css(css);
		});
	}
});

// 親ウィンドウのキーワード入力欄に選択したキーワードを設定
function setTag(no, tagtext){

  window.opener.document.getElementById('getTag' + no).value = tagtext;
  this.close();

}

// キーワード一覧選択フォームを表示
function taginputopen(nextno){

	$('#TagForm' + (nextno + 1)).show();

}

// 親ウィンドウのURLを変更
function openerLink(URL){

	opener.location = URL;

}

// クッキー管理クラス
var CookieManager = new function(){

	// 利用可能かどうか
	this.isAvailable = function(){

		return navigator.cookieEnabled ? true : false;

	}

	// 値を取得
	this.get = function(key){

		// 利用できない場合
		if(!navigator.cookieEnabled) return false;

		var result;

		var cookieList = document.cookie.split('; ');
		key = escape(key);
		for(var index in cookieList){
			var keyValuePair = cookieList[index].split('=');
			if(key == keyValuePair[0]){
				result = unescape(keyValuePair[1]);
				break;
			}
		}

		return result;

	}

	// 値を保存
	this.set = function(optionList){

		// 使用できない場合
		if(!navigator.cookieEnabled) return false;

		if(!optionList.key) return false;

		var paramList = [];
		paramList.push(escape(optionList.key) + '=' + escape(optionList.value));
		if(optionList.domain) paramList.push('domain=' + optionList.domain);
		if(optionList.path) paramList.push('path=' + optionList.path);
		if(optionList.expires){
			if(typeof optionList.expires == 'string'){
				paramList.push('expires=' + optionList.expires);
			}else if(typeof optionList.expires == 'number'){
				if(optionList.expires < 0) optionList.expires = 0;
				var utc = new Date(new Date().getTime() + optionList.expires).toUTCString();
				paramList.push('expires=' + utc);
			}
		}
		if(optionList.secure) paramList.push('secure');

		document.cookie = paramList.join('; ');

		return true;

	}

};

// 文字列をIDによるセレクタ表現に変換
hinaGlobal.toIdSelector = function(target){

	return target.split(/[\s,]/).map(function(value){return '#' + value;}).join(',');

};

// 文字列をクラス名によるセレクタ表現に変換
hinaGlobal.toClassSelector = function(target){

	return target.split(/[\s,]/).map(function(value){return '.' + value;}).join(',');

};

// 文字列をname属性によるセレクタ表現に変換
hinaGlobal.toNameSelector = function(target){

	return target.split(/[\s,]/).map(function(value){return '[name="' + value + '"]';}).join(',');

};

// 変数が定義されているか
hinaGlobal.isDefined = function(variable){

	return (typeof variable != 'undefined') ? true : false;

};

// 変数が未定義であるか
hinaGlobal.isUndefined = function(variable){

	return (typeof variable == 'undefined') ? true : false;

};

// jQueryが利用可能な場合は独自のプラグインを追加
if(window.jQuery){
	(function($){
		// キャレットを操作
		$.fn.caret = function(positionList){

			if(this.length == 0) return this;

			var parent = this;
			var defaultList = {
				start:	0,
				end:	-1,
				focus:	true
			};
			var settingList = $.extend(defaultList, positionList);

			settingList.start = parseInt(settingList.start, 10);
			settingList.end = parseInt(settingList.end, 10);
			if(isNaN(settingList.start) || isNaN(settingList.end)) return this;

			if(settingList.focus) this.focus();
			if(settingList.start < 0) settingList.start = this.val().length;
			if(settingList.end < 0) settingList.end = settingList.start;

			var domObject = this[0];
			if(domObject.createTextRange){			// IE用
				var textRange = domObject.createTextRange();
				textRange.collapse(true);
				textRange.moveStart('character', settingList.start);
				textRange.moveEnd('character', settingList.end);
				textRange.select();
			}else if(domObject.setSelectionRange){	// Firefox・Chrome用
				domObject.setSelectionRange(settingList.start, settingList.end);
			}

			if(settingList.focus){
				if(navigator.userAgent.indexOf('Firefox') >= 0){	// Firefox対策
					setTimeout(function(){
						parent.focus();
					}, 1);
				}
			}

			return this;

		}

	})(jQuery);
}

// 文字列に含まれるサロゲートペアの配列を取得
function findSurrogatePair(string){
	return string.match(/([\uD800-\uDBFF][\uDC00-\uDFFF])/g);
}