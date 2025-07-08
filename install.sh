#!/usr/bin/bash

set -e

AUTHOR="chenx-dust"
REPO_NAME="DeckyClash"
PACKAGE="DeckyClash"
GITHUB_BASE_URL=${OVERRIDE_GITHUB_BASE_URL:-"https://github.com"}
API_BASE_URL=${OVERRIDE_API_BASE_URL:-"https://api.github.com"}
SCRIPT_URL="${GITHUB_BASE_URL}/${AUTHOR}/${REPO_NAME}/raw/refs/heads/main/install.sh"
BASE_DIR=${OVERRIDE_BASE_DIR:-"${HOME}/homebrew"}
PLUGIN_DIR=${OVERRIDE_PLUGIN_DIR:-"${BASE_DIR}/plugins/${PACKAGE}"}
DATA_DIR=${OVERRIDE_DATA_DIR:-"${BASE_DIR}/data/${PACKAGE}"}
CLEAN_DIRS=(
  "${PLUGIN_DIR}"
  "${DATA_DIR}"
  "${BASE_DIR}/settings/${PACKAGE}"
  "${BASE_DIR}/logs/${PACKAGE}"
)
SUDO="sudo"

function usage() {
  echo "Usage: install.sh [options]"
  echo "       curl -L ${SCRIPT_URL} | bash [-s -- [options]]"
  echo
  echo "Options:"
  echo "  -h, --help                  Show this help message and exit"
  echo "  -y, --yes                   Assume yes for all prompts, except specified by args"
  echo "  -v, --version <version>     Specify version"
  echo "      --no-privilege          Run without sudo"
  echo "      --without-plugin        Skip installing ${PACKAGE} plugin"
  echo "      --without-binary        Skip installing Mihomo and yq"
  echo "      --without-geo           Skip installing country.mmdb, geosite.dat and asn.mmdb"
  echo "      --without-dashboard     Skip installing dashboards"
  echo "      --without-restart       Skip restarting Decky Loader"
  echo "      --clean                 Remove all plugin files (includes config) before installing"
  echo "      --clean-uninstall       Uninstall and remove all plugin files (includes config)"
  echo
  echo "Environment Variables:"
  echo '  OVERRIDE_GITHUB_BASE_URL    Override default: "https://github.com"'
  echo '  OVERRIDE_API_BASE_URL       Override default: "https://api.github.com"'
  echo '  OVERRIDE_BASE_DIR           Override default: "${HOME}/homebrew"'
  echo '  OVERRIDE_PLUGIN_DIR         Override default: "${BASE_DIR}/plugins/${PACKAGE}"'
  echo '  OVERRIDE_DATA_DIR           Override default: "${BASE_DIR}/data/${PACKAGE}"'
  echo
  echo "Examples:"
  echo "  Basic install:   curl -L ${SCRIPT_URL} | bash"
  echo "  Clean install:   curl -L ${SCRIPT_URL} | bash -s -- --clean"
  echo "  Clean uninstall: curl -L ${SCRIPT_URL} | bash -s -- --clean-uninstall"
  echo "  Update blobs:    curl -L ${SCRIPT_URL} | bash -s -- --without-plugin --without-restart"
  echo "  Nightly version: curl -L ${SCRIPT_URL} | bash -s -- --version nightly"
}

function prompt_continue() {
  local bypass_flag=$1
  if [ "$bypass_flag" = "true" ]; then
    echo "Skip this step."
    false
    return
  fi
  if [ "$YES_ALL" = "true" ]; then
    true
    return
  fi

  local response
  read -p "Do you want to continue? [Y/n] " response

  # Convert the response to lowercase
  response=${response,,}

  # Check the response
  if [[ -z "$response" || "$response" == "y" || "$response" == "yes" ]]; then
    true
  elif [[ "$response" == "n" || "$response" == "no" ]]; then
    echo "Skip this step."
    false
  else
    echo "Invalid response. Not continuing."
    false
  fi
}

function clean_all {
  for dir in "${CLEAN_DIRS[@]}"; do
    if [ -d "$dir" ]; then
      echo "Removing $dir ..."
      $SUDO rm -rf "$dir"
    fi
  done
}

while [[ $# -gt 0 ]]; do
  key=$1
  case $key in
    -y|--yes)
      YES_ALL=true
      shift
      ;;
    -v|--version)
      SPECIFIED_VERSION=$2
      shift
      shift
      ;;
    --no-privilege)
      SUDO=""
      shift
      ;;
    --without-plugin)
      WITHOUT_PLUGIN=true
      shift
      ;;
    --without-binary)
      WITHOUT_BINARY=true
      shift
      ;;
    --without-geo)
      WITHOUT_GEO=true
      shift
      ;;
    --without-dashboard)
      WITHOUT_DASHBOARD=true
      shift
      ;;
    --without-restart)
      WITHOUT_RESTART=true
      shift
      ;;
    --clean)
      clean_all
      shift
      ;;
    --clean-uninstall)
      clean_all
      exit 0
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $key"
      echo
      usage
      exit 1
      ;;
  esac
