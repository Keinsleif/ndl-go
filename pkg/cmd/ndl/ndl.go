package ndl

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/Keinsleif/ndl-go/pkg/downloader"
	"github.com/Keinsleif/ndl-go/pkg/env"
	"github.com/Keinsleif/ndl-go/pkg/errors"
	"github.com/Keinsleif/ndl-go/pkg/formatter"
)


func NovelDownloader()(err error){
	defer errors.WrapPointer(&err,"Main","ERROR")
	
	e, err := env.MkEnv()
	if err!=nil{
		return err
	}

	for e.Src.HasNext {
		nd, err := downloader.GetND(e.Src.Current,*e)
		if err != nil {
			ndle := errors.Wrap(err,"Main","ERROR")
			if ndle.Level != "WARN" {
				return err
			}else {
				fmt.Fprintln(os.Stderr,ndle.Error())
			}
		}
		err = nd.IE()
		if err != nil {
			ndle := errors.Wrap(err,"Main","ERROR")
			if ndle.Level != "WARN" {
				return err
			}else {
				fmt.Fprintln(os.Stderr,ndle.Error())
			}
		}

		ni := nd.Info()

		ndir, err := formatter.GetNovelDir(ni,e)
		if err != nil {
			return err
		}
		if ni.Type == "serial" && e.Episode == 0 {
			if _, err := os.Stat(filepath.Join(ndir,"static","db.json")); err==nil {
				var db downloader.DB;
				err := db.LoadDB(filepath.Join(ndir,"static","db.json"))
				if err != nil {
					return errors.Wrap(err,"Main","ERROR")
				}
				nd.MarkAll(false)
				if ni.NumParts > db.NumParts {
					for i := ni.NumParts+1; i < db.NumParts+1; i++ {
						nd.Mark(i,true)
					} 
				}

				for k, v := range ni.Episodes {
					dv, ok := db.Episodes[k]
					if !ok {
						nd.Mark(k,true)
					}else if dv.Before(v.Time[1]) {
						nd.Mark(k,true)
					}
				}
			}
		}

		err = nd.NE()
		if err != nil {
			ndle := errors.Wrap(err,"Main","ERROR")
			if ndle.Level != "WARN" {
				return err
			}else {
				fmt.Fprintln(os.Stderr,ndle.Error())
			}
		}
		err = formatter.NF(nd.Data(),e)
		if err != nil {
			ndle := errors.Wrap(err,"Main","ERROR")
			if ndle.Level != "WARN" {
				return err
			}else {
				fmt.Fprintln(os.Stderr,ndle.Error())
			}
		}
		e.Src.Next()
	}
	return nil
}