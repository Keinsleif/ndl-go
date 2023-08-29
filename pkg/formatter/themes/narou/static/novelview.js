// 小説ページ(PC)用

// グローバル変数(読み込み時の標準)
var gUserId = false;
var gIsTate = false;
var gIsSasieNo = false;
var gIsFixMenuBar = true;
var gDefaultFontSize = 100;		// ユーザによる指定が無い場合のデフォルトの文字サイズ(%)
var gDefaultLineHeight = 180;	// ユーザによる指定が無い場合のデフォルトの行間(%)
var gIsWritingModeInitialized = false;
var gUserFontSize;
var gUserLineHeight;

var da_image = new Image();
da_image.src = 'static/narou.ico';

// クッキー管理クラス
var CookieManager = new function(){

	// 利用可能かどうか
	this.isAvailable = function(){

		// return navigator.cookieEnabled ? true : false;
		return window.localStorage ? true : false

	}

	// 値を取得
	this.get = function(key){

		// 利用できない場合
		// if(!navigator.cookieEnabled){
		if (!window.localStorage) {
			return false;
		}

		var result;

		// var cookieList = document.cookie.split('; ');
		// key = escape(key);
		key = encodeURIComponent(key)
		// for(var index in cookieList){
		// 	var keyValuePair = new String(cookieList[index]).split('=');
		// 	if(key == keyValuePair[0]){
		// 		result = unescape(keyValuePair[1]);
		// 		break;
		// 	}
		// }
		result = decodeURIComponent(localStorage.getItem(key))

		return result;

	}

	// 値を保存
	this.set = function(optionList){

		// 使用できない場合
		// if(!navigator.cookieEnabled){
		// 	return false;
		// }

		if(!optionList.key){
			return false;
		}

		var paramList = [];
		// paramList.push(escape(optionList.key) + '=' + escape(optionList.value));
		// if(optionList.domain){
		// 	paramList.push('domain=' + optionList.domain);
		// }
		// if(optionList.path){
		// 	paramList.push('path=' + optionList.path);
		// }
		// if(optionList.expires){
		// 	if(typeof optionList.expires == 'string'){
		// 		paramList.push('expires=' + optionList.expires);
		// 	}else if(typeof optionList.expires == 'number'){
		// 		if(optionList.expires < 0){
		// 			optionList.expires = 0;
		// 		}
		// 		var utc = new Date(new Date().getTime() + optionList.expires).toUTCString();
		// 		paramList.push('expires=' + utc);
		// 	}
		// }
		// if(optionList.secure){
		// 	paramList.push('secure');
		// }

		// document.cookie = paramList.join('; ');

		localStorage.setItem(optionList.key,optionList.value)

		return true;

	}

};

// 変数が定義されているか
function isDefined(variable){

	return (typeof variable != 'undefined') ? true : false;

}

// 変数が未定義であるか
function isUndefined(variable){

	return (typeof variable == 'undefined') ? true : false;

}

// クッキーをロード
function loadCookie(){

	// 簡易ログイン検査
	var autoLogin = CookieManager.get('autologin');
	var userl = CookieManager.get('userl');
	var value;

	if(autoLogin){
		value = autoLogin;
	}else if(userl){
		value = userl;
	}
	if(value && value != "null"){
		var userIdList = value.split('<>');
		if(userIdList[0] && userIdList[1].length >= 2){
			gUserId = userIdList[0];
		}
	}

	// 縦書き・横書きの設定をロード
	var isTate = parseInt(CookieManager.get('istate'), 10);
	if(isNaN(isTate)){
		isTate = 0;
	}
	gIsTate = (isTate == 1) ? true : false;

	// 挿絵表示の設定をロード
	var isSasieNo = parseInt(CookieManager.get('sasieno'), 10);
	if(isNaN(isSasieNo)){
		isSasieNo = 0;
	}
	gIsSasieNo = (isSasieNo == 1) ? true : false;

	// 小説メニューバーの設定をロード
	var isFixMenuBar = parseInt(CookieManager.get('fix_menu_bar'), 10);
	if(isNaN(isFixMenuBar)){
		isFixMenuBar = 1;
	}
	gIsFixMenuBar = (isFixMenuBar == 1) ? true : false;

}

