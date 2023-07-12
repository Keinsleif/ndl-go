package downloader

import (
	"encoding/json"
	"net/url"
	"os"
	"time"

	"github.com/Keinsleif/ndl-go/pkg/env"
	"github.com/Keinsleif/ndl-go/pkg/errors"
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
	Time [2]time.Time
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
	Site string
}

type NovelData struct {
	Info *NovelInfo
	Novels map[int]novelPart
}

type DB struct {
	Url string
	Title string
	NumParts int
	Author [2]string
	Episodes map[int]*time.Time
}

type dbJson struct {
	Url string `json:"url"`
	Title string `json:"title"`
	NumParts int `json:"num_parts"`
	Author [2]string `json:"author"`
	Episodes map[int]string `json:"epis"`
}

func (db *DB)LoadDB(fp string)error {
	var res dbJson
	file, err := os.Open(fp)
	if err != nil {
		return errors.Wrap(err, "DBLoader", "ERROR")
	}
	decoder := json.NewDecoder(file)
	if err := decoder.Decode(&res); err != nil {
		return errors.Wrap(err, "DBLoader", "ERROR")
	}
	db.Url = res.Url
	db.Title = res.Title
	db.NumParts = res.NumParts
	db.Author = res.Author
	db.Episodes = map[int]*time.Time{}
	loc, _ := time.LoadLocation("Asia/Tokyo")
	for k,v := range res.Episodes {
		t, _ := time.ParseInLocation("2006-01-02T15:04:05+09:00",v,loc)
		db.Episodes[k] = &t
	}
	return nil
}

func (db *DB)SaveDB(fp string)error {
	res := &dbJson{Url: db.Url, Title: db.Title, NumParts: db.NumParts, Author: db.Author, Episodes: map[int]string{}}
	for k, v := range db.Episodes {
		res.Episodes[k] = v.Format("2006-01-02T15:04:05+09:00")
	}
	file, err := os.Open(fp)
	if err != nil {
		return errors.Wrap(err, "DBSaver", "ERROR")
	}
	encoder := json.NewEncoder(file)
	encoder.SetIndent("","\t")
	if err := encoder.Encode(res); err != nil {
		return errors.Wrap(err, "DBSaver", "ERROR")
	}
	return nil
}

type Downloader interface {
	MatchSrc(string) bool
	Init(*env.Env)
	Info() *NovelInfo
	Data() *NovelData
	Mark(int,bool)
	MarkAll(bool)
	GetMarks() map[int]bool
	IE() error
	NE() error
}

func GetND(src string,e env.Env) (Downloader,error){
	if (KakuyomuND{}.MatchSrc(src)) {
		nd := KakuyomuND{}
		nd.Init(&e)
		return &nd, nil
	}else if (NarouND{}.MatchSrc(src)) {
		nd := NarouND{}
		nd.Init(&e)
		return &nd, nil
	}
	return nil, errors.New("Main","Matching source: unsupported","WARN")
}

func GenDB(nd Downloader)*DB{
	ni := nd.Info()
	db := DB{Url: ni.IndexUrl.String(), Title: ni.Title, NumParts: ni.NumParts, Author: ni.Author, Episodes: map[int]*time.Time{}}
}

func GenDBWithData(nd Downloader, dbData map[int]*time.Time)*DB{
	db := GenDB(nd)
	for k, v := range db.Episodes {
		dbData[k] = v
	}
	db.Episodes = dbData
	return db
}