package formatter

func GetNFList()map[string]func()FormattedNovel{
	return map[string]func()FormattedNovel{}
}

type FormattedNovel struct {
	Index string
	Episodes map[int]string
}