///////////////////////////////////////////////////////////////////////////////////////////
// JSファイルロード時
(function(){

	loadCookie();

})();

///////////////////////////////////////////////////////////////////////////////////////////
// DOM初期化完了時
$(function(){

	// 小説閲覧ページのみ反映
	if(location.pathname.match(/^\/n\d{4}[a-z]+/) || true){
		// 作者指定のレイアウトを取得
		gUserFontSize = $('input[type="text"]' + 'input[name="fontsize"]').val();
		gUserLineHeight = $('input[type="text"]' + 'input[name="lineheight"]').val();

		// 縦書き・横書きのCSSを変更
		if(isMSIE()){
			changeWritingMode();
		}

		// 行間を変更
		changeLineHeight();

		// 文字サイズを変更
		changeFontSize();

		// レイアウトを変更
		changeNovelLayout();

		// ブックマークをAjaxで処理
//		controlBookmark();
	}

	// 小説メニューバーの振る舞いを変更
	changeMenuBar();

	///////////////////////////////////////////////////////////////////////////////////////
	// 各種イベントハンドラを設定

	// 小説メニュー 開閉
	$('.toggle').click(function(event){
		$('.novelview_navi').show();
		$('.toggle').hide();
		$('.toggle_menuclose').show();
	});
	$('.toggle_menuclose').click(function(event){
		$('.novelview_navi').hide();
		$('.toggle').show();
		$('.toggle_menuclose').hide();
	});

	// 小説閲覧メニューの動作
	// 行間変更ボタンが押された時
	$('a[name="lineheight_inc"]').click(function(event){
		var lineHeight = parseInt($('input[type="text"]' + 'input[name="lineheight"]').val(), 10);
		if(isNaN(lineHeight)){
			lineHeight = gDefaultLineHeight;
		}
		lineHeight += 10;
		changeLineHeight(lineHeight);
	});
	$('a[name="lineheight_dec"]').click(function(event){
		var lineHeight = parseInt($('input[type="text"]' + 'input[name="lineheight"]').val(), 10);
		if(isNaN(lineHeight)){
			lineHeight = gDefaultLineHeight;
		}
		lineHeight -= 10;
		changeLineHeight(lineHeight);
	});
	$('a[name="lineheight_reset"]').click(function(event){
		var lineHeight = 0;
		changeLineHeight(lineHeight);
	});

	// 文字サイズ変更ボタンが押された時
	$('a[name="fontsize_inc"]').click(function(event){
		var fontSize = parseInt($('input[type="text"]' + 'input[name="fontsize"]').val(), 10);
		if(isNaN(fontSize)){
			fontSize = gDefaultFontSize;
		}
		fontSize += 5;
		changeFontSize(fontSize);
	});
	$('a[name="fontsize_dec"]').click(function(event){
		var fontSize = parseInt($('input[type="text"]' + 'input[name="fontsize"]').val(), 10);
		if(isNaN(fontSize)){
			fontSize = gDefaultFontSize;
		}
		fontSize -= 5;
		changeFontSize(fontSize);
	});
	$('a[name="fontsize_reset"]').click(function(event){
		var fontSize = 0;
		changeFontSize(fontSize);
	});

	// 配色設定が変更された時
	$('input[type="radio"]' + 'input[name="colorset"]').click(function(event){
		var layoutType = parseInt($(this).val(), 10);
		changeNovelLayout(layoutType);
	});

	// 小説メニューバーの設定が変更された時
	$('input[name="fix_menu_bar"]').click(function(event){
		// 一部端末に不具合があるため、該当端末では使用不可
		var rejectDeviceList = ['Sony Tablet S'];
		for(var index in rejectDeviceList){
			if(navigator.userAgent.indexOf(rejectDeviceList[index]) >= 0){
				alert('お使いの端末では本設定は変更いただけません。');
				return event.preventDefault();
			}
		}

		var fixMenuBar = $(this).is(':checked') ? true : false;
		changeMenuBar(fixMenuBar);
	});

	// 表示調整メニュー内の閉じるボタンが押された時
	$('#menu_off_2').click(function(event){
		$('#menu_off').click();
	});

	// ページの上下に移動するスクローラを追加
	addPageScroller();

	// ページ内スクロールリンクが押された時
	$('.js-scroll').click(function(event){
		var scroll = $(this).data('scroll');
		var $target = scroll ? $(scroll) : null;

		// データ属性または対象のスクロール先が存在しない場合は何もしない
		if(!$target || !$target.length){
			return event.preventDefault();
		}

		// ページ内スクロールを実行
		var offset = $target.offset().top;
		var $header = $('#novel_header');
		if($header.length && ($header.css('position') == 'fixed')){
			// ヘッダメニューが固定表示の場合はその分高さを差し引く
			offset -= $header.height();
		}
		$('html,body').animate({scrollTop:offset}, 500);

	});

});

