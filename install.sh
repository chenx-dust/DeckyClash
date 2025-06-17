#!/usr/bin/bash

set -e

if [ "$EUID" -eq 0 ]; then
  echo "Please do not run as root"
  exit
fi

TEMP_DIR=$(mktemp -d)

function cleanup() {
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

function check_requirement() {
    if ! command -v $1 &> /dev/null; then
        echo "Error: curl is not installed"
        exit 1
    fi
}
REQUIREMENTS=("curl" "unzip")
for req in "${REQUIREMENTS[@]}"; do
    check_requirement $req
done

AUTHOR="chenx-dust"
REPO_NAME="DeckyClash"
PACKAGE="DeckyClash"
API_URL="https://api.github.com/repos/${AUTHOR}/${REPO_NAME}/releases/latest"

echo "Installing $REPO_NAME"

PLUGIN_DIR="${HOME}/homebrew/plugins/${PACKAGE}"
mkdir -p $PLUGIN_DIR

USE_JQ=false
if [ -x "$(command -v jq)" ]; then
  USE_JQ=true
fi

USE_RSYNC=false
if [ -x "$(command -v rsync)" ]; then
  USE_RSYNC=true
fi

RELEASE=$(curl -s "$API_URL")

if [[ $USE_JQ == true ]]; then
  echo "Using jq"
  MESSAGE=$(echo "$RELEASE" | jq -r '.message')
  RELEASE_VERSION=$(echo "$RELEASE" | jq -r '.tag_name')
  RELEASE_URL=$(echo "$RELEASE" | jq -r '.assets[0].browser_download_url')
else
  echo "Using grep"
  MESSAGE=$(echo $RELEASE | grep "message" | cut -d '"' -f 4)
  RELEASE_URL=$(echo $RELEASE | grep "browser_download_url" | cut -d '"' -f 4)
  RELEASE_VERSION=$(echo $RELEASE | grep "tag_name" | cut -d '"' -f 4)
fi

if [[ "$MESSAGE" != "null" ]]; then
  echo "Error: $MESSAGE" >&2
  exit 1
fi

if [ -z "$RELEASE_URL" ]; then
  echo "Failed to get latest release" >&2
  exit 1
fi

DL_DEST="${TEMP_DIR}/${PACKAGE}.zip"

echo "Downloading $PACKAGE $RELEASE_VERSION"
curl -L "$RELEASE_URL" -o "$DL_DEST"

unzip "$DL_DEST" -d $TEMP_DIR
if [[ $USE_RSYNC == true ]]; then
  echo "Using rsync"
  rsync -av "${TEMP_DIR}/${PACKAGE}/" $PLUGIN_DIR --delete
else
  echo "Using cp"
  rm -rf $PLUGIN_DIR/*
  cp -R "${TEMP_DIR}/${PACKAGE}/*" $PLUGIN_DIR
fi

sudo systemctl restart plugin_loader.service
