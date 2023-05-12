package util

import (
	"os"
	"os/user"
	"path/filepath"
	"runtime"
	"strings"
	"github.com/kazuto28/ndl-go/pkg/info"
)

func GetConfigPath() [2]string {
	var path string
	switch runtime.GOOS {
	case "windows":
		path = os.Getenv("APPDATA")
	case "linux":
		path = filepath.Join(os.Getenv("HOME"), ".config")
	case "darwin":
		path = filepath.Join(os.Getenv("HOME"), "Library", "Application Support")
	}

	path = filepath.Join(path, strings.ToLower(info.APPFAM))
	if f, err := os.Stat(path); os.IsNotExist(err) || !f.IsDir() {
		os.MkdirAll(filepath.Join(path, "themes"), os.ModePerm)
	}
	confpath := filepath.Join(path, "settings.json")
	if f, err := os.Stat(confpath); os.IsNotExist(err) || f.IsDir() {
		f, err := os.Create(confpath)
		if err != nil {
			panic(err) // TODO
		}
		f.Close()
	}
	return [2]string{path, confpath}
}

func CleanPath(p string) (string,error) {
	path := filepath.Clean(p)
	path = os.ExpandEnv(path)
	if path[0:1] == "~" {
		usr, err := user.Current()
		if err != nil {
			return "", err // TODO
		}
		path = usr.HomeDir + path[1:]
	}
	return path, nil
}
