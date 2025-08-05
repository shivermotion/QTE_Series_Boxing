#!/bin/sh
set -e
set -u
set -o pipefail

function on_error {
  echo "$(realpath -mq "${0}"):$1: error: Unexpected failure"
}
trap 'on_error $LINENO' ERR


# This protects against multiple targets copying the same framework dependency at the same time. The solution
# was originally proposed here: https://lists.samba.org/archive/rsync/2008-February/020158.html
RSYNC_PROTECT_TMP_FILES=(--filter "P .*.??????")


variant_for_slice()
{
  case "$1" in
  "libcamutils.xcframework/ios-arm64")
    echo ""
    ;;
  "libcamutils.xcframework/ios-arm64_x86_64-simulator")
    echo "simulator"
    ;;
  "libfilamat.xcframework/ios-arm64")
    echo ""
    ;;
  "libfilamat.xcframework/ios-arm64_x86_64-simulator")
    echo "simulator"
    ;;
  "libshaders.xcframework/ios-arm64")
    echo ""
    ;;
  "libshaders.xcframework/ios-arm64_x86_64-simulator")
    echo "simulator"
    ;;
  "libsmol-v.xcframework/ios-arm64")
    echo ""
    ;;
  "libsmol-v.xcframework/ios-arm64_x86_64-simulator")
    echo "simulator"
    ;;
  "libfilabridge.xcframework/ios-arm64")
    echo ""
    ;;
  "libfilabridge.xcframework/ios-arm64_x86_64-simulator")
    echo "simulator"
    ;;
  "libfilament.xcframework/ios-arm64")
    echo ""
    ;;
  "libfilament.xcframework/ios-arm64_x86_64-simulator")
    echo "simulator"
    ;;
  "libbackend.xcframework/ios-arm64")
    echo ""
    ;;
  "libbackend.xcframework/ios-arm64_x86_64-simulator")
    echo "simulator"
    ;;
  "libfilabridge.xcframework/ios-arm64")
    echo ""
    ;;
  "libfilabridge.xcframework/ios-arm64_x86_64-simulator")
    echo "simulator"
    ;;
  "libfilaflat.xcframework/ios-arm64")
    echo ""
    ;;
  "libfilaflat.xcframework/ios-arm64_x86_64-simulator")
    echo "simulator"
    ;;
  "libibl.xcframework/ios-arm64")
    echo ""
    ;;
  "libibl.xcframework/ios-arm64_x86_64-simulator")
    echo "simulator"
    ;;
  "libgeometry.xcframework/ios-arm64")
    echo ""
    ;;
  "libgeometry.xcframework/ios-arm64_x86_64-simulator")
    echo "simulator"
    ;;
  "libgltfio_core.xcframework/ios-arm64")
    echo ""
    ;;
  "libgltfio_core.xcframework/ios-arm64_x86_64-simulator")
    echo "simulator"
    ;;
  "libdracodec.xcframework/ios-arm64")
    echo ""
    ;;
  "libdracodec.xcframework/ios-arm64_x86_64-simulator")
    echo "simulator"
    ;;
  "libuberarchive.xcframework/ios-arm64")
    echo ""
    ;;
  "libuberarchive.xcframework/ios-arm64_x86_64-simulator")
    echo "simulator"
    ;;
  "libstb.xcframework/ios-arm64")
    echo ""
    ;;
  "libstb.xcframework/ios-arm64_x86_64-simulator")
    echo "simulator"
    ;;
  "libimage.xcframework/ios-arm64")
    echo ""
    ;;
  "libimage.xcframework/ios-arm64_x86_64-simulator")
    echo "simulator"
    ;;
  "libktxreader.xcframework/ios-arm64")
    echo ""
    ;;
  "libktxreader.xcframework/ios-arm64_x86_64-simulator")
    echo "simulator"
    ;;
  "libbasis_transcoder.xcframework/ios-arm64")
    echo ""
    ;;
  "libbasis_transcoder.xcframework/ios-arm64_x86_64-simulator")
    echo "simulator"
    ;;
  "libuberzlib.xcframework/ios-arm64")
    echo ""
    ;;
  "libuberzlib.xcframework/ios-arm64_x86_64-simulator")
    echo "simulator"
    ;;
  "libzstd.xcframework/ios-arm64")
    echo ""
    ;;
  "libzstd.xcframework/ios-arm64_x86_64-simulator")
    echo "simulator"
    ;;
  "libutils.xcframework/ios-arm64")
    echo ""
    ;;
  "libutils.xcframework/ios-arm64_x86_64-simulator")
    echo "simulator"
    ;;
  esac
}

