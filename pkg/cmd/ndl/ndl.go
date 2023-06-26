package ndl

import (
	// "context" //TODO
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
			return err
		}
		err = nd.IE()
		if err != nil {
			return err
		}
		err = nd.NE()
		if err != nil {
			return err
		}
		err = formatter.NF(nd.Data(),e)
		if err != nil {
			return err
		}
		e.Src.Next()
	}
	return nil
}