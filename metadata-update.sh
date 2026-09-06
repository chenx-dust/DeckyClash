#!/bin/bash

set -e
set -o pipefail

function get_latest_json() {
    local repo_name="$1"
    curl -s "https://api.github.com/repos/${repo_name}/releases/latest"
}

function extract_tag() {
    local json="$1"
    echo "$json" | jq -r ".tag_name"
}

function extract_release_url() {
    local json="$1"
    local target_name="$2"
    echo "$json" | jq -r ".assets[] | select(.name == \"${target_name}\") | .browser_download_url"
}

function extract_release_sha256() {
    local json="$1"
    local target_name="$2"
    local digest=`echo "$json" | jq -r ".assets[] | select(.name == \"${target_name}\") | .digest"`
    echo ${digest#"sha256:"}
}

function get_commit_json() {
    local repo_name="$1"
    local branch="$2"
    curl -s "https://api.github.com/repos/${repo_name}/commits/${branch}"
}

function extract_commit_id() {
    local json="$1"
    echo "$json" | jq -r ".sha"
}

function extract_commit_url() {
    local json="$1"
    local target_name="$2"
    echo "$json" | jq -r ".files[] | select(.filename == \"${target_name}\") | .raw_url"
}

function get_archive_url() {
    local repo_name="$1"
    local commit_id="$2"
    echo "https://github.com/$1/archive/$2.zip"
}

function download_file() {
    local url="$1"
    local output="$2"
    echo "Downloading ..."
    curl -fsSL -o "$output" "$url"
}

function check_sha256() { 
    local file="$1"
    local digest="$2"
    echo "Checking SHA256 of $file ..."
    local file_digest
    file_digest=$(get_sha256 "$file") || return 1
    if [ "$digest" != "$file_digest" ]; then
        echo "SHA256 mismatch!"
        echo "Expected: $digest"
        echo "Actual: $file_digest"
        return 1
    else
        echo "SHA256 check passed!"
        return 0
    fi
}

function get_sha256() {
    local file="$1"
    sha256sum "$file" | cut -d ' ' -f 1
}

function edit_json() {
    local dest_name="$1"
    local url="$2"
    local sha256="$3"
    jq --arg name "$dest_name" \
        --arg url "$url" \
        --arg sha256hash "$sha256" \
        '.remote_binary = (.remote_binary | map(
            if .name == $name then
                .url = $url | .sha256hash = $sha256hash
            else
                .
            end
        ))' package.json > "${TEMP_DIR}/package.json"
    mv "${TEMP_DIR}/package.json" package.json
}

function update_geodata() {
    local repo_name="$1"
    local commit_id="$2"
    local file_name="$3"
    local dest_name="$4"
    local url="https://raw.githubusercontent.com/${repo_name}/${commit_id}/${file_name}"
    local digest
    local checksum_entry

    echo "Checking $repo_name $file_name ..."
    echo "URL: ${url}"
    download_file "${url}.sha256sum" "$TEMP_DIR/${dest_name}.sha256sum"
    read -r digest checksum_entry < "$TEMP_DIR/${dest_name}.sha256sum"
    if [[ ! "$digest" =~ ^[[:xdigit:]]{64}$ ]]; then
        echo "Invalid SHA256 for $file_name" >&2
        return 1
    fi
    digest=$(printf '%s' "$digest" | tr '[:upper:]' '[:lower:]')
    download_file "$url" "$TEMP_DIR/$dest_name"
    check_sha256 "$TEMP_DIR/$dest_name" "$digest"
    edit_json "$dest_name" "$url" "$digest"
    echo
}

TEMP_DIR=$(mktemp -d)
function finish() {
  rm -rf "$TEMP_DIR"
}
trap finish EXIT

REPO_NAME="MetaCubeX/mihomo"
DEST_NAME="mihomo.gz"
echo "Checking $REPO_NAME ..."
JSON=`get_latest_json "$REPO_NAME"`
TAG=`extract_tag "$JSON"`
echo "Latest release: ${TAG}"
FILE_NAME="mihomo-linux-amd64-${TAG}.gz"
URL=`extract_release_url "$JSON" "$FILE_NAME"`
echo "URL: ${URL}"
SHA256=`extract_release_sha256 "$JSON" "$FILE_NAME"`
echo "SHA256: ${SHA256}"
edit_json "$DEST_NAME" "$URL" "$SHA256"
echo

REPO_NAME="chenx-dust/meta-rules-dat"
JSON=`get_commit_json "$REPO_NAME" release`
COMMIT_ID=`extract_commit_id "$JSON"`
if [[ ! "$COMMIT_ID" =~ ^[[:xdigit:]]{40}$ ]]; then
    echo "Invalid commit ID for $REPO_NAME" >&2
    exit 1
fi
echo "Latest commit: ${COMMIT_ID}"
update_geodata "$REPO_NAME" "$COMMIT_ID" "geoip.dat" "GeoIP.dat"
update_geodata "$REPO_NAME" "$COMMIT_ID" "geosite.dat" "GeoSite.dat"
update_geodata "$REPO_NAME" "$COMMIT_ID" "GeoLite2-ASN.mmdb" "ASN.mmdb"
update_geodata "$REPO_NAME" "$COMMIT_ID" "BundleMRS.7z" "BundleMRS.7z"

REPO_NAME="haishanh/yacd"
DEST_NAME="yacd.zip"
echo "Checking $REPO_NAME ..."
JSON=`get_commit_json "$REPO_NAME" gh-pages`
COMMIT_ID=`extract_commit_id "$JSON"`
echo "Latest commit: ${COMMIT_ID}"
URL=`get_archive_url "$REPO_NAME" "$COMMIT_ID"`
echo "URL: ${URL}"
download_file "$URL" "$TEMP_DIR/$DEST_NAME"
SHA256=`get_sha256 "$TEMP_DIR/$DEST_NAME"`
echo "SHA256: ${SHA256}"
edit_json "$DEST_NAME" "$URL" "$SHA256"
echo

REPO_NAME="MetaCubeX/metacubexd"
DEST_NAME="metacubexd.zip"
echo "Checking $REPO_NAME ..."
JSON=`get_commit_json "$REPO_NAME" gh-pages`
COMMIT_ID=`extract_commit_id "$JSON"`
echo "Latest commit: ${COMMIT_ID}"
URL=`get_archive_url "$REPO_NAME" "$COMMIT_ID"`
echo "URL: ${URL}"
download_file "$URL" "$TEMP_DIR/$DEST_NAME"
SHA256=`get_sha256 "$TEMP_DIR/$DEST_NAME"`
echo "SHA256: ${SHA256}"
edit_json "$DEST_NAME" "$URL" "$SHA256"
echo

REPO_NAME="Zephyruso/zashboard"
FILE_NAME="dist-cdn-fonts.zip"
DEST_NAME="zashboard.zip"
echo "Checking $REPO_NAME ..."
JSON=`get_latest_json "$REPO_NAME"`
TAG=`extract_tag "$JSON"`
echo "Latest release: ${TAG}"
URL=`extract_release_url "$JSON" "$FILE_NAME"`
echo "URL: ${URL}"
SHA256=`extract_release_sha256 "$JSON" "$FILE_NAME"`
echo "SHA256: ${SHA256}"
edit_json "$DEST_NAME" "$URL" "$SHA256"
echo