// 文字サイズ切り替え
function changeFontSize(fontSize){

	var min = 50;	// 許容する最小パーセント
	var max = 300;	// 許容する最大パーセント

	if(typeof fontSize == 'string'){
		if(fontSize == 'big'){
			fontSize = 140;
		}else if(fontSize == 'small'){
			fontSize = 95;
		}else{
			fontSize = 120;
		}
	}else if(typeof fontSize == 'number'){
		// 許容値の範囲外であれば修正
		if(isNaN(fontSize) || (fontSize == 0)){
			fontSize = 0;
		}else if(fontSize < min){
			fontSize = min;
		}else if(fontSize > max){
			fontSize = max;
		}
	}else{
		// クッキーから取得
		fontSize = parseInt(CookieManager.get('fontsize'), 10);

		// 許容値の範囲外であれば修正
		if(isNaN(fontSize) || (fontSize == 0)){
			fontSize = 0;
		}else if(fontSize < min){
			fontSize = min;
		}else if(fontSize > max){
			fontSize = max;
		}
	}

	// クッキーに記憶
	var expires = 86400 * 1000 * 90;	// 90日
	CookieManager.set({key:'fontsize', value:fontSize, domain:domain, path:'/', expires:expires});

	// 変更を適用
	if(fontSize > 0){
		$('input[type="text"]' + 'input[name="fontsize"]').val(fontSize);
		$('.novel_view').css('fontSize', fontSize + '%');
	}else{
		$('input[type="text"]' + 'input[name="fontsize"]').val('-');
		$('.novel_view').css('fontSize', gUserFontSize + '%');
	}

}

// 縦書きCSSの切り替え
function changeWritingMode(){

	// novel_honbunエレメントを取得
	var $element = $('#novel_honbun');
	if(!$element.length){
		return false;
	}

	// 初回実行時に縦書き用のCSSをソースに追加
	if(!gIsWritingModeInitialized){
		gIsWritingModeInitialized = true;
		var verticalLayout = [
			'.tategaki {',
			'margin: 10px auto;',
			'padding: 10px;',
			'width: 700px;',
			'height: 450px;',
			'writing-mode: tb-rl;',
			'overflow-x: scroll;',
			'overflow-y: hidden;',
			'}'
			];
		var tag = '<style><!--\n' + verticalLayout.join('\n') + '\n\/\/--><\/style>';
		$('head').append(tag);
	}

	// CSSを変更
	if(gIsTate){
		// 縦書き
		$element.addClass('tategaki');
		$('#novel_honbun').on('wheel', virtualScrollHandler);
	}else{
		// 横書き
		$element.removeClass('tategaki');
		$('#novel_honbun').off('wheel', virtualScrollHandler);
	}

	// Cookie追加 or 更新
	tateyokocookiset();

}

// 縦書きクッキー設定
function tateyokocookiset(){

	if(!window.domain){
		alert('ドメイン設定エラー！\ndomain変数がないため縦書き⇔横書き切り替えは許可されません。');
		return false;
	}

	// 有効期限の作成
	var expires = 86400 * 1000 * 90;	// 90日
	var istate = gIsTate ? 1 : 0;

	// クッキーの発行
	CookieManager.set({key:'istate', value:istate, domain:domain, path:'/', expires:expires});

}

// 縦書きボタンクリック時
function tate_yoko_button_click(){

	// 縦書き設定を反転
	gIsTate = gIsTate ? false : true;

	// CSSを変更
	changeWritingMode();

}

// 縦書きIEのみ切り替えボタンを表示
function changeButtonView(){

	// IE判別
	if(isMSIE()){
		document.write('<a href="JavaScript:void(0);" class="tateyoko" onclick="tate_yoko_button_click(); return false;">縦書⇔横書き切替<\/a><br \/><br \/>');
	}

}