archs_for_slice()
{
  case "$1" in
  "libcamutils.xcframework/ios-arm64")
    echo "arm64"
    ;;
  "libcamutils.xcframework/ios-arm64_x86_64-simulator")
    echo "arm64 x86_64"
    ;;
  "libfilamat.xcframework/ios-arm64")
    echo "arm64"
    ;;
  "libfilamat.xcframework/ios-arm64_x86_64-simulator")
    echo "arm64 x86_64"
    ;;
  "libshaders.xcframework/ios-arm64")
    echo "arm64"
    ;;
  "libshaders.xcframework/ios-arm64_x86_64-simulator")
    echo "arm64 x86_64"
    ;;
  "libsmol-v.xcframework/ios-arm64")
    echo "arm64"
    ;;
  "libsmol-v.xcframework/ios-arm64_x86_64-simulator")
    echo "arm64 x86_64"
    ;;
  "libfilabridge.xcframework/ios-arm64")
    echo "arm64"
    ;;
  "libfilabridge.xcframework/ios-arm64_x86_64-simulator")
    echo "arm64 x86_64"
    ;;
  "libfilament.xcframework/ios-arm64")
    echo "arm64"
    ;;
  "libfilament.xcframework/ios-arm64_x86_64-simulator")
    echo "arm64 x86_64"
    ;;
  "libbackend.xcframework/ios-arm64")
    echo "arm64"
    ;;
  "libbackend.xcframework/ios-arm64_x86_64-simulator")
    echo "arm64 x86_64"
    ;;
  "libfilabridge.xcframework/ios-arm64")
    echo "arm64"
    ;;
  "libfilabridge.xcframework/ios-arm64_x86_64-simulator")
    echo "arm64 x86_64"
    ;;
  "libfilaflat.xcframework/ios-arm64")
    echo "arm64"
    ;;
  "libfilaflat.xcframework/ios-arm64_x86_64-simulator")
    echo "arm64 x86_64"
    ;;
  "libibl.xcframework/ios-arm64")
    echo "arm64"
    ;;
  "libibl.xcframework/ios-arm64_x86_64-simulator")
    echo "arm64 x86_64"
    ;;
  "libgeometry.xcframework/ios-arm64")
    echo "arm64"
    ;;
  "libgeometry.xcframework/ios-arm64_x86_64-simulator")
    echo "arm64 x86_64"
    ;;
  "libgltfio_core.xcframework/ios-arm64")
    echo "arm64"
    ;;
  "libgltfio_core.xcframework/ios-arm64_x86_64-simulator")
    echo "arm64 x86_64"
    ;;
  "libdracodec.xcframework/ios-arm64")
    echo "arm64"
    ;;
  "libdracodec.xcframework/ios-arm64_x86_64-simulator")
    echo "arm64 x86_64"
    ;;
  "libuberarchive.xcframework/ios-arm64")
    echo "arm64"
    ;;
  "libuberarchive.xcframework/ios-arm64_x86_64-simulator")
    echo "arm64 x86_64"
    ;;
  "libstb.xcframework/ios-arm64")
    echo "arm64"
    ;;
  "libstb.xcframework/ios-arm64_x86_64-simulator")
    echo "arm64 x86_64"
    ;;
  "libimage.xcframework/ios-arm64")
    echo "arm64"
    ;;
  "libimage.xcframework/ios-arm64_x86_64-simulator")
    echo "arm64 x86_64"
    ;;
  "libktxreader.xcframework/ios-arm64")
    echo "arm64"
    ;;
  "libktxreader.xcframework/ios-arm64_x86_64-simulator")
    echo "arm64 x86_64"
    ;;
  "libbasis_transcoder.xcframework/ios-arm64")
    echo "arm64"
    ;;
  "libbasis_transcoder.xcframework/ios-arm64_x86_64-simulator")
    echo "arm64 x86_64"
    ;;
  "libuberzlib.xcframework/ios-arm64")
    echo "arm64"
    ;;
  "libuberzlib.xcframework/ios-arm64_x86_64-simulator")
    echo "arm64 x86_64"
    ;;
  "libzstd.xcframework/ios-arm64")
    echo "arm64"
    ;;
  "libzstd.xcframework/ios-arm64_x86_64-simulator")
    echo "arm64 x86_64"
    ;;
  "libutils.xcframework/ios-arm64")
    echo "arm64"
    ;;
  "libutils.xcframework/ios-arm64_x86_64-simulator")
    echo "arm64 x86_64"
    ;;
  esac
}