done

if [ "$UID" -eq 0 ]; then
  echo "WARNING: Running as root."
  echo "This may cause permission issues."
  echo "If you insist to continue, please confirm homebrew path below is correct:"
  echo "${BASE_DIR}"
  echo "In most circumstances, this should NOT be: /root/homebrew"
  echo "You SHOULD run sudo with -E flag to preserve environment variables."
  echo
  if ! prompt_continue; then
    exit 1
  fi
fi

TEMP_DIR=$(mktemp -d)

function finish() {
    rm -rf "$TEMP_DIR"
}
trap finish EXIT

REQUIREMENTS=("curl" "unzip" "tar" "gzip")
for req in "${REQUIREMENTS[@]}"; do
  if ! command -v $req &> /dev/null; then
    echo "Error: $req is not installed"
    exit 1
  fi
done

echo "LEGAL NOTICE:"
echo "By confirming installation, you agree to the terms of the software and service license."
echo
echo "Installing $REPO_NAME ..."
if prompt_continue $WITHOUT_PLUGIN; then
  if [ -z "${SPECIFIED_VERSION}"]; then
    API_URL="${API_BASE_URL}/repos/${AUTHOR}/${REPO_NAME}/releases/latest"
    RELEASE=$(curl -s "$API_URL")
    MESSAGE=$(echo "${RELEASE}" | grep "message" | cut -d '"' -f 4)
    RELEASE_VERSION=$(echo "${RELEASE}" | grep "tag_name" | cut -d '"' -f 4)
    RELEASE_URL=$(echo "${RELEASE}" | grep "browser_download_url.*DeckyClash.zip\"" | cut -d '"' -f 4)

    if [[ "${MESSAGE}" != "" ]]; then
      echo "Github Error: ${MESSAGE}" >&2
      exit 1
    fi
    echo "Version: ${RELEASE_VERSION}"
  else
    RELEASE_URL="${GITHUB_BASE_URL}/${AUTHOR}/${REPO_NAME}/releases/download/${SPECIFIED_VERSION}/${PACKAGE}.zip"
  fi
  if [ -z "${RELEASE_URL}" ]; then
    echo "Failed to get latest release" >&2
    exit 1
  fi

  DL_DEST="${TEMP_DIR}/${PACKAGE}.zip"
  wget -O "${DL_DEST}" "${RELEASE_URL}"
  unzip -oq "${DL_DEST}" -d "${TEMP_DIR}"
  $SUDO rm -rf "${PLUGIN_DIR}"
  $SUDO mv "${TEMP_DIR}/${PACKAGE}" "${PLUGIN_DIR}"
  $SUDO chmod +w "${PLUGIN_DIR}"
fi

echo "Installing Binaries ..."
if prompt_continue $WITHOUT_BINARY; then
  BIN_DIR="${PLUGIN_DIR}/bin"
  mkdir -p "${BIN_DIR}"
  $SUDO chmod +w "${BIN_DIR}"
	echo "Installing Mihomo ..."

  RELEASE=$(curl -s "${API_BASE_URL}/repos/MetaCubeX/mihomo/releases/latest")
  MESSAGE=$(echo "${RELEASE}" | grep "message" | cut -d '"' -f 4)
  RELEASE_VERSION=$(echo "${RELEASE}" | grep "tag_name" | cut -d '"' -f 4)
	RELEASE_URL=$(echo "${RELEASE}" | grep "browser_download_url.*linux-amd64-v.*gz\"" | cut -d '"' -f 4);

  if [[ "${MESSAGE}" != "" ]]; then
    echo "Github Error: ${MESSAGE}" >&2
    exit 1
  fi
  if [ -z "${RELEASE_URL}" ]; then
    echo "Failed to get latest release" >&2
    exit 1
  fi
  echo "Version: ${RELEASE_VERSION}"

  DL_DEST="${TEMP_DIR}/mihomo.gz"
  INSTALL_DEST="${BIN_DIR}/mihomo"
  wget -O "${DL_DEST}" "${RELEASE_URL}"
	gzip -d "${DL_DEST}"
  $SUDO rm -f "${INSTALL_DEST}"
  mv "${TEMP_DIR}/mihomo" "${INSTALL_DEST}"
	chmod +x "${INSTALL_DEST}"

	echo "Installing yq ..."
  RELEASE=$(curl -s "${API_BASE_URL}/repos/mikefarah/yq/releases/latest")
  MESSAGE=$(echo "${RELEASE}" | grep "message" | cut -d '"' -f 4)
  RELEASE_VERSION=$(echo "${RELEASE}" | grep "tag_name" | cut -d '"' -f 4)
	RELEASE_URL=$(echo "${RELEASE}" | grep "browser_download_url.*yq_linux_amd64\"" | cut -d '"' -f 4);

  if [[ "${MESSAGE}" != "" ]]; then
    echo "Github Error: ${MESSAGE}" >&2
    exit 1
  fi
  if [ -z "${RELEASE_URL}" ]; then
    echo "Failed to get latest release" >&2
    exit 1
  fi
  echo "Version: ${RELEASE_VERSION}"

  DEST="${BIN_DIR}/yq"
  $SUDO rm -f "${DEST}"
	wget -O "${DEST}" "${RELEASE_URL}"
	chmod +x "${DEST}"
