package formatter

import (
	"embed"
)

//go:embed themes/kakuyomu/*
var themes embed.FS

func KakuyomuNF() *FormattedNovel {
	return &FormattedNovel{}
}
