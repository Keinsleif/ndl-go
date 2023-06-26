package main

import (
	"os"
	"fmt"
	"github.com/Keinsleif/ndl-go/pkg/cmd/ndl"
)

func main() {
	err := ndl.NovelDownloader()
	if err != nil {
		fmt.Fprintln(os.Stderr,err.Error())
	}
}