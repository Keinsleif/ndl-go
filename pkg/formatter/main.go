package formatter

import (
	"embed"
	ndl "github.com/kazuto28/ndl-go/pkg/downloader"
)

type ConfigJson struct {
	Medias []string `json:"medias"`
	Loads  struct {
		JS  []string `json:"js"`
		CSS map[string][]string `json:"css"`
	} `json:"loads"`
}

func GetNFList()map[string]func(*ndl.NovelData)*FormattedNovel{
	return map[string]func(*ndl.NovelData)*FormattedNovel{
		"kakuyomu":KakuyomuNF,
	}
}

type FormattedNovel struct {
	Index string
	Episodes map[int]string
	Static embed.FS
}