// IEかどうか判定
function isMSIE(){

	if(navigator.appName == 'Microsoft Internet Explorer'){
		// IE10以下の場合
		return true;
	}else if(navigator.userAgent.indexOf('Trident') >= 0){
		// IE11以上の場合
		return true;
	}

	return false;

}

///////////////////////////////////////////////////////////////////////////////////////////
// 評価送信部分
function i_view(){

	$('#impression').show();
	$('#review').hide();

}

function r_view(){

	$('#impression').hide();
	$('#review').show();

}

///////////////////////////////////////////////////////////////////////////////////////////
// TXTダウンロード
function download(f,type){

	var code;
	var kaigyo;

	switch(parseInt(type, 10)){
		case 1:
			code = 'SJIS';
			kaigyo = 'CRLF';
			break;

		case 2:
			code = 'SJIS';
			kaigyo = 'CR';
			break;

		case 3:
			code = 'EUC-JP';
			kaigyo = 'LF';
			break;

		case 0:
			code = f.code.options[f.code.options.selectedIndex].value;
			kaigyo = f.kaigyo.options[f.kaigyo.options.selectedIndex].value;
			break;

		default:
			alert('ダウンロードタイプが不明です。');
			return false;
			break;
	}

	var no;
	if(f.type_no){
		no = f.type_no.options[f.type_no.options.selectedIndex].value;
	}else{
		no = 0;
	}
	var file_type = 'txt';
	var tmp = '1';
	var hankaku = f.hankaku.options[f.hankaku.options.selectedIndex].value;
	var url = '?m=file_dl&file=' + file_type + ';' + code + ';' + kaigyo + ';' + tmp + ';' + no + ';' + hankaku;
	location.href = url;

}

///////////////////////////////////////////////////////////////////////////////////////////
// 挿絵表示切替
/**
 * 鳥居ヒナの挿絵チェンジャ～
 * Ver.1.0 by HinaProject
 */

// 初期化
function sasieinit(){

	// 有効期限更新
	sasiecookiset();

	var imageUrl = gIsSasieNo ? 'novelview_off.gif' : 'novelview_on.gif';
	var url = 'static/' + imageUrl;

	// 画像を変更
	$('#sasieflag').attr('src', url);

}

// クリック時
// 引数がtrueならリロード
function sasieclick(reload){

	// 挿絵表示設定を反転
	gIsSasieNo = gIsSasieNo ? false : true;

	// クッキー設定
	sasiecookiset();

	var imageUrl = gIsSasieNo ? 'novelview_off.gif' : 'novelview_on.gif';
	var url = '//static.' + domain + '/novelview/img/' + imageUrl;

	// 画像を変更
	$('#sasieflag').attr('src', url);

	// リロードなら
	if(reload){
		location.reload();
	}

}

// 仮想ケータイ表示
function virtualmobileview(ncode, is18){

	var subDomain = is18 ? 'nkx' : 'nk';
	var url = 'http://' + subDomain + '.' + domain + '/' + ncode + '/1/';
	var title = 'KVIEW';
	var params = ['width=320','height=250','scrollbars=yes'];
	window.open(url, title, params.join(','));

}

// 挿絵クッキー設定
function sasiecookiset(){

	if(!window.domain){
		alert('ドメイン設定エラー！\ndomain変数がないため挿絵切り替えは許可されません。');
		return false;
	}

	// 有効期限の作成
	var expires = 86400 * 1000 * 90;	// 90日
	var sasieno = gIsSasieNo ? 1 : 0;

	// クッキーの発行
	CookieManager.set({key:'sasieno', value:sasieno, domain:domain, path:'/', expires:expires});

}

