package downloader

import (
	"context"
	"net/url"
	"regexp"
	"strings"
	"time"
	"github.com/PuerkitoBio/goquery"
	"github.com/Keinsleif/ndl-go/pkg/env"
	"github.com/Keinsleif/ndl-go/pkg/errors"
	nm "github.com/Keinsleif/ndl-go/pkg/network"
	"golang.org/x/exp/slices"
	"golang.org/x/sync/errgroup"
)

type KakuyomuND struct {
	Src string
	Session *nm.HttpSession
	info *NovelInfo
	data *NovelData
	mark map[int]bool
	env env.Env
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
	sess := nm.NewHttpSession(hop)
	nd.Src = e.Src.Current
	nd.Session = sess
	nd.env = *e
}

func (nd *KakuyomuND)Info() *NovelInfo{
	return nd.info
}

func (nd *KakuyomuND)Data() *NovelData{
	return nd.data
}

func (nd *KakuyomuND)Mark(n int,m bool) {
	if 0 < n && n <= nd.info.NumParts {
		nd.mark[n] = m
	}
}

func (nd *KakuyomuND)MarkAll(m bool) {
	nd.mark = make(map[int]bool,nd.info.NumParts)
	for i := 1; i <= nd.info.NumParts; i++ {
		nd.mark[i] = m
	}
}

func (nd *KakuyomuND)IE() error{
	ni := NovelInfo{Type:"serial",Site:"kakuyomu"}
	reg := regexp.MustCompile(`/works/([0-9]+)`)
	u,_ := url.Parse(nd.Src)
	ni.IndexUrl = url.URL{
		Scheme: u.Scheme,
		Host: "kakuyomu.jp",
		Path: reg.FindString(nd.Src),
	}
	resp, err := nd.Session.Request(ni.IndexUrl.String())
	if err != nil {
		return errors.Wrap(err,"KakuyomuND","ERROR")
	}
	defer resp.Body.Close()
	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return errors.Wrap(err,"KakuyomuND","ERROR")
	}
	indexRaw := doc.Find(".widget-toc-items").First()
	ni.NumParts = indexRaw.Find("li.widget-toc-episode").Length()
	ad := doc.Find("#workAuthor-activityName > a")
	aurl := ni.IndexUrl
	aurl.Path, _ = ad.Attr("href")
	ni.Author = [2]string{ad.Text(),aurl.String()}
	ni.Title = doc.Find("#workTitle").First().Text()
	desc := doc.Find("#introduction").First()
	desc.Find(".ui-truncateTextButton-expandButton").Remove()
	ni.Description, _ = desc.Html()
	c := ""
	cid := 1
	part := 1
	loc, _ := time.LoadLocation("Asia/Tokyo")
	ni.Episodes = make(map[int]*episodeRow)
	indexRaw.Find("li").Each(func(i int,s *goquery.Selection){
		cls := strings.Split(s.AttrOr("class","")," ")
		if slices.Contains(cls,"widget-toc-episode"){
			ts := s.Find("time").AttrOr("datetime","2006-01-02T15:04:05Z")
			t, _ := time.ParseInLocation("2006-01-02T15:04:05Z",ts,loc)
			burl := ni.IndexUrl
			burl.Path = s.Find("a").AttrOr("href","")
			er := &episodeRow{Type:"episode",Part:part,Title:s.Find("span").Text(),Time:[2]time.Time{t,t},Chapter:c,Url:burl.String()}
			ni.Index = append(ni.Index,er)
			ni.Episodes[part] = er
			part++
		}else if slices.Contains(cls,"widget-toc-chapter") {
			c=s.Text()
			ni.Index = append(ni.Index,&chapterRow{Type:"chapter",Title:c,Id:cid})
			cid++
		}
	})
	nd.info = &ni
	nd.MarkAll(true)
	return nil
}

func (nd *KakuyomuND)NE() error{
	eg, ctx := errgroup.WithContext(context.TODO())

	eg.SetLimit(nd.env.Thread)
	var ne NovelData
	ne.Info = nd.info
	ne.Novels = make(map[int]novelPart,nd.info.NumParts)
	nd.data = &ne
	for k,v := range nd.mark {
		k := k
		if !v{
			continue
		}
		eg.Go(func()error{
			select {
			case <-ctx.Done():
				return nil
			default:
				return nd.fetchPart(k)
			}
		})
	}
	if err := eg.Wait(); err!=nil{
		return err
	}
	return nil
}

func (nd *KakuyomuND)fetchPart(k int)error{
	resp, err := nd.Session.Request(nd.info.Episodes[k].Url)
	if err != nil {
		return errors.Wrap(err,"KakuyomuND","ERROR")
	}
	defer resp.Body.Close()
	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return errors.Wrap(err,"KakuyomuND","ERROR")
	}
	var novs novelPart
	novs.Title = doc.Find(".widget-episodeTitle").Text()
	doc.Find(".widget-episodeBody > p").Each(func(i int,s *goquery.Selection){
		t, _ := s.Html()
		novs.Body = append(novs.Body, t)
	})
	nd.data.Novels[k]=novs
	return nil
}