fi

echo "Installing Geos ..."
if prompt_continue $WITHOUT_GEO; then
  $SUDO mkdir -p "${DATA_DIR}"
  $SUDO chmod +w "${DATA_DIR}"

  echo "Downloading country.mmdb ..."
  RELEASE_URL="${GITHUB_BASE_URL}/MetaCubeX/meta-rules-dat/releases/download/latest/country.mmdb"
  DEST="${DATA_DIR}/country.mmdb"
  $SUDO rm -f "${DEST}"
	wget -O "${DEST}" "${RELEASE_URL}"

  echo "Downloading geosite.dat ..."
  RELEASE_URL="${GITHUB_BASE_URL}/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat"
  DEST="${DATA_DIR}/geosite.dat"
  $SUDO rm -f "${DEST}"
	wget -O "${DEST}" "${RELEASE_URL}"

  echo "Downloading asn.mmdb ..."
  RELEASE_URL="${GITHUB_BASE_URL}/MetaCubeX/meta-rules-dat/releases/download/latest/GeoLite2-ASN.mmdb"
  DEST="${DATA_DIR}/asn.mmdb"
  $SUDO rm -f "${DEST}"
	wget -O "${DEST}" "${RELEASE_URL}"
fi

echo "Installing Dashboards ..."
if prompt_continue $WITHOUT_DASHBOARD; then
  DASHBOARD_DIR="${DATA_DIR}/dashboard"
  $SUDO mkdir -p "${DASHBOARD_DIR}"
  $SUDO chmod +w "${DASHBOARD_DIR}"

	echo "Installing yacd-meta..."
  DL_DEST="${TEMP_DIR}/yacd-meta.zip"
  INSTALL_DEST="${DASHBOARD_DIR}/yacd-meta"
	wget -O "${DL_DEST}" ${GITHUB_BASE_URL}/MetaCubeX/yacd/archive/gh-pages.zip
	unzip -oq "${DL_DEST}" -d "${TEMP_DIR}"
  $SUDO rm -rf "${INSTALL_DEST}"
	mv "${TEMP_DIR}/Yacd-meta-gh-pages" "${INSTALL_DEST}"

	echo "Installing metacubexd..."
  DL_DEST="${TEMP_DIR}/metacubexd.zip"
  INSTALL_DEST="${DASHBOARD_DIR}/metacubexd"
	wget -O "${DL_DEST}" ${GITHUB_BASE_URL}/MetaCubeX/metacubexd/archive/refs/heads/gh-pages.zip
	unzip -oq "${DL_DEST}" -d "${TEMP_DIR}"
  $SUDO rm -rf "${INSTALL_DEST}"
	mv "${TEMP_DIR}/metacubexd-gh-pages" "${INSTALL_DEST}"

	echo "Installing zashboard..."
  DL_DEST="${TEMP_DIR}/zashboard.zip"
  INSTALL_DEST="${DASHBOARD_DIR}/zashboard"
	wget -O "${DL_DEST}" ${GITHUB_BASE_URL}/Zephyruso/zashboard/releases/latest/download/dist.zip
	unzip -oq "${DL_DEST}" -d "${TEMP_DIR}"
  $SUDO rm -rf "${INSTALL_DEST}"
	mv "${TEMP_DIR}/dist" "${INSTALL_DEST}"
fi

echo "Installation complete."
echo
echo "Restarting Decky Loader ..."
if prompt_continue $WITHOUT_RESTART; then
  $SUDO systemctl restart plugin_loader.service
fi
