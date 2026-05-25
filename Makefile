# Bucket policy generator
#
#   make install   — venv + dependencies
#   make serve     — local dev server
#   make deploy    — TUI wizard → S3
#   make assets    — download fonts + aws4fetch

ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
VENV := $(ROOT)/.venv
PY := $(VENV)/bin/python
PORT ?= 8080

.PHONY: help install serve dev deploy deploy-quick fix-mime fix-mime-quick assets

help:
	@echo "Bucket policy generator"
	@echo ""
	@echo "  make install       venv + pip install -r requirements.txt"
	@echo "  make serve         http://localhost:$(PORT)  (python server.py)"
	@echo "  make deploy        TUI wizard — upload to S3"
	@echo "  make fix-mime      TUI wizard — fix Content-Type"
	@echo "  make assets        download fonts and aws4fetch"
	@echo ""
	@echo "  make deploy-quick  non-interactive (needs S3_* env or .deploy.env + secret in env)"
	@echo ""
	@echo "See DEPLOY.md and README.md"

$(VENV)/bin/python: requirements.txt
	@test -d "$(VENV)" || python3 -m venv "$(VENV)"
	"$(VENV)/bin/pip" install -q -r requirements.txt
	@touch "$(VENV)/bin/python"

install: $(VENV)/bin/python
	@echo "Ready: $(PY)"

serve dev: $(VENV)/bin/python
	PORT=$(PORT) "$(PY)" "$(ROOT)/server.py"

assets: $(VENV)/bin/python
	"$(PY)" -m deploy assets

deploy: $(VENV)/bin/python
	"$(PY)" -m deploy wizard deploy

fix-mime: $(VENV)/bin/python
	"$(PY)" -m deploy wizard fix-mime

deploy-quick: $(VENV)/bin/python
	@set -a; [ -f "$(ROOT)/.deploy.env" ] && . "$(ROOT)/.deploy.env"; set +a; \
	"$(PY)" -m deploy deploy

fix-mime-quick: $(VENV)/bin/python
	@set -a; [ -f "$(ROOT)/.deploy.env" ] && . "$(ROOT)/.deploy.env"; set +a; \
	"$(PY)" -m deploy fix-mime
