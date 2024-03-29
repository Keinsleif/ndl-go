package network

import (
	"time"
	"net"
	"net/http"
	"github.com/Keinsleif/ndl-go/pkg/env"
	"github.com/Keinsleif/ndl-go/pkg/errors"
)

type HttpSession struct {
	Headers map[string]string
	Cookies map[string]string
	Timeout [2]float64
	Retries int
	Client  *http.Client
}

func NewHttpSession(o *env.HttpOption) *HttpSession{
	s := HttpSession{Headers:o.Headers,Cookies:map[string]string{},Timeout:o.Timeout,Retries: o.Retries}
	s.InitClient()
	return &s
}

func (se *HttpSession)InitClient(){
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

func (se *HttpSession)Request(url string) (*http.Response,error){
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, errors.Wrap(err,"HttpSession","ERROR")
	}
	for k, v := range se.Headers {
		req.Header.Add(k, v)
	}
	for k, v := range se.Cookies {
		req.AddCookie(&http.Cookie{Name:k,Value:v})
	}
	resp, err := se.Client.Do(req)
	if err != nil {
		return nil, errors.Wrap(err,"HttpSession","ERROR")
	}
	return resp, nil
}