///////////////////////////////////////////////////////////////////////////////////////////
// ロールオーバースクリプト
function initRollovers(){

	var aPreLoad = new Array();
	var sTempSrc;
	var aImages = $(document).find('img');

	for(var i = 0; i < aImages.length; ++i){
		var img_obj = $(aImages[i]);
		if(img_obj.hasClass('imgover')){
			var src = img_obj.attr('src');
			var ftype = src.substring(src.lastIndexOf('.'), src.length);
			var hsrc = src.replace(ftype, '_o' + ftype);

			img_obj.attr('hsrc', hsrc);

			aPreLoad[i] = new Image();
			aPreLoad[i].src = hsrc;

			img_obj.mouseover(function(){
				sTempSrc = $(this).attr('src');
				$(this).attr('src', $(this).attr('hsrc'));
			});

			img_obj.mouseout(function(){
				if(!sTempSrc) sTempSrc = $(this).attr('src').replace('_o' + ftype, ftype);
				$(this).attr('src', sTempSrc);
			});
		}
	}

}

///////////////////////////////////////////////////////////////////////////////////////////
// レビューの文字カウント
// 空改行の扱い：oが含む方・sが含まない方
function review_charcount(){

	// タイトルのチェック
	var $reviewTitle = $('.js-reviewtitle');
	var countAll = countCharacters($reviewTitle.val(), true, true, true);
	var countWithoutSpace = countCharacters($reviewTitle.val(), true, false, true);
	var maxLen = $reviewTitle.data('maxlength');
	var mixLen = $reviewTitle.data('minlength');
	var titleError = '';
	if(countWithoutSpace < mixLen){
		titleError = 'タイトルの文字数が足りません。';
	}else if(countAll > maxLen){
		titleError = 'タイトルの文字数制限を越えました。';
	}

	// レビュー本文のチェック
	var $reviewHonbun = $('.js-reviewhonbun');
	var reviewStrings = $reviewHonbun.val();
	countAll = countCharacters(reviewStrings, true, true, true);
	countWithoutSpace = countCharacters(reviewStrings, true, false, true);
	maxLen = $reviewHonbun.data('maxlength');
	mixLen = $reviewHonbun.data('minlength');
	var honbunError = '';
	if(countWithoutSpace < mixLen){
		honbunError = '本文の文字数が足りません。';
	}else if(countAll > maxLen){
		honbunError = '本文の文字数制限を越えました。';
	}
	
	// メッセージの表示
	if(!titleError && !honbunError){
		$('.js-mes').text('書き込めます。');
	}else{
		$('.js-mes').text('');		
	}
	$('.js-errormes-title').text(titleError);
	$('.js-errormes-honbun').text(honbunError);
}

// 小説本文の行間を変更
function changeLineHeight(lineHeight){

	var min = 100;	// 許容する最小パーセント
	var max = 300;	// 許容する最大パーセント

	if(typeof lineHeight == 'string'){
		// normalのみ有効
		if(lineHeight == 'normal'){
			lineHeight = gDefaultLineHeight;
		}else{
			return false;
		}
	}else if(typeof lineHeight == 'number'){
		// 許容値の範囲外であれば修正
		if(isNaN(lineHeight) || (lineHeight == 0)){
			lineHeight = 0;
		}else if(lineHeight < min){
			lineHeight = min;
		}else if(lineHeight > max){
			lineHeight = max;
		}
	}else{
		// クッキーから取得
		lineHeight = parseInt(CookieManager.get('lineheight'), 10);

		// 許容値の範囲外であれば修正
		if(isNaN(lineHeight) || (lineHeight == 0)){
			lineHeight = 0;
		}else if(lineHeight < min){
			lineHeight = min;
		}else if(lineHeight > max){
			lineHeight = max;
		}
	}

	// クッキーに記憶
	var expires = 86400 * 1000 * 90;	// 90日
	CookieManager.set({key:'lineheight', value:lineHeight, domain:domain, path:'/', expires:expires});

	// 変更を適用
	if(lineHeight > 0){
		$('input[type="text"]' + 'input[name="lineheight"]').val(lineHeight);
		$('.novel_view').css('lineHeight', lineHeight + '%');
	}else{
		$('input[type="text"]' + 'input[name="lineheight"]').val('-');
		$('.novel_view').css('lineHeight', gUserLineHeight + '%');
	}

	return true;

}

