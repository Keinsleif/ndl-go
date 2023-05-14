package formatter

import (
	"embed"
	ndl "github.com/kazuto28/ndl-go/pkg/downloader"
)

func GetNFList()map[string]func(*ndl.NovelData)*FormattedNovel{
	return map[string]func(*ndl.NovelData)*FormattedNovel{
		"kakuyomu":KakuyomuNF,
	}
}

type FormattedNovel struct {
	Index string
	Episodes map[int]string
}