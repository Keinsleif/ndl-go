package logger

import (
	"fmt"
	"os"
	"github.com/Keinsleif/ndl-go/pkg/errors"
)

var LOG_LEVELS = map[string]int{
	"DEBUG": 0,
	"INFO": 1,
	"WARN": 2,
	"ERROR": 3,
	"CRITICAL":4,
}

type Logger struct {
	Level string
	StdOut *os.File
	ErrOut *os.File
}

func GetStdLogger(level string)*Logger{
	return &Logger{Level: level, StdOut: os.Stdout, ErrOut: os.Stderr}
}

func (l *Logger)Debug(msg string){
	if LOG_LEVELS[l.Level] <= LOG_LEVELS["DEBUG"] {
		fmt.Fprintln(l.StdOut,"\u001b[32m[DEBUG]\u001b[0m"+msg)
	}
}

func (l *Logger)Info(msg string){
	if LOG_LEVELS[l.Level] <= LOG_LEVELS["INFO"] {
		fmt.Fprintln(l.StdOut,"\u001b[36m[INFO]\u001b[0m"+msg)
	}
}

func (l *Logger)WARN(msg string){
	if LOG_LEVELS[l.Level] <= LOG_LEVELS["WARN"] {
		fmt.Fprintln(l.ErrOut,"\u001b[33m[WARN]\u001b[0m"+msg)
	}
}

func (l *Logger)ERROR(msg string){
	if LOG_LEVELS[l.Level] <= LOG_LEVELS["ERROR"] {
		fmt.Fprintln(l.ErrOut,"\u001b[31m[ERROR]\u001b[0m"+msg)
	}
}

func (l *Logger)CRITICAL(msg string){
	if LOG_LEVELS[l.Level] <= LOG_LEVELS["CRITICAL"] {
		fmt.Fprintln(l.ErrOut,"\u001b[31m[CRITICAL]"+msg)
		fmt.Fprintln(l.ErrOut,"\u001b[31mPlease report to developer.")
	}
}

func (l *Logger)LogFromErr(err errors.NovelDLError) {
	switch (err.Level){
	case "WARN":
		l.WARN(err.Error())
	case "ERROR":
		l.ERROR(err.Error())
	case "CRITICAL":
		l.CRITICAL(err.Error())
	}
}