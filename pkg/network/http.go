package network

import (
	"time"
	"net"
	"net/http"
	"github.com/kazuto28/ndl-go/pkg/env"
)

type Session struct {
	Headers map[string]string
	Cookies map[string]string
	Timeout [2]float64
	Retries int
	Client  *http.Client
}

func NewSession(o env.HttpOption) *Session{
	s := Session{Headers:o.Headers,Timeout:o.Timeout,Retries: o.Retries}
	s.InitClient()
	return &s
}

func (se *Session)InitClient(){
	client := &http.Client{
		Transport: &http.Transport{
			Dial: (&net.Dialer{
				Timeout: time.Duration(se.Timeout[0] * float64(time.Second)),
			}).Dial,
		},
		Timeout: time.Duration(se.Timeout[1] * float64(time.Second)),
	}
	se.Client = client
}

func (se *Session)Request(url string) (*http.Response,error){
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err // TODO
	}
	for k, v := range se.Headers {
		req.Header.Add(k, v)
	}
	for k, v := range se.Cookies {
		req.AddCookie(&http.Cookie{Name:k,Value:v})
	}
	resp, err := se.Client.Do(req)
	if err != nil {
		return nil, err // TODO
	}
	return resp, nil
}
