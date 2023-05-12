//go:build ignore
// +build ignore

package main

import (
	"fmt"
	"github.com/kazuto28/ndl-go/pkg/env"
	nd "github.com/kazuto28/ndl-go/pkg/downloader"
	"github.com/kazuto28/ndl-go/pkg/errors"
	"github.com/kazuto28/ndl-go/pkg/network"
)

func Must(n any, err any) any {
	return n
}

func main() {
	tes2()
}

func tes2() {
	r,e := nd.MatchSrc("https://test",env.HttpOption{Timeout: [2]float64{10, 10}, Headers: map[string]string{"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36", "Aho": "yes"}})
	if e!=nil {
		fmt.Println(e)
		fmt.Println(e.(*errors.NovelDLError).FormatStacktrace())
	}
	fmt.Println(r)
}

func tes1() {
	se := network.NewSession(env.HttpOption{Timeout: [2]float64{10, 10}, Headers: map[string]string{"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36", "Aho": "yes"}})
	_, err := se.Request("https://works/1177354054894722551")
	if err != nil {
		v := errors.WrapWithData(err, "KakuyomuND", err.Error(), "DEBUG")
		fmt.Println(v.Error())
		fmt.Println(v.FormatStacktrace())
		t := errors.New("NarouND", "test error", "DEBUG")
		fmt.Println(t.Error())
		fmt.Println(t.FormatStacktrace())
	}
	// defer resp.Body.Close()

}
