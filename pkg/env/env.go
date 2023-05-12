package env

import (
	"encoding/json"
	flags "github.com/jessevdk/go-flags"
	"os"
	"github.com/kazuto28/ndl-go/pkg/util"
)

// Multiple Source manager
type MultipleSrc struct {
	Sources []string
	Current string
	index   int
	length  int
	HasNext bool
}

func (u *MultipleSrc) Next() {
	if u.index < u.length-1 {
		u.index++
		u.Current = u.Sources[u.index]
	} else {
		u.HasNext = false
	}
}

// MultiSrc constructor
func MkMultipleSrc(sources []string) *MultipleSrc {
	return &MultipleSrc{Sources: sources, Current: sources[0], index: 0, length: len(sources), HasNext: true}
}

// Environment data structure
type Env struct {
	THEMES     []string
	StdOut     bool
	LogOut     bool
	Delay      float64
	Episode    int
	Src        *MultipleSrc
	Theme      [2]string
	IsQuiet    bool
	IsFromFile bool
	IsRenew    bool
	Http       *HttpOption
}

type HttpOption struct {
	Headers map[string]string
	Timeout [2]float64
	Retries int
}

// Env constructor
func MkEnv() *Env {
	var e Env
	o := ParseOptions()
	c, err := ParseConfig(o.General.ConfigFile)
	if err != nil {
		panic(err)
	}
	e.Src = MkMultipleSrc(o.Args.Source)
	if o.General.IsQuiet {
		e.StdOut = false
	}
	e.LogOut = false
	e.Theme = [2]string{c.DefaultTheme, "$HOME/.config/novel-dl/themes/dark"}
	e.IsRenew = o.Formatter.IsRenew
	if o.Downloader.IsAxel {
		e.Delay = c.MinDelay
	} else {
		e.Delay = c.DefaultDelay
	}
	e.Http = &HttpOption{Headers: c.Headers, Timeout: c.Timeout, Retries: c.Retries}
	return &e
}

type generalOptions struct {
	Version    bool   `short:"v" long:"version" description:"show program's version number and exit"`
	IsQuiet    bool   `short:"q" long:"quiet" description:"suppress non-messages"`
	ConfigFile string `short:"c" long:"config" description:"specify config file"`
}

type downloaderOptions struct {
	IsAxel     bool `short:"a" long:"axel" description:"turn on axeleration mode"`
	IsFromFile bool `short:"f" long:"from-file" description:"turn on extract from downloaded file/folder"`
	IsUpdate   bool `short:"u" long:"update" description:"fetch & update novels from internet"`
}

type formatterOptions struct {
	Theme   string `short:"t" long:"theme" default:"" description:"set novel's theme"`
	IsRenew bool   `short:"r" long:"renew" description:"force to update all files"`
}

type positionalOptions struct {
	Source []string `required:"yes"`
}

type Option struct {
	General    generalOptions    `group:"General Options"`
	Downloader downloaderOptions `group:"Downloader Options"`
	Formatter  formatterOptions  `group:"Formatter Options"`
	Args       positionalOptions `positional-args:"yes"`
}

func ParseOptions() *Option {
	opts := Option{
		General:    generalOptions{Version: false, IsQuiet: false, ConfigFile: util.GetConfigPath()[1]},
		Downloader: downloaderOptions{IsAxel: false, IsFromFile: false, IsUpdate: false},
		Formatter:  formatterOptions{Theme: "auto", IsRenew: false},
		Args:       positionalOptions{},
	}
	parser := flags.NewParser(&opts, flags.Default)
	parser.Name = "ndl-go"
	_, err := parser.Parse()
	if err != nil {
		if e, ok := err.(*flags.Error); ok && e.Type == flags.ErrHelp {
			os.Exit(0)
		}
		//		panic(err)
		os.Exit(1)
	}
	return &opts
}

type Config struct {
	DefaultTheme  string            `json:"default_theme"`
	ThemePath     []string          `json:"theme_path"`
	DefaultDelay  float64           `json:"default_delay"`
	MinDelay      float64           `json:"min_delay"`
	Retries       int               `json:"retries"`
	Timeout       [2]float64        `json:"timeout"`
	Headers       map[string]string `json:"headers"`
	OutputPath    string            `json:"output_path"`
	OutputFormat  string            `json:"output_format"`
	SymlinkStatic bool              `json:"symlink_static"`
	PreCmd        string            `json:"precmd"`
	PostCmd       string            `json:"postcmd"`
}

func MkConfig() *Config {
	c := Config{
		DefaultTheme:  "auto",
		ThemePath:     []string{},
		DefaultDelay:  1,
		MinDelay:      0.1,
		Retries:       3,
		Timeout:       [2]float64{15, 30},
		Headers:       map[string]string{},
		OutputPath:    ".",
		OutputFormat:  "{title}",
		SymlinkStatic: false,
		PreCmd:        "",
		PostCmd:       "",
	}
	return &c
}

func ParseConfig(fileName string) (*Config, error) {
	var c Config
	fp, err := util.CleanPath(fileName)
	if err != nil {
		return &c, err
	}
	file, err := os.Open(fp)
	if err != nil {
		return &c, err
	}
	defer file.Close()

	decoder := json.NewDecoder(file)
	err = decoder.Decode(&c)
	if err != nil {
		return &c, nil
	}
	return &c, nil
}

func CreateConfig(filePath string, config *Config) error {
	fp,err := util.CleanPath(filePath)
	if err != nil {
		return err
	}
	file, err := os.Create(fp)
	if err != nil {
		return err
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	err = encoder.Encode(*config)
	if err != nil {
		return err
	}
	return nil
}