// 小説ページのレイアウトを変更
function changeNovelLayout(layoutType){

	var $body = $('body');
	var $novelColor = $('#novel_color');
	var $novelContents = $('#novel_contents');
	var $novelSubList = $('dl.novel_sublist2');
	var customLayoutClass;
	var className;

	// レイアウトの種類の指定が無ければクッキーから読み込み
	if(isUndefined(layoutType)){
		layoutType = parseInt(CookieManager.get('novellayout'), 10);
		if(isNaN(layoutType)){
			layoutType = 0;
		}
		$('input[type="radio"]' + 'input[name="colorset"]' + 'input[value="' + layoutType + '"]').prop('checked', true);
	}

	if(layoutType > 0){
		customLayoutClass = 'customlayout' + layoutType;
	}

	// クッキーに記憶
	var expires = 86400 * 1000 * 90;	// 90日
	CookieManager.set({key:'novellayout', value:layoutType, domain:domain, path:'/', expires:expires});

	// クラスの指定を一度解除
	for(var i = 1; i <=7; i++){
		className = 'customlayout' + i;
		if($body.hasClass(className)){
			$body.removeClass(className);
		}
		if($novelColor.hasClass(className)){
			$novelColor.removeClass(className);
		}
		if($novelContents.hasClass(className)){
			$novelContents.removeClass(className);
		}
		if($novelSubList.hasClass(className)){
			$novelSubList.removeClass(className);
		}
	}

	// カスタムレイアウトを適用
	if(customLayoutClass){
		$body.addClass(customLayoutClass);
		$novelColor.addClass(customLayoutClass);
		$novelContents.addClass(customLayoutClass);
		$novelSubList.addClass(customLayoutClass);
	}

}

// 小説メニューバーの振る舞いを変更
function changeMenuBar(fixMenuBar){

	// novel_headerエレメントを取得
	var $element = $('#novel_header');
	if(!$element.length){
		return false;
	}

	if(isDefined(fixMenuBar)){
		gIsFixMenuBar = fixMenuBar ? true : false;
	}else{
		gIsFixMenuBar = parseInt(CookieManager.get('fix_menu_bar'), 10);
		if(isNaN(gIsFixMenuBar) || (gIsFixMenuBar != 0)){
			gIsFixMenuBar = true;
		}else{
			gIsFixMenuBar = false;
		}
	}

	if(gIsFixMenuBar){
		$('#novel_header,#novelnavi_right,#menu_on,#menu_off').css('position', 'fixed');
		$('input[name="fix_menu_bar"]').prop('checked', true);
	}else{
		$('#novel_header,#novelnavi_right,#menu_on,#menu_off').css('position', 'absolute');
		$('.novelview_navi').css('position', 'fixed');
		$('input[name="fix_menu_bar"]').prop('checked', false);
	}

	// クッキーに記憶
	fixMenuBar = gIsFixMenuBar ? 1 : 0;
	var expires = 86400 * 1000 * 90;	// 90日
	CookieManager.set({key:'fix_menu_bar', value:fixMenuBar, domain:domain, path:'/', expires:expires});

}

// ページの上下に移動するスクローラを追加
function addPageScroller(){

	// ページ上部に移動
	var $pageTop = $('#pageTop');
	if($pageTop.length){
		$pageTop.hide();

		// ウィンドウのスクロールが発生した時
		$(window).scroll(function(event){
			if($(this).scrollTop() > 200){
				$pageTop.fadeIn();
			}else{
				$pageTop.fadeOut();
			}
		});

		// ボタンが押された時
		$pageTop.click(function(event){
			$('html,body').animate({scrollTop:0}, 500);
			return event.preventDefault();
		});
	}

	// ページ下部に移動
	var $pageBottom = $('#pageBottom');
	if($pageBottom.length){
		// ウィンドウのスクロールが発生した時
		$(window).scroll(function(event){
			if($(this).scrollTop() > 200){
				$pageBottom.fadeOut();
			}else{
				$pageBottom.fadeIn();
			}
		});

		// ボタンが押された時
		$pageBottom.click(function(event){
			$('html,body').animate({scrollTop:$('body').height()}, 500);
			return event.preventDefault();
		});
	}

}

// 仮想スクロールハンドラ
function virtualScrollHandler(event){

	// デフォルトのイベントを無効化
	event.preventDefault();

	if(!event.originalEvent.deltaY){
		return false;
	}

	var scrollTo = $(this).scrollLeft() - event.originalEvent.deltaY;
	if(scrollTo < 0){
		scrollTo = 0;
	}
	$(this).scrollLeft(scrollTo);

}
