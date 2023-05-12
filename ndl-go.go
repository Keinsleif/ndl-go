package main

import (
	"fmt"
	"github.com/kazuto28/ndl-go/pkg/env"
	ndl "github.com/kazuto28/ndl-go/pkg/downloader"
)

func main() {
	e := env.MkEnv()
	fmt.Println("Hello, Go")
	for e.Src.HasNext {
		r, err := ndl.MatchSrc(e.Src.Current,*e.Http)
		fmt.Printf("%+v\n", r)
		fmt.Printf("%+v\n", err)
		e.Src.Next()
	}
	fmt.Printf("%+v\n", e)
}
