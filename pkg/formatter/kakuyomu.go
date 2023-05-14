package formatter

import (
	"embed"
	ndl "github.com/kazuto28/ndl-go/pkg/downloader"
)

//go:embed themes/kakuyomu/*
var themes embed.FS

func KakuyomuNF(nd *ndl.NovelData) *FormattedNovel {
	return &FormattedNovel{}
}
