VERSION:=$(shell cat VERSION)
REVISION:=$(shell git rev-parse --short HEAD)

BINDIR:=bin
ROOT_PACKAGE:=$(shell go list .)
COMMAND_PACKAGES:=$(shell go list ./cmd/...)

BINARIES:=$(COMMAND_PACKAGES:$(ROOT_PACKAGE)/cmd/%=$(BINDIR)/%)

GO_FILES:=$(shell find . -type f -name '*.go' -print)

.PHONY: build
build: $(BINARIES)

# ldflag
GO_LDFLAGS_VERSION:="-X github.com/Keinsleif/ndl-go/pkg/info.VERSION=${VERSION} -X github.com/Keinsleif/ndl-go/pkg/info.REVISION=${REVISION}"
GO_LDFLAGS:=$(GO_LDFLAGS_VERSION)

# 実ビルドタスク
$(BINARIES): $(GO_FILES) VERSION .git/HEAD
	go build -ldflags ${GO_LDFLAGS} -o $@ $(@:$(BINDIR)/%=$(ROOT_PACKAGE)/cmd/%) 