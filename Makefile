TESTS = test/*.test.js
REPORTER = spec
TIMEOUT = 5000
MOCHA_OPTS =
BIN = ./node_modules/.bin

install:
	@npm install

test: install
	@NODE_ENV=test $(BIN)/mocha \
		--bail \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) \
		$(MOCHA_OPTS) \
		$(TESTS)

test-cov:
	@rm -f coverage.html
	@$(MAKE) test \
		MOCHA_OPTS='--require blanket' \
		REPORTER=html-cov \
		> coverage.html
	@$(MAKE) test \
		MOCHA_OPTS='--require blanket' \
		REPORTER=travis-cov

test-coveralls:
	@$(MAKE) test REPORTER=tap
	@$(MAKE) test \
		MOCHA_OPTS='--require blanket' \
		REPORTER=mocha-lcov-reporter \
		| $(BIN)/coveralls

test-all: test test-cov

.PHONY: test test-cov test-coveralls test-all
