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

type DBJson struct {
	Url string
	Title string
	NumParts int
	Author [2]string
	Episodes map[int]*episodeRow
}

func (db *DBJson)LoadDB(fp string)error {
	file, err := os.Open(fp)
	if err != nil {
		return errors.Wrap(err, "DBLoader", "ERROR")
	}
	decoder := json.NewDecoder(file)
	if err := decoder.Decode(db); err != nil {
		return errors.Wrap(err, "DBLoader", "ERROR")
	}
	return nil
}

func (db *DBJson)SaveDB(fp string)error {
	file, err := os.Open(fp)
	if err != nil {
		return errors.Wrap(err, "DBSaver", "ERROR")
	}
	encoder := json.NewEncoder(file)
	encoder.SetIndent("","\t")
	if err := encoder.Encode(db); err != nil {
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

func GenDB(nd Downloader)*DBJson{
	ni := nd.Info()
	return &DBJson{Url: ni.IndexUrl.String(), Title: ni.Title, NumParts: ni.NumParts, Author: ni.Author, Episodes: ni.Episodes}
}

func GenDBWithData(nd Downloader, dbData map[int]*episodeRow)*DBJson{
	db := GenDB(nd)
	for k, v := range db.Episodes {
		dbData[k] = v
	}
	db.Episodes = dbData
	return db
}