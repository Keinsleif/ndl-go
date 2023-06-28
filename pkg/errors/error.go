package errors

import (
	"fmt"
	"runtime"
	"strings"
)

var ERROR_LEVELS = map[string]int{
	"DEBUG": 0,
	"INFO": 1,
	"WARN": 2,
	"ERROR": 3,
	"CRITICAL": 4,
}

type NovelDLError struct {
	err    error
	msg string
	class string
	Level string
	LevelNum int
	ReturnCode int
	Stack *runtime.Frames
}

func (e *NovelDLError)Error() string {
	var txt string
	if e.class == "" {
		txt = e.msg
	}else {
		switch (e.Level){
		case "DEBUG":
			txt = "\u001b[32m[DEBUG]\u001b[0m"
		case "INFO":
			txt = "\u001b[36m[INFO]\u001b[0m"
		case "WARN":
			txt = "\u001b[33m[WARN]\u001b[0m"
		case "ERROR":
			txt = "\u001b[31m[ERROR]\u001b[0m"
		case "CRITICAL":
			txt = "\u001b[32m[CRITICAL]"
		}
		txt += fmt.Sprintf("[%s] %s",e.class,e.msg)
	}
	return txt
}

func (e *NovelDLError)UnWrap() error {
	return e.err
}

func (e *NovelDLError)FormatStacktrace() string{
	var (
		more = true
		// r = ""
		v runtime.Frame
	)
	l := []string{}
	for more {
		v, more = e.Stack.Next()
		l=append(l,fmt.Sprintf("%s()\n    %s:%d",v.Function,v.File,v.Line))
	}
	return strings.Join(l,"\n")
}

func (e *NovelDLError)SetReturnCode(c int) *NovelDLError{
	e.ReturnCode = c
	return e
}

func New(cls, msg, level string) *NovelDLError{
	return &NovelDLError{err:nil,class:cls,msg:msg,Level:level,LevelNum: ERROR_LEVELS[level],Stack:getStacktrace(3),ReturnCode:1}
}

func Wrap(err error,class,level string) *NovelDLError{
	return wrap(err,class,err.Error(),level)
}

func WrapPointer(err *error,class,level string) {
	if *err != nil {
		*err = wrap(*err,class,(*err).Error(),level)
	}
}

func WrapWithMsg(err error,class, level, msg string) *NovelDLError{
	return wrap(err, class, msg, level)
}

func wrap(err error,class, msg, level string) *NovelDLError{
	switch v := err.(type){
	case *NovelDLError:
		return v
	default:
		return &NovelDLError{err:err,class:class,msg:msg,Level:level,LevelNum: ERROR_LEVELS[level],Stack:getStacktrace(4),ReturnCode:1}
	}
}

func getStacktrace(num int) *runtime.Frames{
	pc := make([]uintptr,32)
	n := runtime.Callers(num,pc)
	if n==0 {
		return &runtime.Frames{}
	}
	pc = pc[:n-2]

	frames := runtime.CallersFrames(pc)
	return frames
}