copy_dir()
{
  local source="$1"
  local destination="$2"

  # Use filter instead of exclude so missing patterns don't throw errors.
  echo "rsync --delete -av "${RSYNC_PROTECT_TMP_FILES[@]}" --links --filter \"- CVS/\" --filter \"- .svn/\" --filter \"- .git/\" --filter \"- .hg/\" \"${source}*\" \"${destination}\""
  rsync --delete -av "${RSYNC_PROTECT_TMP_FILES[@]}" --links --filter "- CVS/" --filter "- .svn/" --filter "- .git/" --filter "- .hg/" "${source}"/* "${destination}"
}

SELECT_SLICE_RETVAL=""

select_slice() {
  local xcframework_name="$1"
  xcframework_name="${xcframework_name##*/}"
  local paths=("${@:2}")
  # Locate the correct slice of the .xcframework for the current architectures
  local target_path=""

  # Split archs on space so we can find a slice that has all the needed archs
  local target_archs=$(echo $ARCHS | tr " " "\n")

  local target_variant=""
  if [[ "$PLATFORM_NAME" == *"simulator" ]]; then
    target_variant="simulator"
  fi
  if [[ ! -z ${EFFECTIVE_PLATFORM_NAME+x} && "$EFFECTIVE_PLATFORM_NAME" == *"maccatalyst" ]]; then
    target_variant="maccatalyst"
  fi
  for i in ${!paths[@]}; do
    local matched_all_archs="1"
    local slice_archs="$(archs_for_slice "${xcframework_name}/${paths[$i]}")"
    local slice_variant="$(variant_for_slice "${xcframework_name}/${paths[$i]}")"
    for target_arch in $target_archs; do
      if ! [[ "${slice_variant}" == "$target_variant" ]]; then
        matched_all_archs="0"
        break
      fi

      if ! echo "${slice_archs}" | tr " " "\n" | grep -F -q -x "$target_arch"; then
        matched_all_archs="0"
        break
      fi
    done

    if [[ "$matched_all_archs" == "1" ]]; then
      # Found a matching slice
      echo "Selected xcframework slice ${paths[$i]}"
      SELECT_SLICE_RETVAL=${paths[$i]}
      break
    fi
  done
}

install_xcframework() {
  local basepath="$1"
  local name="$2"
  local package_type="$3"
  local paths=("${@:4}")

  # Locate the correct slice of the .xcframework for the current architectures
  select_slice "${basepath}" "${paths[@]}"
  local target_path="$SELECT_SLICE_RETVAL"
  if [[ -z "$target_path" ]]; then
    echo "warning: [CP] $(basename ${basepath}): Unable to find matching slice in '${paths[@]}' for the current build architectures ($ARCHS) and platform (${EFFECTIVE_PLATFORM_NAME-${PLATFORM_NAME}})."
    return
  fi
  local source="$basepath/$target_path"

  local destination="${PODS_XCFRAMEWORKS_BUILD_DIR}/${name}"

  if [ ! -d "$destination" ]; then
    mkdir -p "$destination"
  fi

  copy_dir "$source/" "$destination"
  echo "Copied $source to $destination"
}

