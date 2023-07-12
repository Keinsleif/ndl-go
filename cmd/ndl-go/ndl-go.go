package main

import (
	"fmt"
	"os"
	"os/signal"

	"github.com/Keinsleif/ndl-go/pkg/cmd/ndl"
	"github.com/Keinsleif/ndl-go/pkg/errors"
)

func main() {
	c := make(chan os.Signal, 1)
	signal.Notify(c,os.Interrupt)
	go func() {
		<-c
		err := errors.New("Main","Operation was cancelled by user","ERROR")
		fmt.Fprintln(os.Stderr,err.Error())
		os.Exit(1)
	}()

	err := ndl.NovelDownloader()
	if err != nil {
		fmt.Fprintln(os.Stderr,err.Error())
	}
}