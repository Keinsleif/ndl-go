package formatter

import (
	"bytes"
	"embed"
	"encoding/json"
	"text/template"
	ndl "github.com/kazuto28/ndl-go/pkg/downloader"
)

//go:embed themes/kakuyomu/*.html
var themes embed.FS

//go:embed themes/kakuyomu/static/*
var static embed.FS

//go:embed themes/kakuyomu/config.json
var configByte []byte

type configJson struct {
	Medias []string `json:"medias"`
	Loads  struct {
		JS  []string `json:"js"`
		CSS map[string][]string `json:"css"`
	} `json:"loads"`
}

func KakuyomuNF(nd *ndl.NovelData) *FormattedNovel {
	fn := FormattedNovel{Static:static}
	fn.Episodes = make(map[int]string,len(nd.Novels))
	tmpl := template.New("").Funcs(template.FuncMap{
		"add":func(a,b int)int{return a+b},
		"iter":func(a int)[]int{return make([]int, a)},
	})
	tmpl, err := tmpl.ParseFS(themes,"themes/kakuyomu/*.html")
	if err != nil {
		panic(err)
	}
	var conf configJson
	if err := json.Unmarshal(configByte,&conf);err!=nil {
		panic(err)
	}
	var w bytes.Buffer
	tmpl.ExecuteTemplate(&w,"index.html",nd)
	fn.Index = w.String()
	for part := range nd.Novels {
		var w bytes.Buffer
		tmpl.ExecuteTemplate(&w,"base.html",map[string]any{"nd":nd,"part":part,"config":conf})
		fn.Episodes[part]= w.String()
	}
	return &fn
}