install_xcframework "${PODS_ROOT}/../../node_modules/react-native-filament/ios/libs/filament/lib/libcamutils.xcframework" "react-native-filament/camutils" "library" "ios-arm64" "ios-arm64_x86_64-simulator"
install_xcframework "${PODS_ROOT}/../../node_modules/react-native-filament/ios/libs/filament/lib/libfilamat.xcframework" "react-native-filament/filamat" "library" "ios-arm64" "ios-arm64_x86_64-simulator"
install_xcframework "${PODS_ROOT}/../../node_modules/react-native-filament/ios/libs/filament/lib/libshaders.xcframework" "react-native-filament/filamat" "library" "ios-arm64" "ios-arm64_x86_64-simulator"
install_xcframework "${PODS_ROOT}/../../node_modules/react-native-filament/ios/libs/filament/lib/libsmol-v.xcframework" "react-native-filament/filamat" "library" "ios-arm64" "ios-arm64_x86_64-simulator"
install_xcframework "${PODS_ROOT}/../../node_modules/react-native-filament/ios/libs/filament/lib/libfilabridge.xcframework" "react-native-filament/filamat" "library" "ios-arm64" "ios-arm64_x86_64-simulator"
install_xcframework "${PODS_ROOT}/../../node_modules/react-native-filament/ios/libs/filament/lib/libfilament.xcframework" "react-native-filament/filament" "library" "ios-arm64" "ios-arm64_x86_64-simulator"
install_xcframework "${PODS_ROOT}/../../node_modules/react-native-filament/ios/libs/filament/lib/libbackend.xcframework" "react-native-filament/filament" "library" "ios-arm64" "ios-arm64_x86_64-simulator"
install_xcframework "${PODS_ROOT}/../../node_modules/react-native-filament/ios/libs/filament/lib/libfilabridge.xcframework" "react-native-filament/filament" "library" "ios-arm64" "ios-arm64_x86_64-simulator"
install_xcframework "${PODS_ROOT}/../../node_modules/react-native-filament/ios/libs/filament/lib/libfilaflat.xcframework" "react-native-filament/filament" "library" "ios-arm64" "ios-arm64_x86_64-simulator"
install_xcframework "${PODS_ROOT}/../../node_modules/react-native-filament/ios/libs/filament/lib/libibl.xcframework" "react-native-filament/filament" "library" "ios-arm64" "ios-arm64_x86_64-simulator"
install_xcframework "${PODS_ROOT}/../../node_modules/react-native-filament/ios/libs/filament/lib/libgeometry.xcframework" "react-native-filament/filament" "library" "ios-arm64" "ios-arm64_x86_64-simulator"
install_xcframework "${PODS_ROOT}/../../node_modules/react-native-filament/ios/libs/filament/lib/libgltfio_core.xcframework" "react-native-filament/gltfio_core" "library" "ios-arm64" "ios-arm64_x86_64-simulator"
install_xcframework "${PODS_ROOT}/../../node_modules/react-native-filament/ios/libs/filament/lib/libdracodec.xcframework" "react-native-filament/gltfio_core" "library" "ios-arm64" "ios-arm64_x86_64-simulator"
install_xcframework "${PODS_ROOT}/../../node_modules/react-native-filament/ios/libs/filament/lib/libuberarchive.xcframework" "react-native-filament/gltfio_core" "library" "ios-arm64" "ios-arm64_x86_64-simulator"
install_xcframework "${PODS_ROOT}/../../node_modules/react-native-filament/ios/libs/filament/lib/libstb.xcframework" "react-native-filament/gltfio_core" "library" "ios-arm64" "ios-arm64_x86_64-simulator"
install_xcframework "${PODS_ROOT}/../../node_modules/react-native-filament/ios/libs/filament/lib/libimage.xcframework" "react-native-filament/image" "library" "ios-arm64" "ios-arm64_x86_64-simulator"
install_xcframework "${PODS_ROOT}/../../node_modules/react-native-filament/ios/libs/filament/lib/libktxreader.xcframework" "react-native-filament/ktxreader" "library" "ios-arm64" "ios-arm64_x86_64-simulator"
install_xcframework "${PODS_ROOT}/../../node_modules/react-native-filament/ios/libs/filament/lib/libbasis_transcoder.xcframework" "react-native-filament/ktxreader" "library" "ios-arm64" "ios-arm64_x86_64-simulator"
install_xcframework "${PODS_ROOT}/../../node_modules/react-native-filament/ios/libs/filament/lib/libuberzlib.xcframework" "react-native-filament/uberz" "library" "ios-arm64" "ios-arm64_x86_64-simulator"
install_xcframework "${PODS_ROOT}/../../node_modules/react-native-filament/ios/libs/filament/lib/libzstd.xcframework" "react-native-filament/uberz" "library" "ios-arm64" "ios-arm64_x86_64-simulator"
install_xcframework "${PODS_ROOT}/../../node_modules/react-native-filament/ios/libs/filament/lib/libutils.xcframework" "react-native-filament/utils" "library" "ios-arm64" "ios-arm64_x86_64-simulator"

