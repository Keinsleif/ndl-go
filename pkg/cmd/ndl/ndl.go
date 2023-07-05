package ndl

import (
	// "context" //TODO
	"fmt"
	"os"
	"github.com/Keinsleif/ndl-go/pkg/downloader"
	"github.com/Keinsleif/ndl-go/pkg/env"
	"github.com/Keinsleif/ndl-go/pkg/errors"
	"github.com/Keinsleif/ndl-go/pkg/formatter"
)


func NovelDownloader()(err error){
	defer errors.WrapPointer(&err,"Main","ERROR")
	// ctx := context.Background() //TODO
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