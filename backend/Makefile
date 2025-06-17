.PHONY: all binary mmdb dashboard external op clean

OUT_DIR := out
RESOURCE_DIR := $(OUT_DIR)/res
DASHBOARD_DIR := $(RESOURCE_DIR)/dashboard

all: binary mmdb dashboard external op

binary: $(OUT_DIR)/core $(OUT_DIR)/yq

# Mihomo (Clash Meta)
$(OUT_DIR)/core:
	@echo "Downloading Mihomo to $(OUT_DIR)..."
	@mkdir -p $(OUT_DIR)
	@LATEST_URL=$$(curl -s https://api.github.com/repos/MetaCubeX/mihomo/releases/latest | grep "browser_download_url.*linux-amd64-v.*gz\"" | cut -d '"' -f 4); \
	wget -O $(OUT_DIR)/core.gz $$LATEST_URL && \
	gzip -d $(OUT_DIR)/core.gz && \
	chmod +x $(OUT_DIR)/core

# yq
$(OUT_DIR)/yq:
	@echo "Downloading yq to $(OUT_DIR)..."
	@mkdir -p $(OUT_DIR)
	@LATEST_URL=$$(curl -s https://api.github.com/repos/mikefarah/yq/releases/latest | grep "browser_download_url.*yq_linux_amd64\"" | cut -d '"' -f 4); \
	wget -O $(OUT_DIR)/yq $$LATEST_URL && \
	chmod +x $(OUT_DIR)/yq

# country.mmdb, geosite.dat, asn.mmdb
mmdb: $(RESOURCE_DIR)/country.mmdb $(RESOURCE_DIR)/geosite.dat $(RESOURCE_DIR)/asn.mmdb

$(RESOURCE_DIR)/country.mmdb:
	@mkdir -p $(RESOURCE_DIR)
	@wget -nc -O $@ https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/country.mmdb

$(RESOURCE_DIR)/geosite.dat:
	@mkdir -p $(RESOURCE_DIR)
	@wget -nc -O $@ https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat

$(RESOURCE_DIR)/asn.mmdb:
	@mkdir -p $(RESOURCE_DIR)
	@wget -nc -O $@ https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-ASN.mmdb

# Dashboard targets
dashboard: $(DASHBOARD_DIR)/yacd-meta \
           $(DASHBOARD_DIR)/metacubexd \
           $(DASHBOARD_DIR)/zashboard

$(DASHBOARD_DIR)/yacd-meta:
	@echo "Installing yacd-meta..."
	@mkdir -p $(DASHBOARD_DIR)
	@wget -O $(OUT_DIR)/yacd-meta.zip https://github.com/MetaCubeX/yacd/archive/gh-pages.zip && \
	unzip -q $(OUT_DIR)/yacd-meta.zip -d $(OUT_DIR) && \
	mv $(OUT_DIR)/Yacd-meta-gh-pages $@ && \
	rm -f $(OUT_DIR)/yacd-meta.zip

$(DASHBOARD_DIR)/metacubexd:
	@echo "Installing metacubexd..."
	@mkdir -p $(DASHBOARD_DIR)
	@wget -O $(OUT_DIR)/metacubexd.zip https://github.com/MetaCubeX/metacubexd/archive/refs/heads/gh-pages.zip && \
	unzip -q $(OUT_DIR)/metacubexd.zip -d $(OUT_DIR) && \
	mv $(OUT_DIR)/metacubexd-gh-pages $@ && \
	rm -f $(OUT_DIR)/metacubexd.zip

$(DASHBOARD_DIR)/zashboard:
	@echo "Installing zashboard..."
	@mkdir -p $(DASHBOARD_DIR)
	@wget -O $(OUT_DIR)/zashboard.zip https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip && \
	unzip -q $(OUT_DIR)/zashboard.zip -d $(OUT_DIR) && \
	mv $(OUT_DIR)/dist $@ && \
	rm -f $(OUT_DIR)/zashboard.zip

# External controller
external: $(OUT_DIR)/external

$(OUT_DIR)/external:
	@echo "Installing external controller..."
	@mkdir -p $(OUT_DIR)
	@wget -O $(OUT_DIR)/external.zip https://github.com/chenx-dust/DeckyClash/archive/gh-pages.zip && \
	unzip -q $(OUT_DIR)/external.zip -d $(OUT_DIR) && \
	mv $(OUT_DIR)/DeckyClash-gh-pages $@ && \
	rm -f $(OUT_DIR)/external.zip

# Override profile
op: $(RESOURCE_DIR)/override.yaml

 $(RESOURCE_DIR)/override.yaml:
	@echo "Copying override profile..."
	@mkdir -p $(OUT_DIR)
	@cp ../override.yaml $@

# Clean command
clean:
	@echo "Removing ./out directory..."
	@rm -rf $(OUT_DIR)
