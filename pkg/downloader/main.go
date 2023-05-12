package downloader

import (
	"time"
	"net/url"
	"regexp"
	"github.com/kazuto28/ndl-go/pkg/errors"
	nm "github.com/kazuto28/ndl-go/pkg/network"
	"github.com/kazuto28/ndl-go/pkg/env"
)
/*
type indexRow interface {
	chapterRow | episodeRow
}
*/	
type chapterRow struct {
	Type string
	Title string
	Id int
}

type episodeRow struct {
	Type string
	Title string
	Url string
	Chapter string
	Part int
	Time time.Time
}

type novelPart struct {
	SubTitle string
	Body string
}

type NovelInfo struct {
	Title string
	Description string
	Author [2]string
	Type string
	NumParts int
	Index []any
	IndexUrl string
}

type NovelData struct {
	Info NovelInfo
	Novels map[int]novelPart
}

type NovelDownloader interface {
	realIE() error
	realNE() error
}

func IE(nd NovelDownloader){
	nd.realIE()
}

func MatchSrc(src string,no env.HttpOption) (NovelDownloader,error){
	u, err := url.Parse(src)
	if err != nil {
		return nil, errors.WrapWithData(err,"Main","Matching source: "+err.Error(),"WARN")
	}
	if u.Host =="kakuyomu.jp" {
		sess := nm.NewSession(no)
		if rs, _ := regexp.MatchString(`/works/([0-9]+)`,u.Path);rs {
			nd := KakuyomuND{Src:src,Session: sess}
			return &nd, nil
		}
	}
	return nil, errors.New("Main","Matching source: unsupported","WARN")
}
