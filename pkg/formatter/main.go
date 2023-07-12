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
	"github.com/Keinsleif/ndl-go/pkg/env"
	"github.com/Keinsleif/ndl-go/pkg/errors"
	"github.com/Keinsleif/ndl-go/pkg/util"
	ndl "github.com/Keinsleif/ndl-go/pkg/downloader"
	"golang.org/x/exp/slices"
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

func newNameFormatter(ni *ndl.NovelInfo,e *env.Env) *strings.Replacer{
	return strings.NewReplacer("{title}",ni.Title,"{theme}",e.Theme)
}

func GetNovelDir(ni *ndl.NovelInfo,e *env.Env)(string, error){
	repl := newNameFormatter(ni,e)
	fpth := filepath.Join(repl.Replace(e.OutPath), repl.Replace(e.OutFormat))
	fpth, err := util.CleanPath(fpth)
	if err != nil {
		return fpth, errors.Wrap(err,"NameFormatter","ERROR")
	}
	return fpth, nil
}

func NF(nd *ndl.NovelData,e *env.Env) error{
	var genericThemes = []string{"kakuyomu","narou"}
	if e.Theme == "auto"{
		e.Theme = nd.Info.Site
	}
	if slices.Contains(genericThemes,e.Theme){
		return GenericNF(nd,e)
	}else {
		return errors.New("NovelFormatter","Theme is unsupported.","ERROR")
	}
}

func GenericNF(nd *ndl.NovelData,e *env.Env) error{
	destDir, err := GetNovelDir(nd.Info,e)
	if err!=nil {
		return errors.Wrap(err,"GenericNF","ERROR")
	}
	err = os.MkdirAll(destDir,os.ModePerm)
	if err!=nil{
		return errors.Wrap(err,"GenericNF","ERROR")
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
		return errors.Wrap(err,"GenericNF","ERROR")
	}
	err = tmpl.ExecuteTemplate(w,"index.html",map[string]any{"nd":nd,"config":conf})
	if err != nil {
		return errors.Wrap(err,"GenericNF","ERROR")
	}
	w.Close()
	for part := range nd.Novels {
		w, err := os.Create(filepath.Join(destDir,strconv.Itoa(part)+".html"))
		if err!=nil {
			return errors.Wrap(err,"GenericNF","ERROR")
		}
		err = tmpl.ExecuteTemplate(w,"base.html",map[string]any{"nd":nd,"part":part,"config":conf})
		if err != nil {
			return errors.Wrap(err,"GenericNF","ERROR")
		}
		w.Close()
	}
	err = util.CopyEmbedDir(path.Join("themes",e.Theme,"static"),filepath.Join(destDir,"static"),themes)
	if err!=nil{
		return errors.Wrap(err,"GenericNF","ERROR")
	}
	return nil
}