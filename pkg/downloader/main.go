package downloader

import (
	"time"
	"net/url"
	"github.com/kazuto28/ndl-go/pkg/errors"
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
	Title string
	Body []string
}

type NovelInfo struct {
	Title string
	Description string
	Author [2]string
	Type string
	NumParts int
	Index []any
	Episodes map[int]*episodeRow
	IndexUrl url.URL
}

type NovelData struct {
	Info *NovelInfo
	Novels map[int]novelPart
}

type NovelDownloader interface {
	MatchSrc(string) bool
	Init(*env.Env)
	Info() *NovelInfo
	Data() *NovelData
	Mark(int,bool)
	MarkAll(bool)
	IE() error
	NE() error
}

func GetND(src string,e env.Env) (NovelDownloader,error){
	if (KakuyomuND{}.MatchSrc(src)) {
		var nd KakuyomuND
		nd.Init(&e)
		return &nd, nil
	}
	return nil, errors.New("Main","Matching source: unsupported","WARN")
}
