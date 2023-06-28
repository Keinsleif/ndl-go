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
	"golang.org/x/sync/errgroup"
)

type NarouND struct {
	Src string
	Session *nm.HttpSession
	info *NovelInfo
	data *NovelData
	mark map[int]bool
	env env.Env
}

func (nd NarouND)MatchSrc(src string)bool{
	u, err := url.Parse(src)
	if err != nil {
		return false
	}
	if u.Host =="ncode.syosetu.com" || u.Host == "novel18.syosetu.com" {
		if rs, _ := regexp.MatchString(`/(n[0-9a-zA-Z]+)`,u.Path);rs {
			return true
		}
	}
	return false
}

func (nd *NarouND)Init(e *env.Env){
	hop := e.Http.Copy()
	if _,ok := hop.Headers["User-Agent"]; !ok {
		hop.Headers["User-Agent"]="Mozilla/5.0 (X11; Linux x86_64; rv:61.0) Gecko/20100101 Firefox/61.0"
	}
	sess := nm.NewHttpSession(hop)
	if _, ok := sess.Cookies["over18"]; !ok {
		sess.Cookies["over18"] = "yes"
	}
	nd.Src = e.Src.Current
	nd.Session = sess
	nd.env = *e
}

func (nd *NarouND)Info() *NovelInfo{
	return nd.info
}

func (nd *NarouND)Data() *NovelData{
	return nd.data
}

func (nd *NarouND)Mark(n int,m bool) {
	if 0 < n && n <= nd.info.NumParts {
		nd.mark[n] = m
	}
}

func (nd *NarouND)MarkAll(m bool) {
	if nd.info.Type == "serial" {
		nd.mark = make(map[int]bool,nd.info.NumParts)
		for i := 1; i <= nd.info.NumParts; i++ {
			nd.mark[i] = m
		}
	} else {
		nd.mark = map[int]bool{1:m}
	}
}

func (nd *NarouND)IE() error{
	ni := NovelInfo{Site:"narou"}
	reg := regexp.MustCompile(`/(n[0-9a-zA-Z]+)`)
	u,_ := url.Parse(nd.Src)
	ni.IndexUrl = url.URL{
		Scheme: u.Scheme,
		Host: u.Host,
		Path: reg.FindString(nd.Src),
	}
	resp, err := nd.Session.Request(ni.IndexUrl.String())
	if err != nil {
		return errors.Wrap(err,"NarouND","ERROR")
	}
	defer resp.Body.Close()
	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return errors.Wrap(err,"NarouND","ERROR")
	}
	if doc.Find(".maintenance-container").Length() != 0 {
		return errors.New("NarouND", "Narou is under maintainance","ERROR")
	}
	if doc.Find(".nothing").Length() != 0 {
		return errors.New("NarouND", "Novel not found: "+doc.Find(".nothing").Text(),"ERROR")
	}
	indexRaw := doc.Find(".index_box").First()
	if indexRaw.Length()==0{
		ni.NumParts = 1
		ni.Type = "short"
	}else {
		ni.NumParts = indexRaw.Find(".novel_sublist2").Length()
		ni.Type = "serial"
	}
	ad := doc.Find(".novel_writername")
	if ad.Find("a").Length()==0 {
		ni.Author = [2]string{strings.TrimSpace(ad.Text())[3:],""}
	}else {
		aurl := ni.IndexUrl
		aurl.Path, _ = ad.Find("a").Attr("href")
		ni.Author = [2]string{strings.TrimSpace(ad.Text())[3:],aurl.String()}
	}
	ni.Title = doc.Find(".novel_title").First().Text()
	ni.Description, _ = doc.Find("#novel_ex").First().Html()
	c := ""
	cid := 1
	part := 1
	loc, _ := time.LoadLocation("Asia/Tokyo")
	ni.Episodes = make(map[int]*episodeRow)
	indexRaw.Find("dl").Each(func(i int,s *goquery.Selection){
		cls := s.AttrOr("class","")
		if cls == "novel_sublist2"{
			ts := s.Find("dt")
			var t1,t2 time.Time
			if s.Find("span").Length()!=0 {
				t2, _ = time.ParseInLocation("2006/01/02 15:04 改稿",ts.Find("span").AttrOr("title","2006/01/02 15:04 改稿"),loc)
				t1, _ = time.ParseInLocation("2006/01/02 15:04（改）",strings.TrimSpace(ts.Text()),loc)
			} else {
				t1, _ = time.ParseInLocation("2006/01/02 15:04",strings.TrimSpace(ts.Text()),loc)
				t2 = t1
			}
			burl := ni.IndexUrl
			burl.Path = s.Find("a").AttrOr("href","")
			er := &episodeRow{Type:"episode",Part:part,Title:s.Find("a").Text(),Time:[2]time.Time{t1,t2},Chapter:c,Url:burl.String()}
			ni.Index = append(ni.Index,er)
			ni.Episodes[part] = er
			part++
		}else if cls == "chapter_title" {
			c=s.Text()
			ni.Index = append(ni.Index,&chapterRow{Type:"chapter",Title:c,Id:cid})
			cid++
		}
	})
	if ni.Type == "short" {
		ni.Episodes[1]=&episodeRow{Type:"episode",Part:1,Title:ni.Title,Time:[2]time.Time{},Chapter:"",Url:ni.IndexUrl.String()}
	}
	nd.info = &ni
	nd.MarkAll(true)
	return nil
}

func (nd *NarouND)NE() error{
	eg, ctx := errgroup.WithContext(context.Background())
	eg.SetLimit(nd.env.Thread)
	var ne NovelData
	ne.Info = nd.info
	if nd.info.Type == "serial" {
		ne.Novels = make(map[int]novelPart,nd.info.NumParts)
	} else {
		ne.Novels = make(map[int]novelPart,1)
	}
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

func (nd *NarouND)fetchPart(k int)error{
	resp, err := nd.Session.Request(nd.info.Episodes[k].Url)
	if err != nil {
		return errors.Wrap(err,"NarouND","ERROR")
	}
	defer resp.Body.Close()
	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return errors.Wrap(err,"NarouND","ERROR")
	}
	var novs novelPart
	novs.Title = doc.Find(".novel_subtitle").Text()
	doc.Find("#novel_honbun > p").Each(func(i int,s *goquery.Selection){
		t, _ := s.Html()
		novs.Body = append(novs.Body, t)
	})
	nd.data.Novels[k]=novs
	return nil
}
