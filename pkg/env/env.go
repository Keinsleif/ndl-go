package env

import (
	"encoding/json"
	"os"
	flags "github.com/jessevdk/go-flags"
	"github.com/kazuto28/ndl-go/pkg/errors"
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
	StdOut      bool
	LogOut      bool
	Delay       float64
	Episode     int
	Src         *MultipleSrc
	Theme       string
	IsQuiet     bool
	IsFromFile  bool
	IsRenew     bool
	Http        *HttpOption
	OutPath     string
	OutFormat   string
	Thread      int
}

type HttpOption struct {
	Headers map[string]string
	Timeout [2]float64
	Retries int
}

func (ho HttpOption) Copy() *HttpOption{
	nho := ho
	nho.Headers = make(map[string]string)
	for k,v := range ho.Headers {
		nho.Headers[k]=v
	}
	return &nho
}

// Env constructor
func MkEnv() (*Env,error) {
	var e Env
	o,err := ParseOptions()
	if err!=nil{
		return &e, errors.Wrap(err, "EnvManager","ERROR")
	}
	c, err := ParseConfig(o.General.ConfigFile)
	if err != nil {
		return &e, errors.Wrap(err,"EnvManager","ERROR")
	}
	e.Src = MkMultipleSrc(o.Args.Source)
	if o.General.IsQuiet {
		e.StdOut = false
	}
	e.LogOut = false
	if o.Formatter.Theme=="" {
		e.Theme = c.DefaultTheme
	} else {
		e.Theme = o.Formatter.Theme
	}
	e.IsRenew = o.Formatter.IsRenew
	if o.Downloader.IsAxel {
		e.Delay = c.MinDelay
	} else {
		e.Delay = c.DefaultDelay
	}
	e.Http = &HttpOption{Headers: c.Headers, Timeout: c.Timeout, Retries: c.Retries}
	if o.Output.Name==""{
		e.OutFormat = c.OutputFormat
	} else{
		e.OutFormat = o.Output.Name
	}
	if o.Output.Dir==""{
		e.OutPath = c.OutputPath
	} else{
		e.OutPath = o.Output.Dir
	}
	e.Thread = c.Thread+1
	return &e, nil
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

type outputOptions struct {
	Name string `short:"n" long:"name" default:"" description:"set name of output directory/file"`
	Dir  string `short:"d" long:"dir" default:"" description:"set path of output directory"`
}

type positionalOptions struct {
	Source []string `required:"yes"`
}

type Option struct {
	General    generalOptions    `group:"General Options"`
	Downloader downloaderOptions `group:"Downloader Options"`
	Formatter  formatterOptions  `group:"Formatter Options"`
	Output     outputOptions     `group:"Output Options"`
	Args       positionalOptions `positional-args:"yes"`
}

func ParseOptions() (*Option, error) {
	opts := Option{
		General:    generalOptions{Version: false, IsQuiet: false, ConfigFile: util.GetConfigPath()[1]},
		Downloader: downloaderOptions{IsAxel: false, IsFromFile: false, IsUpdate: false},
		Formatter:  formatterOptions{Theme: "", IsRenew: false},
		Output:     outputOptions{Name:"",Dir:""},
		Args:       positionalOptions{},
	}
	parser := flags.NewParser(&opts, flags.HelpFlag | flags.PassDoubleDash)
	parser.Name = "ndl-go"
	_, err := parser.Parse()
	if err != nil {
		if e, ok := err.(*flags.Error); ok && e.Type == flags.ErrHelp {
			// parser.WriteHelp(os.Stdout)
			return &opts, errors.Wrap(err,"","INFO").SetReturnCode(0)
		}
		return &opts, errors.Wrap(err,"OptionParser","ERROR")
	}
	return &opts, nil
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
	Thread        int               `json:"thread"`
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
		Thread:        1,
	}
	return &c
}

func ParseConfig(fileName string) (*Config, error) {
	var c Config
	fp, err := util.CleanPath(fileName)
	if err != nil {
		return &c, errors.Wrap(err,"ConfigLoader","ERROR")
	}
	file, err := os.Open(fp)
	if err != nil {
		return &c, errors.Wrap(err,"ConfigLoader","ERROR")
	}
	defer file.Close()

	decoder := json.NewDecoder(file)
	err = decoder.Decode(&c)
	if err != nil {
		return &c, errors.Wrap(err,"ConfigLoader","ERROR")
	}
	return &c, nil
}

func CreateConfig(filePath string, config *Config) error {
	fp,err := util.CleanPath(filePath)
	if err != nil {
		return errors.Wrap(err,"ConfigLoader","WARN")
	}
	file, err := os.Create(fp)
	if err != nil {
		return errors.Wrap(err,"ConfigLoader","WARN")
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	err = encoder.Encode(*config)
	if err != nil {
		return errors.Wrap(err,"ConfigLoader","WARN")
	}
	return nil
}
