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
	tmpl, err := template.ParseFS(themes,"*.html")
	tmpl = tmpl.Funcs(template.FuncMap{
		"add":func(a,b int)int{return a+b},
		"iter":func(a int)[]int{return make([]int, a)},
	})
	if err != nil {
		panic(err)
	}
	var conf configJson
	if err := json.Unmarshal(configByte,conf);err!=nil {
		panic(err)
	}
	var w bytes.Buffer
	tmpl.ExecuteTemplate(&w,"index",nd)
	fn.Index = w.String()
	for part,_ := range nd.Novels {
		var w bytes.Buffer
		tmpl.ExecuteTemplate(&w,"base",map[string]any{"nd":nd,"part":part,"config":conf})
		fn.Episodes[part]= w.String()
	}
	return &fn
}

