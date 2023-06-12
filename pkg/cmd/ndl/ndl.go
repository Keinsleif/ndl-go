package ndl

import (
	// "context" //TODO
	"github.com/Keinsleif/ndl-go/pkg/downloader"
	"github.com/Keinsleif/ndl-go/pkg/env"
	"github.com/Keinsleif/ndl-go/pkg/errors"
	"github.com/Keinsleif/ndl-go/pkg/formatter"
)


func NovelDownloader()error{
	// ctx := context.Background() //TODO
	e, err := env.MkEnv()
	if err!=nil{
		return errors.Wrap(err, "Main", "ERROR")
	}

	for e.Src.HasNext {
		nd, err := downloader.GetND(e.Src.Current,*e)
		if err != nil {
			return errors.Wrap(err,"Main","ERROR")
		}
		err = nd.IE()
		if err != nil {
			return errors.Wrap(err,"Main","ERROR")
		}
		err = nd.NE()
		if err != nil {
			return errors.Wrap(err,"Main","ERROR")
		}
		err = formatter.NF(nd.Data(),e)
		if err != nil {
			return errors.Wrap(err,"Main","ERROR")
		}
		e.Src.Next()
	}
	return nil
}