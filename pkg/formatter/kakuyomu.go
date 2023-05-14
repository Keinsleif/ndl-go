package formatter

import (
	"embed"
	ndl "github.com/kazuto28/ndl-go/pkg/downloader"
)

//go:embed themes/kakuyomu/*.html
var themes embed.FS

//go:embed themes/kakuyomu/static/*
var static embed.FS

//go:embed themes/kakuyomu/config.json
var config []byte

func KakuyomuNF(nd *ndl.NovelData) *FormattedNovel {
	return &FormattedNovel{Static:static}
}
