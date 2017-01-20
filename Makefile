TSC = tsc

TS_FILES := $(shell find src -type f -iname '*.ts')
PRELOAD_DIRS := assets
PRELOAD_FILES := $(shell find $(PRELOAD_DIRS) -type f)

.PHONY: all clean watch server

all: js/index.js #js/preload_manifest.js

js/index.js: src/index.ts $(TS_FILES)
	$(TSC) --out $@ $<

js/preload_manifest.js: $(PRELOAD_FILES)
	./scripts/preload_manifest.py $@ . $(PRELOAD_DIRS)

clean:
	-rm -f js/index.js js/preload_manifest.js

watch:
	fswatch -l 0.3 -o src | while read; do make && echo OK; done

server:
	python -m SimpleHTTPServer 8989
