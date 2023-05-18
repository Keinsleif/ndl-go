package formatter

import (
	"os"
	"embed"
	"strings"
	"strconv"
	"path"
	"path/filepath"
	"text/template"
	"encoding/json"
	"github.com/kazuto28/ndl-go/pkg/env"
	ndl "github.com/kazuto28/ndl-go/pkg/downloader"
)

//go:embed themes/*
var themes embed.FS

type ConfigJson struct {
	Medias []string `json:"medias"`
	Loads  struct {
		JS  []string `json:"js"`
		CSS map[string][]string `json:"css"`
	} `json:"loads"`
}

func NewNameFormatter(ni *ndl.NovelInfo,e *env.Env) *strings.Replacer{
	return strings.NewReplacer("{title}",ni.Title,"{theme}",e.Theme)
}

func GenericNF(nd *ndl.NovelData,e *env.Env) error{
	if e.Theme == "auto"{
		e.Theme = nd.Info.Site
	}
	repl := NewNameFormatter(nd.Info,e)
	destDir := filepath.Join(repl.Replace(e.OutPath), repl.Replace(e.OutFormat))
	err := os.MkdirAll(destDir,os.ModePerm)
	if err!=nil{
		return err
	}
	tmpl := template.New("").Funcs(template.FuncMap{
		"add":func(a,b int)int{return a+b},
		"iter":func(a int)[]int{return make([]int, a)},
	})
	tmpl, err = tmpl.ParseFS(themes,path.Join("themes",e.Theme,"*.html"))
	if err != nil {
		panic(err)
	}
	var conf ConfigJson
	cfp, err := themes.Open(path.Join("themes",e.Theme,"config.json"))
	if err!=nil{
		panic(err)
	}
	dec := json.NewDecoder(cfp)
	if err := dec.Decode(&conf);err!=nil {
		panic(err)
	}
	w, err := os.Create(filepath.Join(destDir,"index.html"))
	if err!=nil {
		return err
	}
	err = tmpl.ExecuteTemplate(w,"index.html",map[string]any{"nd":nd,"config":conf})
	if err != nil {
		return err
	}
	w.Close()
	for part := range nd.Novels {
		w, err := os.Create(filepath.Join(destDir,strconv.Itoa(part)+".html"))
		if err!=nil {
			return err
		}
		err = tmpl.ExecuteTemplate(w,"base.html",map[string]any{"nd":nd,"part":part,"config":conf})
		if err != nil {
			return err
		}
		w.Close()
	}
	return nil
}