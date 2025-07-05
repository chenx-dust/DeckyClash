#!/bin/bash

set -e

PACKAGE="DeckyClash"
BASE_DIR="${HOME}/homebrew"
PLUGIN_DIR="${BASE_DIR}/plugins/${PACKAGE}"

if [ ! -d "$BASE_DIR" ]; then
  echo "Directory ${BASE_DIR} does not exist."
  echo "Have you installed Decky Loader?"
  echo
  echo "Execute the following command to install Decky Loader:"
  echo "curl -L https://github.com/SteamDeckHomebrew/decky-installer/releases/latest/download/install_release.sh | sh"
  exit 1
fi

function prompt_continue() {
  local response
  read -p "Do you want to continue? [Y/n] " response

  # Convert the response to lowercase
  response=${response,,}

  # Check the response
  if [[ -z "$response" || "$response" == "y" || "$response" == "yes" ]]; then
    true
  elif [[ "$response" == "n" || "$response" == "no" ]]; then
    false
  else
    echo "Invalid response. Not continuing."
    false
  fi
}

REQUIREMENTS=("unzip")
for req in "${REQUIREMENTS[@]}"; do
  if ! command -v $req &> /dev/null; then
    echo "Error: $req is not installed"
    exit 1
  fi
done

TEMP_DIR=$(mktemp -d)
function finish() {
  rm -rf "$TEMP_DIR"
}
trap finish EXIT

echo "Unarchiving ..."
ZIPFILE="${TEMP_DIR}/archive.zip"
PAYLOAD_LINE=$(awk '/^__ZIPFILE_BELOW__/ { print NR + 1; exit 0; }' "$0")
tail -n +${PAYLOAD_LINE} "$0" > "${ZIPFILE}"
unzip -oq "${ZIPFILE}" -d "${TEMP_DIR}"

AUTHOR=$(cat "${TEMP_DIR}/homebrew/plugins/${PACKAGE}/plugin.json" | grep "author" | cut -d '"' -f 4)
VERSION=$(cat "${TEMP_DIR}/homebrew/plugins/${PACKAGE}/package.json" | grep "version" | cut -d '"' -f 4)
LICENSE=$(cat "${TEMP_DIR}/homebrew/plugins/${PACKAGE}/package.json" | grep "license" | cut -d '"' -f 4)

echo "Installing ${PACKAGE} v${VERSION} by ${AUTHOR} ..."
echo "License: ${LICENSE}"
echo
echo "By confirming installation, you agree to the terms of the software license."
if ! prompt_continue; then
  exit 0
fi

if [ -d "${PLUGIN_DIR}" ]; then
  echo "Removing existing plugin ..."
  rm -rf "${PLUGIN_DIR}" 2>/dev/null || sudo rm -rf "${PLUGIN_DIR}"
fi
if [ -d "${DATA_DIR}" ]; then
  echo "Removing existing data ..."
  rm -rf "${DATA_DIR}" 2>/dev/null || sudo rm -rf "${DATA_DIR}"
fi
cp -a "${TEMP_DIR}/homebrew/." "${BASE_DIR}"

echo
echo "Installation complete!"
echo
echo "Restarting Decky Loader ..."
if prompt_continue; then
  sudo systemctl restart plugin_loader.service
fi

exit 0

__ZIPFILE_BELOW__
