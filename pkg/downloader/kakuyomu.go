package downloader

import (
	"strings"
	"net/url"
	"regexp"
	"time"
	"golang.org/x/exp/slices"
	"github.com/PuerkitoBio/goquery"
	nm "github.com/kazuto28/ndl-go/pkg/network"
	"github.com/kazuto28/ndl-go/pkg/env"
	// "github.com/kazuto28/ndl-go/pkg/errors"
)

type KakuyomuND struct {
	Src string
	Session *nm.Session
	info *NovelInfo
	data *NovelData
}

func (nd KakuyomuND)MatchSrc(src string)bool{
	u, err := url.Parse(src)
	if err != nil {
		return false
	}
	if u.Host =="kakuyomu.jp" {
		if rs, _ := regexp.MatchString(`/works/([0-9]+)`,u.Path);rs {
			return true
		}
	}
	return false
}

func (nd *KakuyomuND)Init(e *env.Env){
	hop := e.Http.Copy()
	if _,ok := hop.Headers["User-Agent"]; !ok {
		hop.Headers["User-Agent"]="Mozilla/5.0 (X11; Linux x86_64; rv:61.0) Gecko/20100101 Firefox/61.0"
	}
	sess := nm.NewSession(hop)
	nd.Src = e.Src.Current
	nd.Session = sess
}

func (nd *KakuyomuND)Info() *NovelInfo{
	return nd.info
}

func (nd *KakuyomuND)Data() *NovelData{
	return nd.data
}

func (nd *KakuyomuND)realIE() error{
	ni := NovelInfo{Type:"serial"}
	reg := regexp.MustCompile(`/works/([0-9]+)`)
	u,_ := url.Parse(nd.Src)
	indexUrl := &url.URL{
		Scheme: u.Scheme,
		Host: "kakuyomu.jp",
		Path: reg.FindString(nd.Src),
	}
	ni.IndexUrl = indexUrl.String()
	resp, err := nd.Session.Request(ni.IndexUrl)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return err
	}
	indexRaw := doc.Find(".widget-toc-items").First()
	ni.NumParts = indexRaw.Find("li.widget-toc-episode").Length()
	ad := doc.Find("#workAuthor-activityName > a")
	ahref, _ := ad.Attr("href")
	ni.Author = [2]string{ad.Text(),ni.IndexUrl+ahref}
	ni.Title = doc.Find("#workTitle").First().Text()
	desc := doc.Find("#introduction").First()
	desc.Find(".ui-truncateTextButton-expandButton").Remove()
	ni.Description = desc.Text()
	c := ""
	cid := 1
	part := 1
	loc, _ := time.LoadLocation("Asia/Tokyo")
	indexRaw.Find("li").Each(func(i int,s *goquery.Selection){
		cls := strings.Split(s.AttrOr("class","")," ")
		if slices.Contains(cls,"widget-toc-episode"){
			ts,_ := s.Find("time").Attr("datetime")
			t, _ := time.ParseInLocation("2006-01-02T15:04:05Z",ts,loc)
			ni.Index = append(ni.Index,episodeRow{Type:"episode",Part:part,Title:s.Find("span").Text(),Time:t,Chapter:c})
			part++
		}else if slices.Contains(cls,"widget-toc-chapter") {
			c=s.Text()
			ni.Index = append(ni.Index,chapterRow{Type:"chapter",Title:c,Id:cid})
			cid++
		}
	})
	nd.info = &ni
	return nil
}

func (nd *KakuyomuND)realNE() error{
	var ne NovelData
	nd.data = &ne
	return nil
}